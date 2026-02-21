'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ClientOnlyAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Wrapper component that only renders children on the client-side after auth is initialized
 * Prevents hydration mismatches by ensuring server and client render the same content initially
 */
export default function ClientOnlyAuth({
  children,
  fallback = null,
  loadingComponent = null,
}: ClientOnlyAuthProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Set mounted flag after first client render
    setHasMounted(true);
  }, []);

  // During SSR and initial client render, show fallback to prevent hydration mismatch
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  // After mounted, show loading state if auth is still loading
  if (authLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Finally render children once everything is ready
  return <>{children}</>;
}
