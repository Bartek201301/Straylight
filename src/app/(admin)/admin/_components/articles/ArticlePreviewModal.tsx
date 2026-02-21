'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import MarkdownPreview from '@/components/editor/MarkdownPreview';
import { calculateReadingTime } from '@/lib/content/reading-time';
import type { Article } from '@/lib/supabase';

/**
 * Extended Article type with author information for admin preview
 */
export interface PendingArticleWithAuthor extends Article {
  author: {
    id: string;
    handle: string;
    role: string;
    email?: string;
  };
}

interface ArticlePreviewModalProps {
  /** Article to preview */
  article: PendingArticleWithAuthor | null;
  /** Whether modal is open */
  isOpen: boolean;
  /** Close modal callback */
  onClose: () => void;
  /** Approve article callback */
  onApprove?: (_articleId: string) => Promise<void>;
  /** Reject article callback */
  onReject?: (_articleId: string) => Promise<void>;
  /** Navigate to previous article */
  onPrevious?: () => void;
  /** Navigate to next article */
  onNext?: () => void;
  /** Whether navigation is available */
  hasNavigation?: {
    previous: boolean;
    next: boolean;
  };
  /** Loading state for actions */
  actionLoading?: boolean;
}

/**
 * Article Preview Modal Component
 *
 * Implements Task 14.3: Build a modal component that displays article content preview
 * with formatted markdown rendering for review purposes
 */
function ArticlePreviewModal({
  article,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onPrevious,
  onNext,
  hasNavigation,
  actionLoading = false,
}: ArticlePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loadedArticle, setLoadedArticle] =
    useState<PendingArticleWithAuthor | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  // Track mounted state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !actionLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'auto';
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, actionLoading]);

  // Dociągnij pełną treść artykułu jeśli nie ma body_md
  useEffect(() => {
    const fetchContent = async () => {
      if (!isOpen || !article || article.body_md) {
        setLoadedArticle(null);
        return;
      }
      try {
        setContentLoading(true);
        const res = await fetch(`/api/articles/${article.id}`);
        const json = await res.json();
        const full = json?.data as any;
        if (full && full.body_md) {
          setLoadedArticle({ ...(article as any), body_md: full.body_md });
        } else {
          setLoadedArticle(null);
        }
      } catch (e) {
        setLoadedArticle(null);
      } finally {
        setContentLoading(false);
      }
    };
    fetchContent();
  }, [isOpen, article]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isOpen || actionLoading) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (hasNavigation?.previous && onPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (hasNavigation?.next && onNext) {
            e.preventDefault();
            onNext();
          }
          break;
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) return; // Don't override Ctrl+A
          if (article && onApprove) {
            e.preventDefault();
            handleApprove();
          }
          break;
        case 'r':
        case 'R':
          if (article && onReject) {
            e.preventDefault();
            handleReject();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    article,
    onApprove,
    onReject,
    onPrevious,
    onNext,
    hasNavigation,
    actionLoading,
  ]);

  // Calculate reading stats
  const effectiveArticle = loadedArticle || article;

  const readingStats = useMemo(() => {
    if (!effectiveArticle?.body_md) return null;

    const readingTime = calculateReadingTime(effectiveArticle.body_md);
    const wordCount = effectiveArticle.body_md.split(/\s+/).length;
    const charCount = effectiveArticle.body_md.length;

    return {
      readingTime,
      wordCount,
      charCount,
    };
  }, [effectiveArticle?.body_md]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (actionLoading) return;

    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose, actionLoading]);

  // Handle approve action
  const handleApprove = useCallback(async () => {
    if (!effectiveArticle || !onApprove || actionLoading) return;

    try {
      await onApprove(effectiveArticle.id);
    } catch (error) {
      console.error('Error approving article:', error);
    }
  }, [effectiveArticle, onApprove, actionLoading]);

  // Handle reject action
  const handleReject = useCallback(async () => {
    if (!effectiveArticle || !onReject || actionLoading) return;

    try {
      await onReject(effectiveArticle.id);
    } catch (error) {
      console.error('Error rejecting article:', error);
    }
  }, [effectiveArticle, onReject, actionLoading]);

  // Don't render if not mounted or not open
  if (!mounted || !isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 overflow-hidden
        transition-all duration-200 ease-out
        ${isClosing ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!actionLoading ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={`
            relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 
            rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
            transform transition-all duration-200 ease-out
            ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
            overflow-hidden flex flex-col
          `}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {effectiveArticle && (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 pr-8">
                      {effectiveArticle.title}
                    </h2>

                    {effectiveArticle.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {effectiveArticle.excerpt}
                      </p>
                    )}

                    {/* Article metadata */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {/* Author */}
                      <div className="flex items-center space-x-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          By:{' '}
                          <strong className="text-gray-900 dark:text-gray-100">
                            {effectiveArticle.author?.handle ?? 'Unknown'}
                          </strong>
                        </span>
                        {effectiveArticle.author?.role && (
                          <span className="text-gray-400">
                            ({effectiveArticle.author.role})
                          </span>
                        )}
                      </div>

                      {/* URL Preview */}
                      <div className="flex items-center space-x-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          /articles/{effectiveArticle.slug}
                        </code>
                      </div>

                      {/* Reading stats */}
                      {readingStats && (
                        <>
                          <div className="flex items-center space-x-1.5">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>
                              {readingStats.readingTime.minutes}m read
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{readingStats.wordCount} words</span>
                          </div>
                        </>
                      )}

                      {/* Submission date */}
                      <div className="flex items-center space-x-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Submitted:{' '}
                          {new Date(
                            effectiveArticle.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {effectiveArticle.tags &&
                      effectiveArticle.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {effectiveArticle.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={actionLoading}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {contentLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  <span>Loading content...</span>
                </div>
              </div>
            ) : effectiveArticle?.body_md ? (
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6">
                  {/* Cover Image */}
                  {(() => {
                    console.log('🖼️ [ADMIN_MODAL] Article data:', {
                      title: effectiveArticle.title,
                      coverImageUrl: effectiveArticle.cover_image_url,
                      hasCoverImage: !!effectiveArticle.cover_image_url,
                    });
                    return null;
                  })()}
                  {effectiveArticle.cover_image_url && (
                    <div className="mb-8">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <img
                          src={effectiveArticle.cover_image_url}
                          alt={`Cover image for ${effectiveArticle.title}`}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      </div>
                    </div>
                  )}

                  <div
                    className={`
                    prose prose-gray dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                    prose-code:text-gray-900 dark:prose-code:text-gray-100
                    prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800
                    prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
                    prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
                  `}
                  >
                    <MarkdownPreview markdown={effectiveArticle.body_md} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg">No content available</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              {/* Navigation */}
              <div className="flex items-center space-x-2">
                {hasNavigation && (onPrevious || onNext) && (
                  <>
                    <button
                      onClick={onPrevious}
                      disabled={!hasNavigation.previous || actionLoading}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous
                    </button>

                    <button
                      onClick={onNext}
                      disabled={!hasNavigation.next || actionLoading}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <svg
                        className="w-4 h-4 ml-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-3">
                {actionLoading && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Processing...</span>
                  </div>
                )}

                {article && (
                  <>
                    {onReject && (
                      <button
                        onClick={handleReject}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        Reject
                      </button>
                    )}

                    {onApprove && (
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        Approve
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Keyboard shortcuts help */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Keyboard shortcuts:</span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    Esc
                  </kbd>{' '}
                  Close
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    ←
                  </kbd>{' '}
                  Previous
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    →
                  </kbd>{' '}
                  Next
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    A
                  </kbd>{' '}
                  Approve
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    R
                  </kbd>{' '}
                  Reject
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ArticlePreviewModal;
