'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import ClientOnlyAuth from '@/components/ui/ClientOnlyAuth';

/**
 * Renders global Navigation except for specific routes (e.g., auth screens).
 * Uses client-only rendering to prevent hydration mismatches.
 */
export default function ConditionalNavigation() {
  const pathname = usePathname();

  // Hide navigation on auth pages and quiz questions page
  if (
    pathname &&
    (pathname.startsWith('/auth/signin') ||
      pathname.startsWith('/auth/signup') ||
      pathname.startsWith('/auth/forgot-password') ||
      pathname.startsWith('/auth/reset-password') ||
      pathname === '/quiz/questions')
  ) {
    return null;
  }

  return (
    <ClientOnlyAuth
      fallback={
        // Render a basic navigation skeleton during SSR/initial load
        <div className="h-16 bg-black border-b border-neutral-800 flex items-center justify-between px-4 sm:px-6">
          <div className="h-8 w-32 bg-neutral-800 rounded animate-pulse" />
          <div className="flex space-x-4">
            <div className="h-8 w-20 bg-neutral-800 rounded animate-pulse" />
            <div className="h-8 w-20 bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
      }
    >
      <Navigation />
    </ClientOnlyAuth>
  );
}
