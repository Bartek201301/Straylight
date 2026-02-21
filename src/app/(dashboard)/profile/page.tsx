'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function ProfileRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with settings tab active
    // We can't pass the tab directly via URL params, but the dashboard will load with settings
    // The user can easily click on Settings tab once there
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen pt-24 pb-8 bg-black flex items-center justify-center">
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
        <p className="text-white/80">Redirecting to Dashboard Settings...</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ProfileRedirectContent />
    </ProtectedRoute>
  );
}
