'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import FloatingChat from '@/components/chat/FloatingChat';

function isAllowedPath(pathname: string | null): boolean {
  if (!pathname) return false;

  // Excluded paths - chatbot should NOT appear on these pages
  if (pathname.startsWith('/write')) return false;
  if (pathname.startsWith('/dashboard')) return false;
  if (pathname.startsWith('/auth/signin')) return false;
  if (pathname.startsWith('/auth/signup')) return false;
  if (pathname === '/quiz/questions') return false;

  // API routes - chatbot should not appear
  if (pathname.startsWith('/api/')) return false;

  // Allow chatbot on all other pages
  return true;
}

export default function ConditionalFloatingChat() {
  const pathname = usePathname();
  if (!isAllowedPath(pathname)) return null;
  return <FloatingChat />;
}
