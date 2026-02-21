'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import FeaturedArticlesManager from '@/app/(admin)/admin/_components/FeaturedArticlesManager';

export default function FeaturedArticlesPage() {
  return (
    <ProtectedRoute requireAuth={true} requireRole="admin">
      <div className="min-h-screen bg-black">
        <FeaturedArticlesManager />
      </div>
    </ProtectedRoute>
  );
}
