'use client';

import React, { useState, useCallback } from 'react';
import type { PendingArticleWithAuthor } from './ArticlePreviewModal';

interface BulkActionsToolbarProps {
  /** Selected articles */
  selectedArticles: Set<string>;
  /** All articles for context */
  articles: PendingArticleWithAuthor[];
  /** Bulk action handler */
  onBulkAction: (
    _action: 'approve' | 'reject',
    _articleIds: string[],
    _reason?: string
  ) => Promise<void>;
  /** Clear selection handler */
  onClearSelection: () => void;
  /** Loading state */
  isLoading: boolean;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  action: 'approve' | 'reject';
  count: number;
  articleTitles: string[];
  onConfirm: (_reason?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Confirmation Dialog Component for Bulk Actions
 */
function ConfirmationDialog({
  isOpen,
  action,
  count,
  articleTitles,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmationDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  if (!isOpen) return null;

  const actionText = action === 'approve' ? 'approve' : 'reject';
  const maxDisplayTitles = 5;

  const handleConfirm = () => {
    onConfirm(action === 'reject' ? rejectionReason : undefined);
  };

  const isRejectValid =
    action === 'approve' || rejectionReason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onCancel}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div
              className={`flex-shrink-0 flex items-center justify-center w-12 h-12 mx-auto rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                action === 'approve' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {action === 'approve' ? (
                <svg
                  className="w-6 h-6 text-green-600"
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
                  className="w-6 h-6 text-red-600"
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
            </div>

            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900 capitalize">
                Confirm {actionText}
              </h3>

              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to {actionText} {count} article
                  {count !== 1 ? 's' : ''}? This action cannot be undone.
                </p>

                {/* Show article titles */}
                {articleTitles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Articles to {actionText}:
                    </p>
                    <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                      <ul className="space-y-1">
                        {articleTitles
                          .slice(0, maxDisplayTitles)
                          .map((title, index) => (
                            <li
                              key={index}
                              className="text-xs text-gray-600 truncate"
                              title={title}
                            >
                              • {title}
                            </li>
                          ))}
                        {articleTitles.length > maxDisplayTitles && (
                          <li className="text-xs text-gray-500 italic">
                            ... and {articleTitles.length - maxDisplayTitles}{' '}
                            more
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Security warning for large batches */}
                {count > 10 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <svg
                        className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs text-yellow-800">
                        You&apos;re about to {actionText} a large number of
                        articles. Please double-check your selection.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejection reason input */}
                {action === 'reject' && (
                  <div className="mt-4">
                    <label
                      htmlFor="rejection-reason"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Reason for rejection{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a clear reason for rejecting these articles..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                      disabled={isLoading}
                    />
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-gray-500">
                        This reason will be visible to the article authors
                      </span>
                      <span
                        className={`${rejectionReason.length > 450 ? 'text-red-600' : 'text-gray-500'}`}
                      >
                        {rejectionReason.length}/500
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={isLoading || !isRejectValid}
              onClick={handleConfirm}
              className={`
                w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white
                focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${count} article${count !== 1 ? 's' : ''}`
              )}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced Bulk Actions Toolbar Component
 * Implements Task 14.4: Bulk Actions Interface with confirmation dialogs
 */
function BulkActionsToolbar({
  selectedArticles,
  articles,
  onBulkAction,
  onClearSelection,
  isLoading,
}: BulkActionsToolbarProps) {
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject';
  }>({
    isOpen: false,
    action: 'approve',
  });

  // Get selected article details for display
  const selectedArticleDetails = articles.filter((article) =>
    selectedArticles.has(article.id)
  );

  const selectedTitles = selectedArticleDetails.map((article) => article.title);
  const selectedCount = selectedArticles.size;

  /**
   * Handle bulk action initiation (shows confirmation dialog)
   */
  const handleBulkActionClick = useCallback(
    (action: 'approve' | 'reject') => {
      if (selectedCount === 0) return;

      setConfirmationDialog({
        isOpen: true,
        action,
      });
    },
    [selectedCount]
  );

  /**
   * Handle confirmed bulk action
   */
  const handleConfirmedBulkAction = useCallback(
    async (reason?: string) => {
      try {
        const articleIds = Array.from(selectedArticles);
        await onBulkAction(confirmationDialog.action, articleIds, reason);

        // Close dialog and clear selection
        setConfirmationDialog({ isOpen: false, action: 'approve' });
        onClearSelection();
      } catch (error) {
        console.error('Bulk action failed:', error);
        // Keep dialog open on error so user can retry
      }
    },
    [
      selectedArticles,
      confirmationDialog.action,
      onBulkAction,
      onClearSelection,
    ]
  );

  /**
   * Handle dialog cancellation
   */
  const handleDialogCancel = useCallback(() => {
    setConfirmationDialog({ isOpen: false, action: 'approve' });
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (selectedCount === 0) return;

      switch (e.key) {
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) return; // Don't override Ctrl+A
          e.preventDefault();
          handleBulkActionClick('approve');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleBulkActionClick('reject');
          break;
        case 'Escape':
          e.preventDefault();
          onClearSelection();
          break;
      }
    },
    [selectedCount, handleBulkActionClick, onClearSelection]
  );

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Selection info */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedCount} article{selectedCount !== 1 ? 's' : ''}{' '}
                  selected
                </p>
                <p className="text-xs text-blue-700">
                  Choose an action or press Esc to clear selection
                </p>
              </div>
            </div>

            {/* Progress indicator for large selections */}
            {selectedCount > 50 && (
              <div className="flex items-center space-x-2 text-xs text-blue-700">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Large selection - please review carefully</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {/* Quick preview of selected articles */}
            {selectedCount <= 3 && (
              <div className="hidden sm:block text-xs text-blue-700 max-w-xs">
                <div className="font-medium">Selected:</div>
                {selectedTitles.slice(0, 2).map((title, index) => (
                  <div key={index} className="truncate" title={title}>
                    • {title}
                  </div>
                ))}
                {selectedCount > 2 && (
                  <div className="italic">... and {selectedCount - 2} more</div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkActionClick('approve')}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve ({selectedCount})
              </button>

              <button
                onClick={() => handleBulkActionClick('reject')}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject ({selectedCount})
              </button>

              <button
                onClick={onClearSelection}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-600">
            <span className="font-medium">Shortcuts:</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">A</kbd>{' '}
              Approve
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">R</kbd>{' '}
              Reject
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">
                Esc
              </kbd>{' '}
              Clear
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        action={confirmationDialog.action}
        count={selectedCount}
        articleTitles={selectedTitles}
        onConfirm={handleConfirmedBulkAction}
        onCancel={handleDialogCancel}
        isLoading={isLoading}
      />
    </>
  );
}

export default BulkActionsToolbar;
