'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import { hasPermission, type PermissionKey } from './role-verification';
import type { UserRole } from '@/lib/supabase';

/**
 * Props for AdminRouteWrapper component
 */
interface AdminRouteWrapperProps {
  children: ReactNode;
  /** Required permission for access */
  requiredPermission?: PermissionKey;
  /** Alternative required roles (if not using permission) */
  requiredRoles?: UserRole[];
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom access denied component */
  accessDeniedComponent?: ReactNode;
  /** Redirect URL on access denial */
  redirectOnDenied?: string;
  /** Show detailed error information */
  showDetailedErrors?: boolean;
}

/**
 * Enhanced loading component for admin routes
 */
const AdminLoadingComponent = () => (
  <FullScreenLoader message="Checking your permissions and role..." />
);

/**
 * Enhanced access denied component for admin routes
 */
interface AdminAccessDeniedProps {
  userRole: UserRole | null;
  requiredPermission?: PermissionKey;
  requiredRoles?: UserRole[];
  showDetailedErrors?: boolean;
}

const AdminAccessDeniedComponent: React.FC<AdminAccessDeniedProps> = ({
  userRole,
  requiredPermission,
  requiredRoles,
  showDetailedErrors = false,
}) => {
  const router = useRouter();

  const getRequiredRoleText = () => {
    if (requiredPermission) {
      return `Permission: ${requiredPermission}`;
    }
    if (requiredRoles) {
      return requiredRoles.join(', ');
    }
    return 'Admin';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this admin area.
          </p>

          {showDetailedErrors && (
            <div className="bg-gray-50 p-4 rounded-lg text-left mb-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Access Details:
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Your Role:</strong> {userRole || 'None'}
                </p>
                <p>
                  <strong>Required:</strong> {getRequiredRoleText()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/')}
            className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Home Page
          </button>
          <button
            onClick={() => router.back()}
            className="block w-full text-gray-500 px-4 py-2 rounded-md hover:text-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Role verification status component
 */
interface RoleStatusProps {
  userRole: UserRole | null;
  requiredPermission?: PermissionKey;
  requiredRoles?: UserRole[];
}

const RoleStatusIndicator: React.FC<RoleStatusProps> = ({
  userRole,
  requiredPermission,
  requiredRoles,
}) => {
  const hasAccess = requiredPermission
    ? hasPermission(userRole, requiredPermission)
    : requiredRoles
      ? requiredRoles.includes(userRole as UserRole)
      : userRole === 'admin';

  if (!hasAccess) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">Admin Access Verified</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Main AdminRouteWrapper component
 * Provides enhanced role-based access control for admin routes
 */
const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({
  children,
  requiredPermission = 'ADMIN_DASHBOARD',
  requiredRoles,
  loadingComponent,
  accessDeniedComponent,
  redirectOnDenied,
  showDetailedErrors = false,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);

  // Determine required roles based on permission or explicit roles
  const finalRequiredRoles =
    requiredRoles ||
    (requiredPermission
      ? (['admin'] as UserRole[])
      : (['admin'] as UserRole[]));

  // Check access based on permission or roles
  const hasAccess = () => {
    if (!user?.role) return false;

    if (requiredPermission) {
      return hasPermission(user.role as UserRole, requiredPermission);
    }

    return finalRequiredRoles.includes(user.role as UserRole);
  };

  // Handle access verification and redirects
  useEffect(() => {
    if (loading) return;

    setAccessChecked(true);

    // If access is denied and redirect is specified
    if (!hasAccess() && redirectOnDenied) {
      router.push(redirectOnDenied);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, redirectOnDenied, router]);

  // Show loading state
  if (loading || !accessChecked) {
    return loadingComponent || <AdminLoadingComponent />;
  }

  // Check if user has access
  if (!hasAccess()) {
    // If custom access denied component is provided
    if (accessDeniedComponent) {
      return <>{accessDeniedComponent}</>;
    }

    // If redirect is specified, don't show denied component (redirect handled in useEffect)
    if (redirectOnDenied) {
      return <AdminLoadingComponent />;
    }

    // Show default access denied component
    return (
      <AdminAccessDeniedComponent
        userRole={(user?.role as UserRole) || null}
        requiredPermission={requiredPermission}
        requiredRoles={finalRequiredRoles}
        showDetailedErrors={showDetailedErrors}
      />
    );
  }

  // User has access - render children with status indicator
  return (
    <>
      <RoleStatusIndicator
        userRole={(user?.role as UserRole) || null}
        requiredPermission={requiredPermission}
        requiredRoles={finalRequiredRoles}
      />
      {children}
    </>
  );
};

/**
 * Higher-order component for wrapping admin pages
 */
export function withAdminRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AdminRouteWrapperProps, 'children'> = {}
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedRoute requireAuth={true}>
        <AdminRouteWrapper {...options}>
          <Component {...props} />
        </AdminRouteWrapper>
      </ProtectedRoute>
    );
  };

  WrappedComponent.displayName = `withAdminRoute(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for checking admin access in components
 */
export function useAdminAccess(options: {
  requiredPermission?: PermissionKey;
  requiredRoles?: UserRole[];
}) {
  const { user, loading } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);

  const finalRequiredRoles = options.requiredRoles || (['admin'] as UserRole[]);

  const hasAccess = () => {
    if (!user?.role) return false;

    if (options.requiredPermission) {
      return hasPermission(user.role as UserRole, options.requiredPermission);
    }

    return finalRequiredRoles.includes(user.role as UserRole);
  };

  useEffect(() => {
    if (!loading) {
      setAccessChecked(true);
    }
  }, [loading]);

  return {
    hasAccess: hasAccess(),
    isLoading: loading || !accessChecked,
    userRole: (user?.role as UserRole) || null,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
  };
}
