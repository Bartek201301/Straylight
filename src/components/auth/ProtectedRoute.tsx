'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useIsAuthenticated } from '@/contexts/AuthContext';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// Types for protected route configuration
interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: string | string[];
  requireEmailVerification?: boolean;
  redirectTo?: string;
  loadingComponent?: ReactNode;
  fallbackComponent?: ReactNode;
}

// Default loading component
const DefaultLoadingComponent = () => (
  <FullScreenLoader message="Sprawdzanie uprawnień..." />
);

// Default access denied component
const DefaultAccessDeniedComponent = ({ reason }: { reason: string }) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center space-y-6 max-w-md">
      <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold font-inter text-white">
        Access Required
      </h1>
      <p className="text-white/70 font-source leading-relaxed">{reason}</p>
      <a
        href="/auth/signin"
        className="inline-block px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors font-semibold shadow-lg hover:shadow-xl"
      >
        Sign In to Continue
      </a>
      <p className="text-sm text-white/50">
        New to StrayLight?{' '}
        <a href="/auth/signup" className="text-white hover:underline">
          Create an account
        </a>
      </p>
    </div>
  </div>
);

// Main ProtectedRoute component
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  requireEmailVerification = false,
  redirectTo,
  loadingComponent,
  fallbackComponent,
}: ProtectedRouteProps) {
  const { user, loading, error } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const pathname = usePathname();

  // Helper function to check roles
  const hasRequiredRole = (
    userRole: string | null,
    requiredRole: string | string[]
  ): boolean => {
    if (!userRole) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }

    return userRole === requiredRole;
  };

  // Handle redirects
  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      const currentUrl = encodeURIComponent(pathname);
      const loginUrl = redirectTo || `/auth/signin?redirect=${currentUrl}`;
      router.push(loginUrl);
      return;
    }

    // If specific role is required but user doesn't have it
    if (
      requireRole &&
      isAuthenticated &&
      !hasRequiredRole(user?.role || null, requireRole)
    ) {
      const deniedUrl = redirectTo || `/access-denied?reason=insufficient_role`;
      router.push(deniedUrl);
      return;
    }

    // If email verification is required but email is not verified
    if (
      requireEmailVerification &&
      isAuthenticated &&
      !user?.email_confirmed_at
    ) {
      const verifyUrl = redirectTo || `/auth/verify-email`;
      router.push(verifyUrl);
      return;
    }
  }, [
    loading,
    isAuthenticated,
    requireAuth,
    requireRole,
    requireEmailVerification,
    user?.role,
    user?.email_confirmed_at,
    redirectTo,
    pathname,
    router,
  ]);

  // Show loading state
  if (loading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Błąd autoryzacji
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return (
      fallbackComponent || (
        <DefaultAccessDeniedComponent reason="Musisz być zalogowany, aby uzyskać dostęp do tej strony." />
      )
    );
  }

  // Check role requirement
  if (
    requireRole &&
    isAuthenticated &&
    !hasRequiredRole(user?.role || null, requireRole)
  ) {
    const roleText = Array.isArray(requireRole)
      ? requireRole.join(' lub ')
      : requireRole;

    return (
      fallbackComponent || (
        <DefaultAccessDeniedComponent
          reason={`Ta strona wymaga roli: ${roleText}. Twoja aktualna rola: ${user?.role || 'brak'}.`}
        />
      )
    );
  }

  // Check email verification requirement
  if (
    requireEmailVerification &&
    isAuthenticated &&
    !user?.email_confirmed_at
  ) {
    return (
      fallbackComponent || (
        <DefaultAccessDeniedComponent reason="Ta strona wymaga potwierdzenia adresu email. Sprawdź swoją skrzynkę odbiorczą." />
      )
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
