'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import PublicFooter from './PublicFooter';
import AuthenticatedFooter from './AuthenticatedFooter';

export default function ConditionalFooter() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Hide footer on quiz questions page
  if (pathname === '/quiz/questions') {
    return null;
  }

  // Show loading state or authenticated footer while loading
  if (loading) {
    return <PublicFooter />;
  }

  return user ? <AuthenticatedFooter /> : <PublicFooter />;
}
