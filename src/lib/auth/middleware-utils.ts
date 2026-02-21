import { NextRequest } from 'next/server';
import type { UserRole } from '@/lib/supabase';

/**
 * Enhanced route protection configuration
 */
interface RouteProtection {
  /** Routes that require authentication */
  authRequired: string[];
  /** Routes with specific role requirements */
  roleRequired: Record<string, UserRole[]>;
  /** Routes that require email verification */
  emailVerificationRequired: string[];
  /** Public routes accessible without auth */
  publicRoutes: string[];
  /** API routes that should bypass middleware */
  apiBypass: string[];
}

/**
 * Default route protection configuration
 */
export const DEFAULT_ROUTE_PROTECTION: RouteProtection = {
  authRequired: [
    '/home',
    '/dashboard',
    '/settings',
    '/admin',
    '/moderator',
    '/user',
    '/articles/create',
    '/articles/edit',
    '/write',
  ],

  roleRequired: {
    '/admin': ['admin'],
    '/admin/dashboard': ['admin'],
    '/admin/users': ['admin'],
    '/admin/settings': ['admin'],
    '/moderator': ['admin', 'moderator'],
    '/moderator/dashboard': ['admin', 'moderator'],
    '/moderator/articles': ['admin', 'moderator'],
    '/user/manage': ['admin', 'moderator'],
  },

  emailVerificationRequired: [
    '/home',
    '/dashboard',
    '/settings',
    '/articles/create',
    '/write',
    '/admin',
    '/moderator',
  ],

  publicRoutes: [
    '/about',
    '/contact',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/callback',
    '/access-denied',
    '/api/auth',
    '/quiz',
    '/quiz/questions',
    '/quiz/results',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],

  apiBypass: ['/api/auth/', '/api/health', '/api/public/'],
};

/**
 * Helper function to check if a path matches a route pattern
 */
function matchesRoute(pathname: string, route: string): boolean {
  // Exact match
  if (pathname === route) return true;

  // Wildcard match (route ends with *)
  if (route.endsWith('*')) {
    return pathname.startsWith(route.slice(0, -1));
  }

  // Prefix match (route ends with /)
  if (route.endsWith('/')) {
    return pathname.startsWith(route);
  }

  // Prefix match with slash
  return pathname.startsWith(route + '/');
}

/**
 * Check if route is public (no authentication required)
 */
export function isPublicRoute(
  pathname: string,
  config: RouteProtection = DEFAULT_ROUTE_PROTECTION
): boolean {
  return config.publicRoutes.some((route) => matchesRoute(pathname, route));
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(
  pathname: string,
  config: RouteProtection = DEFAULT_ROUTE_PROTECTION
): boolean {
  return config.authRequired.some((route) => matchesRoute(pathname, route));
}

/**
 * Get required roles for a route
 */
export function getRequiredRoles(
  pathname: string,
  config: RouteProtection = DEFAULT_ROUTE_PROTECTION
): UserRole[] | null {
  for (const [route, roles] of Object.entries(config.roleRequired)) {
    if (matchesRoute(pathname, route)) {
      return roles;
    }
  }
  return null;
}

/**
 * Check if route requires email verification
 */
export function requiresEmailVerification(
  pathname: string,
  config: RouteProtection = DEFAULT_ROUTE_PROTECTION
): boolean {
  return config.emailVerificationRequired.some((route) =>
    matchesRoute(pathname, route)
  );
}

/**
 * Check if API route should bypass middleware
 */
export function shouldBypassAPI(
  pathname: string,
  config: RouteProtection = DEFAULT_ROUTE_PROTECTION
): boolean {
  return config.apiBypass.some((route) => matchesRoute(pathname, route));
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  userRole: string | null | undefined,
  requiredRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Extract user information from Supabase cookies
 */
interface UserInfoFromCookies {
  isAuthenticated: boolean;
  role: UserRole | null;
  emailVerified: boolean;
  userId: string | null;
}

/**
 * Get user info from request cookies (simplified for middleware)
 */
export function getUserInfoFromCookies(
  request: NextRequest
): UserInfoFromCookies | null {
  try {
    // Get all cookies for debugging
    const allCookies = request.cookies.getAll();
    console.log(
      '🍪 Middleware: All cookies:',
      allCookies.map((c) => `${c.name}=${c.value.substring(0, 20)}...`)
    );

    // Check for Supabase session cookies - comprehensive patterns for v2
    const possibleAuthCookies = [
      'sb-access-token',
      'supabase-auth-token',
      'sb-localhost-auth-token',
      'supabase.auth.token',
      'sb-auth-token',
      // Supabase v2 patterns
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}-auth-token`,
      // Domain-based patterns
      'sb-straylight-auth-token',
      'supabase-access-token',
    ];

    const possibleRefreshCookies = [
      'sb-refresh-token',
      'supabase-refresh-token',
      'sb-localhost-refresh-token',
      'supabase.refresh-token',
      'sb-refresh',
      // Supabase v2 patterns
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}-refresh-token`,
      // Domain-based patterns
      'sb-straylight-refresh-token',
      'supabase-refresh-token',
    ];

    const accessToken = possibleAuthCookies
      .map((name) => request.cookies.get(name)?.value)
      .find((token) => token);

    const refreshToken = possibleRefreshCookies
      .map((name) => request.cookies.get(name)?.value)
      .find((token) => token);

    // Also check for any cookie that contains 'supabase' or 'auth'
    const _hasSupabaseCookie = allCookies.some(
      (cookie) =>
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('sb-')
    );

    // More specific check for Supabase JWT tokens (they typically start with 'eyJ')
    const hasJWTCookie = allCookies.some(
      (cookie) =>
        cookie.value.startsWith('eyJ') &&
        (cookie.name.includes('auth') ||
          cookie.name.includes('sb-') ||
          cookie.name.includes('supabase'))
    );

    // console.log('🔍 Middleware: Auth cookie found:', !!accessToken);
    // console.log('🔍 Middleware: Refresh cookie found:', !!refreshToken);
    // console.log('🔍 Middleware: Has any Supabase cookie:', hasSupabaseCookie);
    // console.log('🔍 Middleware: Has JWT-like cookie:', hasJWTCookie);
    // console.log(
    //   '🔍 Middleware: Cookie names found:',
    //   allCookies.map((c) => c.name)
    // );

    // Consider authenticated if we have any valid tokens or JWT-like cookies
    const hasAuthEvidence = accessToken || refreshToken || hasJWTCookie;

    if (!hasAuthEvidence) {
      console.log('❌ Middleware: No authentication evidence found');
      return null;
    }

    console.log('✅ Middleware: Authentication detected via cookies');
    return {
      isAuthenticated: true,
      role: null, // Will be verified client-side or in API routes
      emailVerified: true, // Will be verified client-side
      userId: null, // Would extract from JWT
    };
  } catch (error) {
    console.error(
      '❌ Middleware: Error extracting user info from cookies:',
      error
    );
    return null;
  }
}

/**
 * Check if request has valid session cookies
 */
export function hasValidSession(request: NextRequest): boolean {
  const userInfo = getUserInfoFromCookies(request);
  return userInfo?.isAuthenticated ?? false;
}

/**
 * Generate redirect URL with proper encoding
 */
function createRedirectURL(
  baseURL: string,
  targetPath: string,
  searchParams?: Record<string, string>
): URL {
  const url = new URL(baseURL);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url;
}

/**
 * Create standardized redirect responses
 */
export const MiddlewareRedirects = {
  /** Redirect to signin page */
  toSignIn: (request: NextRequest, returnUrl?: string) => {
    const redirectUrl = createRedirectURL(
      new URL('/auth/signin', request.url).toString(),
      request.nextUrl.pathname,
      returnUrl
        ? { redirect: returnUrl }
        : { redirect: request.nextUrl.pathname }
    );
    return redirectUrl;
  },

  /** Redirect to access denied page */
  toAccessDenied: (
    request: NextRequest,
    reason: string,
    details?: Record<string, string>
  ) => {
    const params = { reason, ...details };
    return createRedirectURL(
      new URL('/access-denied', request.url).toString(),
      request.nextUrl.pathname,
      params
    );
  },

  /** Redirect to email verification page */
  toEmailVerification: (request: NextRequest, returnUrl?: string) => {
    const redirectUrl = createRedirectURL(
      new URL('/auth/verify-email', request.url).toString(),
      request.nextUrl.pathname,
      returnUrl
        ? { redirect: returnUrl }
        : { redirect: request.nextUrl.pathname }
    );
    return redirectUrl;
  },

  /** Redirect authenticated users away from auth pages */
  fromAuthPages: (request: NextRequest) => {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/home';
    return new URL(decodeURIComponent(redirectTo), request.url);
  },
};

/**
 * Logging utilities for middleware
 */
export const MiddlewareLogger = {
  /** Log successful access */
  allowAccess: (pathname: string, userInfo?: UserInfoFromCookies | null) => {
    console.log(`✅ Middleware: Allowing access to ${pathname}`, {
      authenticated: userInfo?.isAuthenticated ?? false,
      role: userInfo?.role ?? 'none',
    });
  },

  /** Log authentication redirect */
  redirectAuth: (pathname: string) => {
    console.log(
      `🔒 Middleware: Redirecting unauthenticated user from ${pathname} to signin`
    );
  },

  /** Log role-based access denial */
  denyRole: (
    pathname: string,
    userRole: string | null,
    requiredRoles: UserRole[]
  ) => {
    console.log(
      `🚫 Middleware: Access denied for user role '${userRole}' on ${pathname}`,
      {
        required: requiredRoles,
        current: userRole,
      }
    );
  },

  /** Log email verification redirect */
  redirectEmailVerification: (pathname: string) => {
    console.log(
      `📧 Middleware: Redirecting unverified user from ${pathname} to email verification`
    );
  },

  /** Log auth page redirect */
  redirectFromAuthPage: (pathname: string, destination: string) => {
    console.log(
      `↪️ Middleware: Redirecting authenticated user from ${pathname} to ${destination}`
    );
  },

  /** Log middleware error */
  error: (error: unknown, pathname: string) => {
    console.error(`❌ Middleware error on ${pathname}:`, error);
  },
};
