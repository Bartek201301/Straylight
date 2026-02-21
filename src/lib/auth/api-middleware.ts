import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin, type UserRole } from '@/lib/supabase';
import { hasPermission, type PermissionKey } from './role-verification';

/**
 * API route protection options
 */
interface APIProtectionOptions {
  /** Required permission for API access */
  requiredPermission?: PermissionKey;
  /** Required roles (alternative to permission) */
  requiredRoles?: UserRole[];
  /** Allow requests without authentication */
  allowUnauthenticated?: boolean;
  /** Custom error messages */
  errorMessages?: {
    unauthorized?: string;
    forbidden?: string;
    roleInsufficient?: string;
  };
}

/**
 * Result of API authentication and authorization
 */
export interface APIAuthResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
  error?: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'ROLE_INSUFFICIENT' | 'INTERNAL_ERROR';
    message: string;
    status: number;
  };
}

/**
 * Extract and verify user session from request using proper Supabase server-side methods
 */
export async function authenticateAPIRequest(
  request: NextRequest
): Promise<APIAuthResult> {
  try {
    // console.log('🔍 Starting API authentication...');

    // Method 1: Try Authorization header first
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      // console.log('✅ Found Bearer token in Authorization header');
    }

    // Method 2: Extract session from cookies using Supabase's built-in method
    if (!token) {
      try {
        // Use Supabase admin client for server-side operations
        const supabaseServer = getSupabaseAdmin();

        const {
          data: { session },
          error: sessionError,
        } = await supabaseServer.auth.getSession();

        if (session?.access_token && !sessionError) {
          token = session.access_token;
          console.log(
            '✅ Found session token in cookies via Supabase server client'
          );
        } else if (sessionError) {
          console.warn('⚠️ Session extraction error:', sessionError.message);
        }
      } catch (sessionExtractError) {
        console.warn(
          '⚠️ Failed to extract session from cookies:',
          sessionExtractError
        );
      }
    }

    // Method 3: Manual cookie extraction as fallback (bez użycia entries())
    if (!token) {
      // console.log('🔍 Trying manual cookie extraction...');

      const possibleCookieNames = [
        'sb-access-token',
        'supabase-auth-token',
        'sb-localhost-auth-token',
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
        'supabase.auth.token',
        'sb-auth-token',
      ];

      for (const cookieName of possibleCookieNames) {
        const cookieValue = request.cookies.get(cookieName)?.value;
        if (cookieValue) {
          token = cookieValue;
          console.log(`🔑 Found auth token in cookie: ${cookieName}`);
          break;
        }
      }
    }

    if (!token) {
      console.log('❌ No authentication token found in any location');
      return {
        success: false,
        user: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
          status: 401,
        },
      };
    }

    // Verify token with Supabase using server-side admin client for better reliability
    console.log('🔐 Verifying token with Supabase...');
    const adminClient = getSupabaseAdmin();
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      console.error('🔐 Auth token verification failed:', {
        error: authError?.message,
        code: authError?.code,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 20) + '...',
      });

      return {
        success: false,
        user: null,
        error: {
          code: 'UNAUTHORIZED',
          message:
            authError?.message || 'Invalid or expired authentication token',
          status: 401,
        },
      };
    }

    console.log('✅ Token verified successfully for user:', user.email);

    // Get user role from database
    const { data: userProfile, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userProfile) {
      console.error('👤 Failed to fetch user profile:', {
        userId: user.id,
        error: roleError?.message,
        userEmail: user.email,
      });

      return {
        success: false,
        user: null,
        error: {
          code: 'INTERNAL_ERROR',
          message:
            roleError?.message ||
            'User profile not found. Please complete your profile setup.',
          status: 500,
        },
      };
    }

    console.log('✅ User authenticated successfully:', {
      userId: user.id,
      email: user.email,
      role: userProfile.role || 'member',
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: userProfile.role || 'member',
      },
    };
  } catch (error) {
    console.error('❌ API authentication error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });

    // Provide more specific error message
    let errorMessage = 'Internal authentication error';
    if (error instanceof Error) {
      errorMessage = `Authentication failed: ${error.message}`;
    }

    return {
      success: false,
      user: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: errorMessage,
        status: 500,
      },
    };
  }
}

/**
 * Verify API access based on role/permission requirements
 */
async function authorizeAPIRequest(
  request: NextRequest,
  options: APIProtectionOptions = {}
): Promise<APIAuthResult> {
  const {
    requiredPermission,
    requiredRoles,
    allowUnauthenticated = false,
    errorMessages = {},
  } = options;

  // Authenticate the request
  const authResult = await authenticateAPIRequest(request);

  // If authentication failed and unauthenticated access is not allowed
  if (!authResult.success && !allowUnauthenticated) {
    return authResult;
  }

  // If no specific role/permission required, return auth result
  if (!requiredPermission && !requiredRoles) {
    return authResult;
  }

  // If unauthenticated access is allowed but no user, return success
  if (allowUnauthenticated && !authResult.user) {
    return { success: true, user: null };
  }

  // Check role/permission requirements
  const user = authResult.user!;

  // Check permission-based access
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return {
      success: false,
      user: null,
      error: {
        code: 'FORBIDDEN',
        message:
          errorMessages.roleInsufficient ||
          `Insufficient permissions. Required: ${requiredPermission}`,
        status: 403,
      },
    };
  }

  // Check role-based access
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return {
      success: false,
      user: null,
      error: {
        code: 'ROLE_INSUFFICIENT',
        message:
          errorMessages.roleInsufficient ||
          `Insufficient role. Required: ${requiredRoles.join(' or ')}, Current: ${user.role}`,
        status: 403,
      },
    };
  }

  return authResult;
}

/**
 * Create standardized API error responses
 */
function createAPIErrorResponse(error: APIAuthResult['error']): NextResponse {
  if (!error) {
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }

  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    },
    { status: error.status }
  );
}

/**
 * Higher-order function to protect API routes
 */
function withAPIAuth(
  handler: (
    request: NextRequest,
    context: { user: NonNullable<APIAuthResult['user']> }
  ) => Promise<NextResponse>,
  options: APIProtectionOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const authResult = await authorizeAPIRequest(request, options);

      if (!authResult.success || !authResult.user) {
        return createAPIErrorResponse(authResult.error);
      }

      // Call the original handler with authenticated user
      return await handler(request, {
        ...context,
        user: authResult.user,
      });
    } catch (error) {
      console.error('API middleware error:', error);
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware for admin-only API routes
 */
export function withAdminAPIAuth(
  handler: (
    request: NextRequest,
    context: { user: NonNullable<APIAuthResult['user']> }
  ) => Promise<NextResponse>
) {
  return withAPIAuth(handler, {
    requiredRoles: ['admin'],
    errorMessages: {
      roleInsufficient: 'Admin access required for this operation',
    },
  });
}

/**
 * Middleware for moderator+ API routes (admin or moderator)
 */
function _withModeratorAPIAuth(
  handler: (
    request: NextRequest,
    context: { user: NonNullable<APIAuthResult['user']> }
  ) => Promise<NextResponse>
) {
  return withAPIAuth(handler, {
    requiredRoles: ['admin', 'moderator'],
    errorMessages: {
      roleInsufficient: 'Moderator or admin access required for this operation',
    },
  });
}

/**
 * Middleware for permission-based API routes
 */
function _withPermissionAPIAuth(
  permission: PermissionKey,
  handler: (
    request: NextRequest,
    context: { user: NonNullable<APIAuthResult['user']> }
  ) => Promise<NextResponse>
) {
  return withAPIAuth(handler, {
    requiredPermission: permission,
    errorMessages: {
      roleInsufficient: `Permission required: ${permission}`,
    },
  });
}

/**
 * Utility to get current user from API request
 */
async function getCurrentUser(request: NextRequest): Promise<{
  id: string;
  email: string;
  role: UserRole;
} | null> {
  const authResult = await authenticateAPIRequest(request);
  return authResult.success ? authResult.user : null;
}

/**
 * Check if current user has specific permission in API route
 */
async function _checkUserPermission(
  request: NextRequest,
  permission: PermissionKey
): Promise<boolean> {
  const user = await getCurrentUser(request);
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Server-side admin verification using service role
 */
async function _verifyAdminAccess(userId: string): Promise<boolean> {
  try {
    const { data: userProfile, error } = await getSupabaseAdmin()
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      console.error('Error verifying admin access:', error);
      return false;
    }

    return userProfile.role === 'admin';
  } catch (error) {
    console.error('Failed to verify admin access:', error);
    return false;
  }
}

/**
 * API route helper types
 */
type _AuthenticatedAPIHandler = (
  request: NextRequest,
  context: { user: NonNullable<APIAuthResult['user']> }
) => Promise<NextResponse>;

type _ProtectedAPIRoute = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

/**
 * Request context interface for typed API handlers
 */
interface _APIRequestContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  params?: Record<string, string>;
}

/**
 * Logging utilities for API middleware
 */
const _APIMiddlewareLogger = {
  /** Log successful API access */
  allowAccess: (
    method: string,
    path: string,
    userId: string,
    role: UserRole
  ) => {
    console.log(`✅ API Access: ${method} ${path}`, {
      userId,
      role,
      timestamp: new Date().toISOString(),
    });
  },

  /** Log API access denial */
  denyAccess: (
    method: string,
    path: string,
    reason: string,
    userId?: string
  ) => {
    console.log(`🚫 API Denied: ${method} ${path}`, {
      reason,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });
  },

  /** Log API authentication error */
  authError: (method: string, path: string, error: string) => {
    console.error(`❌ API Auth Error: ${method} ${path}`, {
      error,
      timestamp: new Date().toISOString(),
    });
  },
};
