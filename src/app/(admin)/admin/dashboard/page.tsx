'use client';

import React, { lazy, Suspense } from 'react';
import { withAdminRoute } from '@/lib/auth/admin-route-wrapper';
import { useAdminAccess } from '@/lib/auth/admin-route-wrapper';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import DashboardSkeleton from '@/components/ui/skeletons/DashboardSkeleton';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// Lazy load heavy dashboard components
const RealtimeDashboardStats = lazy(
  () =>
    import('@/app/(admin)/admin/_components/dashboard/RealtimeDashboardStats')
);
const ComprehensiveDashboardStats = lazy(
  () =>
    import(
      '@/app/(admin)/admin/_components/dashboard/ComprehensiveDashboardStats'
    )
);

/**
 * Enhanced Admin Dashboard with role-based access control
 * Implements Task 14.1 requirements for editor dashboard access
 */
function AdminDashboardContent() {
  const { user } = useAuth();
  const { hasAccess, isLoading, userRole, isAdmin } = useAdminAccess({
    requiredPermission: 'ADMIN_DASHBOARD',
  });

  if (isLoading) {
    return <FullScreenLoader message="Loading Admin Dashboard" />;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage articles, users, and system settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  Role: {userRole} {isAdmin && '👑'}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Comprehensive Dashboard Stats */}
        <Suspense fallback={<DashboardSkeleton />}>
          <ComprehensiveDashboardStats className="mb-8" />
        </Suspense>

        {/* Legacy Real-time Dashboard Stats (can be removed once comprehensive is stable) */}
        <div className="mt-8">
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="font-medium text-gray-700 cursor-pointer">
              Legacy Dashboard (Basic Stats Only)
            </summary>
            <div className="mt-4">
              <Suspense
                fallback={
                  <div className="h-32 animate-pulse bg-gray-200 rounded"></div>
                }
              >
                <RealtimeDashboardStats />
              </Suspense>
            </div>
          </details>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Featured Articles Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-yellow-100 rounded-xl">
                    <span className="text-2xl">⭐</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Featured Articles
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage featured articles on home feed
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/featured/articles"
                  className="block w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-yellow-900">
                    Manage Featured Articles
                  </div>
                  <div className="text-sm text-yellow-700">
                    Control home carousel articles
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Featured Tools Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-cyan-100 rounded-xl">
                    <span className="text-2xl">🔧</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Featured AI Tools
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage featured AI tools and books
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/featured/tools"
                  className="block w-full text-left px-4 py-3 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-cyan-900">
                    Manage Featured Tools
                  </div>
                  <div className="text-sm text-cyan-700">
                    Control home sidebar tools
                  </div>
                </Link>
              </div>
            </div>
          </div>
          {/* Content Creation */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-green-100 rounded-xl">
                    <span className="text-2xl">✍️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create Content
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add new articles and library items
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/write"
                  className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-green-900">
                    📝 Write Article
                  </div>
                  <div className="text-sm text-green-700">
                    Create new article with editor
                  </div>
                </Link>
                <Link
                  href="/admin/library/add"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    📚 Add Library Item
                  </div>
                  <div className="text-sm text-gray-700">
                    Add books or tools to library
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Article Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-100 rounded-xl">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Article Moderation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Review and approve pending articles
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/articles"
                  className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-blue-900">
                    Article Management
                  </div>
                  <div className="text-sm text-blue-700">
                    Overview and access to all article tools
                  </div>
                </Link>
                <Link
                  href="/admin/articles/pending"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    Review Pending
                  </div>
                  <div className="text-sm text-gray-700">
                    Approve or reject submitted articles
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-green-100 rounded-xl">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    User Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage user accounts and roles
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/users"
                  className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-green-900">All Users</div>
                  <div className="text-sm text-green-700">
                    View and manage user accounts
                  </div>
                </Link>
                <Link
                  href="/admin/users/roles"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    Role Management
                  </div>
                  <div className="text-sm text-gray-700">
                    Assign and modify user roles
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-purple-100 rounded-xl">
                    <span className="text-2xl">⚙️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    System Settings
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure application settings
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/settings"
                  className="block w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-purple-900">
                    General Settings
                  </div>
                  <div className="text-sm text-purple-700">
                    Application configuration
                  </div>
                </Link>
                <Link
                  href="/admin/settings/security"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    Security Settings
                  </div>
                  <div className="text-sm text-gray-700">
                    Manage security policies
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-yellow-100 rounded-xl">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Analytics
                  </h3>
                  <p className="text-sm text-gray-500">
                    View usage statistics and reports
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/analytics"
                  className="block w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-yellow-900">
                    Usage Reports
                  </div>
                  <div className="text-sm text-yellow-700">
                    Site traffic and engagement
                  </div>
                </Link>
                <Link
                  href="/admin/analytics/content"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    Content Analytics
                  </div>
                  <div className="text-sm text-gray-700">
                    Article performance metrics
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-indigo-100 rounded-xl">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Common administrative tasks
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <button className="block w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  <div className="font-medium text-indigo-900">Clear Cache</div>
                  <div className="text-sm text-indigo-700">
                    Refresh application cache
                  </div>
                </button>
                <button className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="font-medium text-gray-900">
                    Send Notifications
                  </div>
                  <div className="text-sm text-gray-700">
                    Broadcast to all users
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* SEO Tools */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 bg-orange-100 rounded-xl">
                    <span className="text-2xl">🔍</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    SEO Tools
                  </h3>
                  <p className="text-sm text-gray-500">
                    Optimize search engine visibility
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Link
                  href="/admin/seo-tools/opengraph"
                  className="block w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-orange-900">
                    Open Graph Tester
                  </div>
                  <div className="text-sm text-orange-700">
                    Preview social media shares
                  </div>
                </Link>
                <Link
                  href="/admin/seo-tools/sitemap"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    Sitemap Validator
                  </div>
                  <div className="text-sm text-gray-700">
                    Validate XML sitemaps
                  </div>
                </Link>
                <Link
                  href="/admin/seo-tools/schema"
                  className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    Schema Validator
                  </div>
                  <div className="text-sm text-gray-700">
                    Test structured data
                  </div>
                </Link>
                <Link
                  href="/admin/seo-tools"
                  className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-blue-900">
                    View All Tools
                  </div>
                  <div className="text-sm text-blue-700">
                    Access complete SEO suite
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Role-based Access Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 bg-blue-500 rounded-full">
                <span className="text-white text-sm">ℹ️</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">
                Role-Based Access Control Active
              </h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>
                  • Your current role: <strong>{userRole}</strong>
                </p>
                <p>
                  • Access level: <strong>Administrator</strong>
                </p>
                <p>• This dashboard requires admin privileges</p>
                <p>• All actions are logged for security audit</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Export the admin dashboard with role-based protection
 * This implements Task 14.1: Role-Based Access Control System
 */
export default withAdminRoute(AdminDashboardContent, {
  requiredPermission: 'ADMIN_DASHBOARD',
  showDetailedErrors: true,
});
