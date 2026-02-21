import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import type { UserRole, UserProfile } from '@/lib/supabase';

/**
 * Role hierarchy definition
 * Lower numbers = higher permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 0,
  moderator: 1,
  member: 2,
};

/**
 * Permission definitions for different actions
 */
export const PERMISSIONS = {
  // Article management
  APPROVE_ARTICLES: ['admin', 'moderator'] as UserRole[],
  REJECT_ARTICLES: ['admin', 'moderator'] as UserRole[],
  DELETE_ARTICLES: ['admin'] as UserRole[],
  EDIT_ANY_ARTICLE: ['admin', 'moderator'] as UserRole[],

  // User management
  MANAGE_USERS: ['admin'] as UserRole[],
  BAN_USERS: ['admin', 'moderator'] as UserRole[],
  VIEW_USER_DETAILS: ['admin', 'moderator'] as UserRole[],

  // Dashboard access
  ADMIN_DASHBOARD: ['admin'] as UserRole[],
  MODERATOR_DASHBOARD: ['admin', 'moderator'] as UserRole[],

  // Library management
  MANAGE_LIBRARY: ['admin', 'moderator'] as UserRole[],
  APPROVE_LIBRARY_ITEMS: ['admin', 'moderator'] as UserRole[],

  // System administration
  SYSTEM_SETTINGS: ['admin'] as UserRole[],
  VIEW_ANALYTICS: ['admin', 'moderator'] as UserRole[],
  MANAGE_ROLES: ['admin'] as UserRole[],
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(
  userRole: UserRole | null,
  permission: PermissionKey
): boolean {
  if (!userRole) return false;
  return PERMISSIONS[permission].includes(userRole);
}

/**
 * Check if a user role has equal or higher privileges than a target role
 */
function hasRoleOrHigher(
  userRole: UserRole | null,
  targetRole: UserRole
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a user role is exactly one of the specified roles
 */
function _hasExactRole(
  userRole: UserRole | null,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Get user role from database by user ID
 */
async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return userProfile.role || 'member';
  } catch (error) {
    console.error('Failed to get user role:', error);
    return null;
  }
}

/**
 * Get user profile with role information
 */
async function _getUserWithRole(userId: string): Promise<UserProfile | null> {
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile with role:', error);
      return null;
    }

    return userProfile;
  } catch (error) {
    console.error('Failed to get user with role:', error);
    return null;
  }
}

/**
 * Server-side role verification for API routes
 */
export async function verifyUserRole(
  userId: string,
  requiredPermission: PermissionKey
): Promise<{ hasAccess: boolean; userRole: UserRole | null; error?: string }> {
  try {
    const userRole = await getUserRole(userId);

    if (!userRole) {
      return {
        hasAccess: false,
        userRole: null,
        error: 'User role not found',
      };
    }

    const hasAccess = hasPermission(userRole, requiredPermission);

    return {
      hasAccess,
      userRole,
    };
  } catch (error) {
    console.error('Role verification error:', error);
    return {
      hasAccess: false,
      userRole: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Admin-only role verification using service role
 */
async function _verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const { data: userProfile, error } = await getSupabaseAdmin()
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error verifying admin role:', error);
      return false;
    }

    return userProfile.role === 'admin';
  } catch (error) {
    console.error('Failed to verify admin role:', error);
    return false;
  }
}

/**
 * Bulk role verification for multiple users
 */
async function _verifyMultipleUserRoles(
  userIds: string[]
): Promise<Record<string, UserRole | null>> {
  try {
    const { data: userProfiles, error } = await supabase
      .from('users')
      .select('id, role')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching multiple user roles:', error);
      return {};
    }

    const roleMap: Record<string, UserRole | null> = {};
    userProfiles.forEach((profile) => {
      roleMap[profile.id] = profile.role || 'member';
    });

    return roleMap;
  } catch (error) {
    console.error('Failed to verify multiple user roles:', error);
    return {};
  }
}

/**
 * Role hierarchy utilities
 */
const _RoleUtils = {
  /**
   * Get all roles with equal or lower privileges
   */
  getRolesAtOrBelow(role: UserRole): UserRole[] {
    const targetLevel = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
      .filter(([, level]) => level >= targetLevel)
      .map(([roleName]) => roleName as UserRole);
  },

  /**
   * Get all roles with higher privileges
   */
  getRolesAbove(role: UserRole): UserRole[] {
    const targetLevel = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
      .filter(([, level]) => level < targetLevel)
      .map(([roleName]) => roleName as UserRole);
  },

  /**
   * Get role display name
   */
  getRoleDisplayName(role: UserRole): string {
    const displayNames: Record<UserRole, string> = {
      admin: 'Administrator',
      moderator: 'Moderator',
      member: 'Member',
    };
    return displayNames[role];
  },

  /**
   * Get role description
   */
  getRoleDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
      admin: 'Full system access with all administrative privileges',
      moderator: 'Content moderation and user management capabilities',
      member: 'Standard user access with basic features',
    };
    return descriptions[role];
  },

  /**
   * Check if role change is allowed
   */
  canChangeRole(
    currentUserRole: UserRole,
    targetRole: UserRole,
    subjectRole: UserRole
  ): boolean {
    // Only admins can change roles to admin
    if (targetRole === 'admin' && currentUserRole !== 'admin') {
      return false;
    }

    // Users cannot promote someone to a role higher than their own
    if (ROLE_HIERARCHY[targetRole] < ROLE_HIERARCHY[currentUserRole]) {
      return false;
    }

    // Users cannot modify someone with equal or higher privileges (except admins)
    if (
      currentUserRole !== 'admin' &&
      ROLE_HIERARCHY[subjectRole] <= ROLE_HIERARCHY[currentUserRole]
    ) {
      return false;
    }

    return true;
  },
};

/**
 * Validation utilities for role-based operations
 */
export const RoleValidation = {
  /**
   * Validate article approval permissions
   */
  canApproveArticle(userRole: UserRole | null): boolean {
    return hasPermission(userRole, 'APPROVE_ARTICLES');
  },

  /**
   * Validate user management permissions
   */
  canManageUser(userRole: UserRole | null, targetUserRole: UserRole): boolean {
    if (!hasPermission(userRole, 'MANAGE_USERS')) return false;

    // Admins can manage anyone, others cannot manage equal or higher roles
    if (userRole === 'admin') return true;
    return hasRoleOrHigher(userRole, targetUserRole);
  },

  /**
   * Validate dashboard access
   */
  canAccessAdminDashboard(userRole: UserRole | null): boolean {
    return hasPermission(userRole, 'ADMIN_DASHBOARD');
  },

  canAccessModeratorDashboard(userRole: UserRole | null): boolean {
    return hasPermission(userRole, 'MODERATOR_DASHBOARD');
  },
};

/**
 * Error types for role verification
 */
class RoleError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_ROLE' | 'ROLE_NOT_FOUND' | 'VERIFICATION_FAILED',
    public requiredRole?: UserRole,
    public currentRole?: UserRole | null
  ) {
    super(message);
    this.name = 'RoleError';
  }
}

/**
 * Create standardized role error responses
 */
const _RoleErrors = {
  insufficientRole: (required: UserRole, current: UserRole | null) =>
    new RoleError(
      `Insufficient role. Required: ${required}, Current: ${current || 'none'}`,
      'INSUFFICIENT_ROLE',
      required,
      current
    ),

  roleNotFound: (userId: string) =>
    new RoleError(`Role not found for user: ${userId}`, 'ROLE_NOT_FOUND'),

  verificationFailed: (message: string) =>
    new RoleError(
      `Role verification failed: ${message}`,
      'VERIFICATION_FAILED'
    ),
};
