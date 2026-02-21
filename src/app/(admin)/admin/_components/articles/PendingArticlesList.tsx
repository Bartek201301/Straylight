'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAccess } from '@/lib/auth/admin-route-wrapper';
import BulkActionsToolbar from './BulkActionsToolbar';
import { type PendingArticleWithAuthor } from './ArticlePreviewModal';

/**
 * Sort options for the articles table
 */
type SortField = 'title' | 'created_at' | 'updated_at' | 'author';
type SortOrder = 'asc' | 'desc';

/**
 * Filter options for the articles
 */
interface ArticleFilters {
  search: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  tags: string[];
}

/**
 * Pagination state
 */
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Component props
 */
interface PendingArticlesListProps {
  onArticleSelect?: (_article: PendingArticleWithAuthor) => void;
  onBulkAction?: (
    _action: 'approve' | 'reject',
    _articleIds: string[]
  ) => Promise<void>;
  refreshTrigger?: number;
}

/**
 * Pending Articles List Component
 * Implements Task 14.2: Data table for pending articles with sorting, filtering, and pagination
 */
export default function PendingArticlesList({
  onArticleSelect,
  onBulkAction,
  refreshTrigger = 0,
}: PendingArticlesListProps) {
  // Auth check
  const { hasAccess, isLoading: authLoading } = useAdminAccess({
    requiredPermission: 'APPROVE_ARTICLES',
  });

  // State management
  const [articles, setArticles] = useState<PendingArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(
    new Set()
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filtering state
  const [filters, setFilters] = useState<ArticleFilters>({
    search: '',
    author: '',
    dateFrom: '',
    dateTo: '',
    tags: [],
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  });

  /**
   * Fetch pending articles from Supabase
   */
  const fetchPendingArticles = useCallback(async () => {
    if (!hasAccess) return;

    setLoading(true);
    setError(null);

    try {
      // Build query params for API
      const params = new URLSearchParams();
      params.set('status', 'pending');
      if (filters.search) params.set('search', filters.search);
      if (filters.author) params.set('author_id', filters.author);

      // Note: dateFrom, dateTo, and tags filters are not yet supported by the API
      // TODO: Add support for these filters in the API

      // Sort order (API only supports single sort_order, not sortField)
      params.set('sort_order', sortOrder);

      // Pagination - convert page/perPage to limit/offset
      const limit = pagination.itemsPerPage;
      const offset = (pagination.currentPage - 1) * pagination.itemsPerPage;
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const res = await fetch(`/api/articles?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const payload = json?.data || {};
      const items = (payload.articles || []) as PendingArticleWithAuthor[];
      // Ujednolicenie – author może nie być zwrócony przez API
      const normalizedItems = items.map((a) => ({ ...a, author: a.author }));
      const total = payload.pagination?.total || items.length;

      setArticles(normalizedItems);
      setPagination((prev) => ({
        ...prev,
        totalItems: total,
        totalPages: Math.ceil(total / prev.itemsPerPage),
      }));
    } catch (err) {
      console.error('Error fetching pending articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasAccess,
    sortField,
    sortOrder,
    filters,
    pagination.currentPage,
    pagination.itemsPerPage,
  ]);

  // Fetch articles on mount and filter/sort changes
  useEffect(() => {
    fetchPendingArticles();
  }, [fetchPendingArticles, refreshTrigger]);

  /**
   * Clear selection handler
   */
  const handleClearSelection = useCallback(() => {
    setSelectedArticles(new Set());
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fetchPendingArticles();
          }
          break;
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSelectAll(true);
          }
          break;
        case 'Escape':
          if (selectedArticles.size > 0) {
            e.preventDefault();
            handleClearSelection();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArticles.size, handleClearSelection, fetchPendingArticles]);

  /**
   * Handle sorting
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage,
      currentPage: 1, // Reset to first page
    }));
  };

  /**
   * Handle selection
   */
  const handleSelectArticle = (articleId: string, selected: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (selected) {
      newSelected.add(articleId);
    } else {
      newSelected.delete(articleId);
    }
    setSelectedArticles(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedArticles(new Set(articles.map((article) => article.id)));
    } else {
      setSelectedArticles(new Set());
    }
  };

  /**
   * Handle bulk actions with loading state
   */
  const handleBulkAction = useCallback(
    async (action: 'approve' | 'reject', articleIds: string[]) => {
      if (articleIds.length === 0) return;

      setBulkActionLoading(true);
      try {
        await onBulkAction?.(action, articleIds);
        // Clear selection after successful action
        setSelectedArticles(new Set());
      } catch (error) {
        console.error('Bulk action failed:', error);
        // Keep selection on error so user can retry
      } finally {
        setBulkActionLoading(false);
      }
    },
    [onBulkAction]
  );

  /**
   * Handle filter changes
   */
  const handleFilterChange = (newFilters: Partial<ArticleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      author: '',
      dateFrom: '',
      dateTo: '',
      tags: [],
    });
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get sort icon
   */
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
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
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
    ) : (
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
          d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
        />
      </svg>
    );
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pending articles...</span>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Access Denied</div>
        <div className="text-gray-600">
          You don&apos;t have permission to view pending articles.
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
            Error loading articles
          </span>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
        <button
          onClick={fetchPendingArticles}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Articles</h2>
          <p className="text-gray-600 mt-1">
            {pagination.totalItems} article
            {pagination.totalItems !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
      </div>

      {/* Enhanced Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedArticles={selectedArticles}
        articles={articles}
        onBulkAction={handleBulkAction}
        onClearSelection={handleClearSelection}
        isLoading={bulkActionLoading}
      />

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search title or content..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author
            </label>
            <input
              type="text"
              placeholder="Filter by author..."
              value={filters.author}
              onChange={(e) => handleFilterChange({ author: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {Object.values(filters).some((v) =>
              Array.isArray(v) ? v.length > 0 : v !== ''
            ) && <span>Filters active</span>}
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        articles.length > 0 &&
                        selectedArticles.size === articles.length
                      }
                      ref={(input) => {
                        if (input) {
                          input.indeterminate =
                            selectedArticles.size > 0 &&
                            selectedArticles.size < articles.length;
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      title={`Select all articles (${selectedArticles.size}/${articles.length} selected)`}
                    />
                    {selectedArticles.size > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        {selectedArticles.size}/{articles.length}
                      </span>
                    )}
                  </div>
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Title</span>
                    {getSortIcon('title')}
                  </div>
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('author')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Author</span>
                    {getSortIcon('author')}
                  </div>
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Submitted</span>
                    {getSortIcon('created_at')}
                  </div>
                </th>

                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Updated</span>
                    {getSortIcon('updated_at')}
                  </div>
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {articles.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
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
                      <p className="text-lg font-medium">No pending articles</p>
                      <p className="text-sm">
                        All articles have been reviewed or no articles match
                        your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr
                    key={article.id}
                    className={`
                      transition-colors duration-150
                      ${selectedArticles.has(article.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                      ${bulkActionLoading ? 'opacity-75' : ''}
                    `}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.has(article.id)}
                        onChange={(e) =>
                          handleSelectArticle(article.id, e.target.checked)
                        }
                        disabled={bulkActionLoading}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div
                          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 truncate"
                          onClick={() => onArticleSelect?.(article)}
                          title={article.title}
                        >
                          {article.title}
                        </div>
                        {article.excerpt && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {article.excerpt}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {article.author?.handle ?? '—'}
                        </div>
                        {article.author?.role && (
                          <span
                            className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              article.author.role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : article.author.role === 'moderator'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {article.author.role}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{article.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(article.created_at)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(article.updated_at)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onArticleSelect?.(article)}
                          disabled={bulkActionLoading}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Review
                        </button>
                        <button
                          onClick={() =>
                            handleBulkAction('approve', [article.id])
                          }
                          disabled={bulkActionLoading}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleBulkAction('reject', [article.id])
                          }
                          disabled={bulkActionLoading}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {Math.min(
                    (pagination.currentPage - 1) * pagination.itemsPerPage + 1,
                    pagination.totalItems
                  )}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.itemsPerPage,
                    pagination.totalItems
                  )}
                </span>{' '}
                of <span className="font-medium">{pagination.totalItems}</span>{' '}
                results
              </p>

              <select
                value={pagination.itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, pagination.currentPage - 3),
                    Math.min(pagination.totalPages, pagination.currentPage + 2)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
