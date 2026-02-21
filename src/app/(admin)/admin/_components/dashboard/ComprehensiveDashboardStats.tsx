'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotificationContext } from '@/contexts/NotificationContext';

interface UserAnalytics {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  usersByRole: {
    admin: number;
    moderator: number;
    member: number;
  };
  topContributors: {
    id: string;
    handle: string;
    role: string;
    articleCount: number;
    totalViews: number;
  }[];
}

interface ContentAnalytics {
  totalArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  draftArticles: number;
  totalViews: number;
  averageViews: number;
  topPerformingArticles: {
    id: string;
    title: string;
    slug: string;
    author_handle: string;
    view_count: number;
    published_at: string;
    tags: string[];
  }[];
  contentByTag: {
    tag: string;
    count: number;
    totalViews: number;
  }[];
}

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    connectionTime: number;
    tableCount: number;
    totalRows: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    uptime: number;
    memoryUsage: number;
    errorRate: number;
  };
  alerts: {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

interface ComprehensiveDashboardStatsProps {
  className?: string;
}

const ComprehensiveDashboardStats = memo(
  function ComprehensiveDashboardStats({
    className = '',
  }: ComprehensiveDashboardStatsProps) {
    const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
      null
    );
    const [contentAnalytics, setContentAnalytics] =
      useState<ContentAnalytics | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const { showError, showSuccess } = useNotificationContext();

    const fetchAnalytics = useCallback(async () => {
      try {
        setError(null);
        console.log('📊 Fetching comprehensive dashboard analytics...');

        // Get current session and token
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (!session?.access_token) {
          throw new Error(
            'No authentication token available. Please log in again.'
          );
        }

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        };

        // Fetch all analytics in parallel
        const [userResponse, contentResponse, systemResponse] =
          await Promise.all([
            fetch('/api/admin/analytics/users', {
              method: 'GET',
              credentials: 'include',
              headers,
            }),
            fetch('/api/admin/analytics/content', {
              method: 'GET',
              credentials: 'include',
              headers,
            }),
            fetch('/api/admin/analytics/system', {
              method: 'GET',
              credentials: 'include',
              headers,
            }),
          ]);

        // Check responses
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(
            `User analytics failed: ${errorData.error || userResponse.statusText}`
          );
        }

        if (!contentResponse.ok) {
          const errorData = await contentResponse.json();
          throw new Error(
            `Content analytics failed: ${errorData.error || contentResponse.statusText}`
          );
        }

        if (!systemResponse.ok) {
          const errorData = await systemResponse.json();
          throw new Error(
            `System health failed: ${errorData.error || systemResponse.statusText}`
          );
        }

        // Parse responses
        const [userData, contentData, systemData] = await Promise.all([
          userResponse.json(),
          contentResponse.json(),
          systemResponse.json(),
        ]);

        setUserAnalytics(userData.data);
        setContentAnalytics(contentData.data);
        setSystemHealth(systemData.data);

        console.log('✅ All analytics loaded successfully');

        if (!refreshing) {
          showSuccess(
            'Dashboard Loaded',
            'All analytics data loaded successfully'
          );
        }
      } catch (err) {
        console.error('❌ Failed to fetch analytics:', err);

        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard analytics';
        setError(errorMessage);
        showError('Dashboard Error', errorMessage);
      }
    }, [refreshing, showError, showSuccess]);

    const handleRefresh = useCallback(async () => {
      setRefreshing(true);
      await fetchAnalytics();
      setRefreshing(false);
    }, [fetchAnalytics]);

    useEffect(() => {
      const initializeDashboard = async () => {
        setLoading(true);
        await fetchAnalytics();
        setLoading(false);
      };

      initializeDashboard();
    }, [fetchAnalytics]);

    if (loading) {
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">
                  Dashboard Error
                </h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
      switch (status) {
        case 'healthy':
          return 'text-green-600 bg-green-100';
        case 'warning':
          return 'text-yellow-600 bg-yellow-100';
        case 'error':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    };

    const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
      switch (status) {
        case 'healthy':
          return '✅';
        case 'warning':
          return '⚠️';
        case 'error':
          return '❌';
        default:
          return '❓';
      }
    };

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Comprehensive Admin Dashboard
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
          </button>
        </div>

        {/* System Health Status */}
        {systemHealth && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {getStatusIcon(systemHealth.database.status)}
                </span>
                <div>
                  <p className="font-medium">Database</p>
                  <p
                    className={`text-sm px-2 py-1 rounded ${getStatusColor(systemHealth.database.status)}`}
                  >
                    {systemHealth.database.status} (
                    {systemHealth.database.connectionTime}ms)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {getStatusIcon(systemHealth.api.status)}
                </span>
                <div>
                  <p className="font-medium">API</p>
                  <p
                    className={`text-sm px-2 py-1 rounded ${getStatusColor(systemHealth.api.status)}`}
                  >
                    {systemHealth.api.status} ({systemHealth.api.responseTime}
                    ms)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💾</span>
                <div>
                  <p className="font-medium">Memory Usage</p>
                  <p className="text-sm text-gray-600">
                    {systemHealth.api.memoryUsage.toFixed(1)} MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Metrics */}
          {userAnalytics && (
            <>
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-blue-600 mb-1">
                      {userAnalytics.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      +{userAnalytics.newUsersToday} today
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      New This Month
                    </p>
                    <p className="text-3xl font-bold text-green-600 mb-1">
                      {userAnalytics.newUsersThisMonth.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      +{userAnalytics.newUsersThisWeek} this week
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Content Metrics */}
          {contentAnalytics && (
            <>
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Published Articles
                    </p>
                    <p className="text-3xl font-bold text-purple-600 mb-1">
                      {contentAnalytics.publishedArticles.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {contentAnalytics.pendingArticles} pending
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Total Views
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mb-1">
                      {contentAnalytics.totalViews.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      ~{contentAnalytics.averageViews} avg per article
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100">
                    <span className="text-2xl">👁️</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detailed Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Content */}
          {contentAnalytics?.topPerformingArticles && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Performing Articles
              </h3>
              <div className="space-y-3">
                {contentAnalytics.topPerformingArticles
                  .slice(0, 5)
                  .map((article, _index) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {article.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          by {article.author_handle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {article.view_count.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">views</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Contributors */}
          {userAnalytics?.topContributors && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Contributors
              </h3>
              <div className="space-y-3">
                {userAnalytics.topContributors
                  .slice(0, 5)
                  .map((contributor, _index) => (
                    <div
                      key={contributor.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {contributor.handle}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {contributor.role}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {contributor.articleCount}
                        </p>
                        <p className="text-xs text-gray-500">articles</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* System Alerts */}
        {systemHealth?.alerts && systemHealth.alerts.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Alerts
            </h3>
            <div className="space-y-3">
              {systemHealth.alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'error'
                      ? 'bg-red-50 border-red-400'
                      : alert.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          alert.type === 'error'
                            ? 'text-red-800'
                            : alert.type === 'warning'
                              ? 'text-yellow-800'
                              : 'text-blue-800'
                        }`}
                      >
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        alert.resolved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/articles/pending"
            className="block bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-6 hover:from-yellow-600 hover:to-orange-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Review Articles</h3>
                <p className="text-yellow-100 mt-1">
                  {contentAnalytics?.pendingArticles || 0} pending review
                </p>
              </div>
              <span className="text-3xl opacity-80">📝</span>
            </div>
          </a>

          <a
            href="/admin/users"
            className="block bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-6 hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Manage Users</h3>
                <p className="text-blue-100 mt-1">
                  {userAnalytics?.totalUsers || 0} total users
                </p>
              </div>
              <span className="text-3xl opacity-80">👥</span>
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="block bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg p-6 hover:from-green-600 hover:to-teal-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">View Analytics</h3>
                <p className="text-green-100 mt-1">
                  Detailed reports & insights
                </p>
              </div>
              <span className="text-3xl opacity-80">📊</span>
            </div>
          </a>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if className changes
    // The component manages its own internal state, so we don't need to check for data changes
    return prevProps.className === nextProps.className;
  }
);

ComprehensiveDashboardStats.displayName = 'ComprehensiveDashboardStats';

export default ComprehensiveDashboardStats;
