'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { withAdminRoute } from '@/lib/auth/admin-route-wrapper';
import { supabase } from '@/lib/supabase';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

/**
 * Article statistics interface
 */
interface ArticleStats {
  pending: number;
  published: number;
  archived: number;
  draft: number;
  total: number;
}

/**
 * Admin Articles Management Page
 * Overview and navigation for article moderation features
 */
function AdminArticlesContent() {
  const [stats, setStats] = useState<ArticleStats>({
    pending: 0,
    published: 0,
    archived: 0,
    draft: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch article statistics
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get counts for each status
        const { data: pendingData, error: pendingError } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { data: publishedData, error: publishedError } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');

        const { data: archivedData, error: archivedError } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'archived');

        const { data: draftData, error: draftError } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'draft');

        if (pendingError || publishedError || archivedError || draftError) {
          throw new Error('Failed to fetch article statistics');
        }

        const pendingCount = pendingData?.length ?? 0;
        const publishedCount = publishedData?.length ?? 0;
        const archivedCount = archivedData?.length ?? 0;
        const draftCount = draftData?.length ?? 0;

        setStats({
          pending: pendingCount,
          published: publishedCount,
          archived: archivedCount,
          draft: draftCount,
          total: pendingCount + publishedCount + archivedCount + draftCount,
        });
      } catch (err) {
        console.error('Error fetching article stats:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load statistics'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <FullScreenLoader message="Loading article statistics..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Article Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and moderate all articles in the system
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800 font-medium">
                Error loading statistics
              </span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 bg-yellow-500 rounded-md">
                    <span className="text-white text-sm font-bold">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Review
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/articles/pending"
                  className="font-medium text-yellow-700 hover:text-yellow-900"
                >
                  Review now →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 bg-green-500 rounded-md">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Published
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.published}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/articles/published"
                  className="font-medium text-green-700 hover:text-green-900"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 bg-gray-500 rounded-md">
                    <span className="text-white text-sm font-bold">📝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Drafts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.draft}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/articles/drafts"
                  className="font-medium text-gray-700 hover:text-gray-900"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 bg-red-500 rounded-md">
                    <span className="text-white text-sm font-bold">🗄️</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Archived
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.archived}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/articles/archived"
                  className="font-medium text-red-700 hover:text-red-900"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 bg-blue-500 rounded-md">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Articles
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href="/admin/articles/all"
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  View all →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Primary Action: Review Pending */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-yellow-100 rounded-xl">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Review Pending Articles
                  </h3>
                  <p className="text-sm text-gray-500">
                    {stats.pending} articles waiting for approval
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/admin/articles/pending"
                  className="block w-full text-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  Start Review Process
                </Link>

                <div className="text-sm text-gray-600">
                  <p>• Approve or reject submitted articles</p>
                  <p>• Bulk actions for multiple articles</p>
                  <p>• Sortable and filterable list</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-100 rounded-xl">
                    <span className="text-2xl">🛠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bulk Operations
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage multiple articles at once
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/admin/articles/bulk"
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Bulk Actions
                </Link>

                <div className="text-sm text-gray-600">
                  <p>• Select multiple articles</p>
                  <p>• Apply status changes in bulk</p>
                  <p>• Export article reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Quick Navigation
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/articles/pending"
                className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <span className="text-2xl mb-2">⏳</span>
                <span className="text-sm font-medium text-gray-900">
                  Pending
                </span>
                <span className="text-xs text-gray-600">
                  {stats.pending} articles
                </span>
              </Link>

              <Link
                href="/admin/articles/published"
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mb-2">✅</span>
                <span className="text-sm font-medium text-gray-900">
                  Published
                </span>
                <span className="text-xs text-gray-600">
                  {stats.published} articles
                </span>
              </Link>

              <Link
                href="/admin/articles/drafts"
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl mb-2">📝</span>
                <span className="text-sm font-medium text-gray-900">
                  Drafts
                </span>
                <span className="text-xs text-gray-600">
                  {stats.draft} articles
                </span>
              </Link>

              <Link
                href="/admin/articles/archived"
                className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <span className="text-2xl mb-2">🗄️</span>
                <span className="text-sm font-medium text-gray-900">
                  Archived
                </span>
                <span className="text-xs text-gray-600">
                  {stats.archived} articles
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Role Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 bg-blue-500 rounded-full">
                <span className="text-white text-sm">ℹ️</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">
                Article Moderation Access
              </h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>
                  • This section requires <strong>APPROVE_ARTICLES</strong>{' '}
                  permission
                </p>
                <p>• Available to administrators and moderators</p>
                <p>• All moderation actions are logged for audit purposes</p>
                <p>• Changes are immediately reflected across the platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Export the admin articles page with role-based protection
 * Requires APPROVE_ARTICLES permission (admin or moderator)
 */
export default withAdminRoute(AdminArticlesContent, {
  requiredPermission: 'APPROVE_ARTICLES',
  showDetailedErrors: true,
});
