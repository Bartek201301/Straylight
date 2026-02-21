'use client';

import React, { useState, useCallback } from 'react';
import { withAdminRoute } from '@/lib/auth/admin-route-wrapper';
import PendingArticlesList from '@/app/(admin)/admin/_components/articles/PendingArticlesList';
import ArticlePreviewModal, {
  type PendingArticleWithAuthor,
} from '@/app/(admin)/admin/_components/articles/ArticlePreviewModal';
import {
  useAdminArticleService,
  AdminArticleError,
} from '@/lib/services/admin-articles';
import { useNotificationContext } from '@/contexts/NotificationContext';

// PendingArticleWithAuthor type is now imported from the modal component

/**
 * Admin Pending Articles Page
 * Implements Task 14.2: Admin dashboard for editors to review and approve pending articles
 */
function AdminPendingArticlesContent() {
  const { approveArticles, rejectArticles } = useAdminArticleService();
  const { showSuccess, showError } = useNotificationContext();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedArticle, setSelectedArticle] =
    useState<PendingArticleWithAuthor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  /**
   * Handle bulk actions (approve/reject articles)
   * Now uses secure API endpoints with comprehensive audit logging
   */
  const handleBulkAction = useCallback(
    async (
      action: 'approve' | 'reject',
      articleIds: string[],
      reason?: string
    ): Promise<void> => {
      if (articleIds.length === 0) return;

      setActionLoading(true);
      setActionMessage(null);

      try {
        let result;

        if (action === 'approve') {
          result = await approveArticles(articleIds, {
            reason: 'Bulk approval via admin dashboard',
          });
        } else {
          // Use the provided reason or a default one
          const rejectionReason =
            reason || 'Content does not meet publication standards';
          result = await rejectArticles(articleIds, rejectionReason);
        }

        // Show success notification
        showSuccess(
          `Articles ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          result.message,
          {
            duration: 5000,
            action: {
              label: 'View Details',
              onClick: () => {
                console.log('Action result:', result);
              },
            },
          }
        );

        // Also update the action message for the existing UI
        setActionMessage({
          type: 'success',
          text: result.message,
        });

        // Refresh the list
        setRefreshTrigger((prev) => prev + 1);

        // Clear message after 5 seconds
        setTimeout(() => setActionMessage(null), 5000);
      } catch (error) {
        console.error(`Error ${action}ing articles:`, error);

        let errorMessage = `Failed to ${action} articles`;

        if (error instanceof AdminArticleError) {
          // Use the structured error information from the service
          switch (error.code) {
            case 'NETWORK_ERROR':
              errorMessage =
                'Network error. Please check your connection and try again.';
              break;
            case 'VALIDATION_ERROR':
              errorMessage = `Validation error: ${error.details?.join(', ') || error.message}`;
              break;
            case 'UNAUTHORIZED':
            case 'FORBIDDEN':
              errorMessage =
                'Insufficient permissions. Please check your role.';
              break;
            case 'NOT_FOUND':
              errorMessage =
                'Selected articles not found. They may have been modified by another user.';
              break;
            case 'INVALID_STATUS':
              errorMessage =
                'Articles cannot be processed. They may no longer be pending.';
              break;
            default:
              errorMessage = error.message || errorMessage;
          }
        } else {
          errorMessage +=
            ': Please try again or contact support if the issue persists.';
        }

        // Show error notification
        showError(`Failed to ${action} articles`, errorMessage, {
          duration: 8000,
          persistent: true,
          action: {
            label: 'Retry',
            onClick: () => {
              // The user can try the action again
              console.log('Retry bulk action for articles:', articleIds);
            },
          },
        });

        setActionMessage({
          type: 'error',
          text: errorMessage,
        });
      } finally {
        setActionLoading(false);
      }
    },
    [approveArticles, rejectArticles, showSuccess, showError]
  );

  /**
   * Handle article selection for preview
   */
  const handleArticleSelect = useCallback(
    (article: PendingArticleWithAuthor) => {
      setSelectedArticle(article);
      setIsModalOpen(true);
    },
    []
  );

  /**
   * Handle modal close
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  }, []);

  /**
   * Handle individual article actions from modal
   */
  const handleIndividualApprove = useCallback(
    async (articleId: string) => {
      await handleBulkAction('approve', [articleId]);
      handleModalClose();
    },
    [handleBulkAction, handleModalClose]
  );

  const handleIndividualReject = useCallback(
    async (articleId: string) => {
      await handleBulkAction('reject', [articleId]);
      handleModalClose();
    },
    [handleBulkAction, handleModalClose]
  );

  /**
   * Dismiss action message
   */
  const dismissMessage = () => {
    setActionMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Article Moderation
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve pending article submissions
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-gray-600">
                <div>Admin Dashboard</div>
                <div className="font-medium text-blue-600">Article Review</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div
            className={`rounded-md p-4 ${
              actionMessage.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {actionMessage.type === 'success' ? (
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
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
                ) : (
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
                )}
                <span
                  className={`font-medium ${
                    actionMessage.type === 'success'
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}
                >
                  {actionMessage.text}
                </span>
              </div>
              <button
                onClick={dismissMessage}
                className={`text-sm ${
                  actionMessage.type === 'success'
                    ? 'text-green-600 hover:text-green-800'
                    : 'text-red-600 hover:text-red-800'
                }`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 font-medium">
              Processing articles...
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PendingArticlesList
          onArticleSelect={handleArticleSelect}
          onBulkAction={handleBulkAction}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Quick Actions Sidebar */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-xs">
        <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
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
            <span>Refresh List</span>
          </button>

          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2"
            onClick={() => {
              // TODO: Export functionality
              console.log('Export pending articles');
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Export Report</span>
          </button>

          <hr className="my-2" />

          <div className="text-xs text-gray-500">
            <div>Role-based access active</div>
            <div>Admin/Moderator required</div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 bg-white rounded-lg shadow border p-3 max-w-xs">
        <div className="font-medium mb-2">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">R</kbd>{' '}
            Refresh
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">A</kbd>{' '}
            Approve selected
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">X</kbd>{' '}
            Reject selected
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>{' '}
            Clear selection
          </div>
        </div>
      </div>

      {/* Article Preview Modal */}
      <ArticlePreviewModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onApprove={handleIndividualApprove}
        onReject={handleIndividualReject}
        actionLoading={actionLoading}
      />
    </div>
  );
}

/**
 * Export the admin pending articles page with role-based protection
 * Requires APPROVE_ARTICLES permission (admin or moderator)
 */
export default withAdminRoute(AdminPendingArticlesContent, {
  requiredPermission: 'APPROVE_ARTICLES',
  showDetailedErrors: true,
});
