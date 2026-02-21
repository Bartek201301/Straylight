'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useNotificationContext } from '@/contexts/NotificationContext';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    timeframe: string;
  };
}

function StatsCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
  };

  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {value.toLocaleString()}
          </p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <svg
                className={`w-4 h-4 mr-1 ${trendClasses[trend.direction]}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {trend.direction === 'up' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                )}
              </svg>
              <span
                className={`text-sm font-medium ${trendClasses[trend.direction]}`}
              >
                {trend.value}% {trend.timeframe}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

interface RealtimeDashboardStatsProps {
  className?: string;
}

/**
 * Real-time dashboard statistics component
 * Shows live updating stats for admin dashboard
 */
export default function RealtimeDashboardStats({
  className = '',
}: RealtimeDashboardStatsProps) {
  const { user } = useAuth();
  const { stats, loading, error, isConnected, refreshStats } =
    useRealtimeDashboard();
  const { showError, showWarning } = useNotificationContext();

  // Show connection status notifications - must be before any early returns
  React.useEffect(() => {
    if (error) {
      console.error('🚨 Dashboard error occurred:', error);

      // Show different error messages based on error type
      let errorTitle = 'Dashboard Connection Error';
      let errorMessage = error;

      if (error.includes('No authentication token')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Please log in again to access the admin dashboard';
      } else if (error.includes('User profile not found')) {
        errorTitle = 'Profile Setup Required';
        errorMessage =
          'Your user profile needs to be completed. Please contact an administrator.';
      } else if (error.includes('Admin access required')) {
        errorTitle = 'Access Denied';
        errorMessage =
          'You need administrator privileges to access this dashboard';
      }

      showError(errorTitle, errorMessage, {
        persistent: true,
        action: {
          label: 'Retry',
          onClick: refreshStats,
        },
      });
    }
  }, [error, showError, refreshStats]);

  React.useEffect(() => {
    if (!isConnected && !loading && !error) {
      console.warn('⚠️ Dashboard disconnected from real-time updates');
      showWarning(
        'Dashboard Disconnected',
        'Real-time updates are unavailable. Data may be outdated.',
        {
          duration: 0,
          action: {
            label: 'Reconnect',
            onClick: refreshStats,
          },
        }
      );
    }
  }, [isConnected, loading, error, showWarning, refreshStats]);

  // Additional safeguard: only render for admin users
  if (!user || user.role !== 'admin') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">
            Admin access required to view dashboard statistics.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Connection Status Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Dashboard Overview
        </h2>
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-green-500 animate-pulse'
                  : error
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isConnected
                  ? 'text-green-600'
                  : error
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {isConnected ? 'Live' : error ? 'Error' : 'Connecting...'}
            </span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={refreshStats}
            disabled={loading}
            className={`p-1 transition-colors ${
              loading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={loading ? 'Refreshing...' : 'Refresh stats'}
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
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
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Articles - Clickable for Navigation */}
        <div
          onClick={() => (window.location.href = '/admin/articles/pending')}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <StatsCard
            title="Pending Articles"
            value={stats.pendingArticles}
            subtitle={
              stats.pendingArticles > 0 ? 'Click to review' : 'All caught up!'
            }
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            color="yellow"
          />
        </div>

        {/* Published Today - Clickable for Navigation */}
        <div
          onClick={() => (window.location.href = '/admin/articles')}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <StatsCard
            title="Published Today"
            value={stats.publishedToday}
            subtitle="Articles approved - Click to view"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
            color="green"
          />
        </div>

        {/* Total Users */}
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered members"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          }
          color="blue"
        />

        {/* Recent Activity */}
        <StatsCard
          title="Recent Activity"
          value={stats.recentActivity.length}
          subtitle="Last 24 hours"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-600 mt-1">
            Latest actions and submissions
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {stats.recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <svg
                className="w-8 h-8 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          ) : (
            stats.recentActivity.slice(0, 10).map((activity, _index) => (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {/* Activity Icon */}
                  <div
                    className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${activity.type === 'article_approved' ? 'bg-green-100' : ''}
                    ${activity.type === 'article_rejected' ? 'bg-red-100' : ''}
                    ${activity.type === 'article_submitted' ? 'bg-blue-100' : ''}
                    ${activity.type === 'user_registered' ? 'bg-purple-100' : ''}
                  `}
                  >
                    {activity.type === 'article_approved' && (
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {activity.type === 'article_rejected' && (
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    {activity.type === 'article_submitted' && (
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    )}
                    {activity.type === 'user_registered' && (
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">{activity.subtitle}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {/* Action Button */}
                  {activity.metadata.articleId && (
                    <div className="flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => {
                          if (activity.type === 'article_submitted') {
                            window.location.href = '/admin/articles/pending';
                          } else if (activity.metadata.articleSlug) {
                            window.open(
                              `/articles/${activity.metadata.articleSlug}`,
                              '_blank'
                            );
                          } else {
                            // Fallback to pending articles page
                            window.location.href = '/admin/articles/pending';
                          }
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                      >
                        {activity.type === 'article_submitted'
                          ? 'Review'
                          : 'View'}
                      </button>
                      {activity.type === 'article_submitted' && (
                        <button
                          onClick={() => {
                            window.location.href = '/admin/articles/pending';
                          }}
                          className="text-sm text-green-600 hover:text-green-800 font-medium px-2 py-1 rounded border border-green-200 hover:bg-green-50"
                          title="Go to article moderation"
                        >
                          Moderate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {stats.recentActivity.length > 10 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => (window.location.href = '/admin/activity')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center"
            >
              View all activity
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions for Article Workflow */}
      {stats.pendingArticles > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                📋 Article Review Required
              </h3>
              <p className="text-yellow-700 text-sm">
                You have {stats.pendingArticles} article
                {stats.pendingArticles > 1 ? 's' : ''} waiting for review. Take
                action to keep the publication workflow moving.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  (window.location.href = '/admin/articles/pending')
                }
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                Review Articles
              </button>
              <button
                onClick={() => (window.location.href = '/admin/articles')}
                className="px-4 py-2 bg-white text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors font-medium"
              >
                Manage All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State when No Pending Articles */}
      {stats.pendingArticles === 0 && stats.publishedToday > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✅ All Caught Up!
              </h3>
              <p className="text-green-700 text-sm">
                No pending articles to review. Great job keeping up with
                submissions!
                {stats.publishedToday > 0 && (
                  <>
                    You&apos;ve published {stats.publishedToday} article
                    {stats.publishedToday > 1 ? 's' : ''} today.
                  </>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => (window.location.href = '/write')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Write Article
              </button>
              <button
                onClick={() => (window.location.href = '/admin/articles')}
                className="px-4 py-2 bg-white text-green-800 border border-green-300 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                View Published
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
