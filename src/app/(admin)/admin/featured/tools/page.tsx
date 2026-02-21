'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import FeaturedToolsManager from '@/app/(admin)/admin/_components/FeaturedToolsManager';

export default function FeaturedToolsPage() {
  return (
    <ProtectedRoute requireAuth={true} requireRole="admin">
      <div className="min-h-screen bg-black">
        <FeaturedToolsManager />
      </div>
    </ProtectedRoute>
  );
}
