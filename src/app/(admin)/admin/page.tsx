'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AuthLoadingSpinner from '@/components/ui/AuthLoadingSpinner';

function AdminRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main admin dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return <AuthLoadingSpinner message="Redirecting to admin dashboard..." />;
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAuth={true} requireRole="admin">
      <AdminRedirectContent />
    </ProtectedRoute>
  );
}
