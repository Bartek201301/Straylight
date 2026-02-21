'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import type { NotificationType } from '@/hooks/useNotifications';

interface FilterState {
  type: NotificationType | 'all';
  status: 'all' | 'unread' | 'read';
  dateRange: 'all' | 'today' | 'week' | 'month';
  search: string;
}

/**
 * Admin notifications page for viewing notification history
 */
function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refreshNotifications,
  } = useNotifications();

  const { showSuccess, showError } = useNotificationContext();

  // Filters and pagination state
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    search: '',
  });

  const [selectedNotifications, setSelectedNotifications] = useState<
    Set<string>
  >(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  /**
   * Filter notifications based on current filters
   */
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((n) => n.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((n) => n.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((n) => new Date(n.created_at) >= filterDate);
    }

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm) ||
          n.message.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [notifications, filters]);

  /**
   * Paginated notifications
   */
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1); // Reset to first page
    },
    []
  );

  /**
   * Handle notification selection
   */
  const handleNotificationSelect = useCallback(
    (notificationId: string, selected: boolean) => {
      setSelectedNotifications((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(notificationId);
        } else {
          newSet.delete(notificationId);
        }
        return newSet;
      });
    },
    []
  );

  /**
   * Handle select all
   */
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedNotifications(
          new Set(paginatedNotifications.map((n) => n.id))
        );
      } else {
        setSelectedNotifications(new Set());
      }
    },
    [paginatedNotifications]
  );

  /**
   * Handle bulk actions
   */
  const handleBulkAction = useCallback(
    async (action: 'read' | 'archive') => {
      if (selectedNotifications.size === 0) return;

      const notificationIds = Array.from(selectedNotifications);

      try {
        if (action === 'read') {
          const promises = notificationIds.map((id) => markAsRead(id));
          await Promise.all(promises);
          showSuccess(
            'Marked as Read',
            `${notificationIds.length} notifications marked as read.`
          );
        } else if (action === 'archive') {
          const promises = notificationIds.map((id) => archiveNotification(id));
          await Promise.all(promises);
          showSuccess(
            'Archived',
            `${notificationIds.length} notifications archived.`
          );
        }

        setSelectedNotifications(new Set());
      } catch (error) {
        showError(
          'Action Failed',
          'Failed to perform bulk action on notifications.'
        );
      }
    },
    [
      selectedNotifications,
      markAsRead,
      archiveNotification,
      showSuccess,
      showError,
    ]
  );

  /**
   * Format relative time
   */
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  /**
   * Get notification icon and color
   */
  const getNotificationDisplay = (type: NotificationType) => {
    const displays = {
      article_approved: {
        icon: (
          <svg
            className="w-5 h-5 text-green-600"
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
        ),
        bgColor: 'bg-green-100',
        label: 'Article Approved',
      },
      article_rejected: {
        icon: (
          <svg
            className="w-5 h-5 text-red-600"
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
        ),
        bgColor: 'bg-red-100',
        label: 'Article Rejected',
      },
      article_submitted: {
        icon: (
          <svg
            className="w-5 h-5 text-blue-600"
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
        ),
        bgColor: 'bg-blue-100',
        label: 'Article Submitted',
      },
      article_updated: {
        icon: (
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
        bgColor: 'bg-yellow-100',
        label: 'Article Updated',
      },
      system_maintenance: {
        icon: (
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        bgColor: 'bg-gray-100',
        label: 'System Maintenance',
      },
      account_update: {
        icon: (
          <svg
            className="w-5 h-5 text-purple-600"
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
        ),
        bgColor: 'bg-purple-100',
        label: 'Account Update',
      },
      admin_action: {
        icon: (
          <svg
            className="w-5 h-5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
        bgColor: 'bg-indigo-100',
        label: 'Admin Action',
      },
    };

    return displays[type] || displays.admin_action;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={refreshNotifications}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="article_approved">Article Approved</option>
              <option value="article_rejected">Article Rejected</option>
              <option value="article_submitted">Article Submitted</option>
              <option value="article_updated">Article Updated</option>
              <option value="system_maintenance">System Maintenance</option>
              <option value="account_update">Account Update</option>
              <option value="admin_action">Admin Action</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search notifications..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedNotifications.size} notification
              {selectedNotifications.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('read')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Mark as Read
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Archive
              </button>
              <button
                onClick={() => setSelectedNotifications(new Set())}
                className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
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
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg border">
        {/* Header with Select All */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={
                paginatedNotifications.length > 0 &&
                selectedNotifications.size === paginatedNotifications.length
              }
              ref={(input) => {
                if (input) {
                  input.indeterminate =
                    selectedNotifications.size > 0 &&
                    selectedNotifications.size < paginatedNotifications.length;
                }
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Select All{' '}
              {paginatedNotifications.length > 0 &&
                `(${selectedNotifications.size}/${paginatedNotifications.length})`}
            </span>
          </label>
        </div>

        {/* Empty State */}
        {paginatedNotifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5v-5z"
              />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              No notifications found
            </p>
            <p className="text-gray-600">
              {filters.search ||
              filters.type !== 'all' ||
              filters.status !== 'all' ||
              filters.dateRange !== 'all'
                ? 'Try adjusting your filters to see more notifications.'
                : 'You have no notifications at this time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedNotifications.map((notification) => {
              const display = getNotificationDisplay(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={(e) =>
                        handleNotificationSelect(
                          notification.id,
                          e.target.checked
                        )
                      }
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${display.bgColor}`}
                    >
                      {display.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm ${notification.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-400">
                            <span>{display.label}</span>
                            <span>
                              {formatRelativeTime(notification.created_at)}
                            </span>
                            {notification.status === 'unread' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => archiveNotification(notification.id)}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredNotifications.length)}{' '}
            of {filteredNotifications.length} notifications
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page =
                  i + Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedNotificationsPage() {
  return (
    <ProtectedRoute requireAuth requireRole={['admin', 'moderator']}>
      <NotificationsPage />
    </ProtectedRoute>
  );
}
