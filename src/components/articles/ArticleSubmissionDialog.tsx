'use client';

import React, { useState } from 'react';
import { ArticleStatusBadge } from './ArticleStatusBadge';
import CoverImageUpload from '@/components/editor/CoverImageUpload';
import { CATEGORY_TAGS } from '@/lib/constants/tags';
import { useTheme } from '@/contexts/ThemeContext';

export interface ArticleMetadata {
  tags: string[];
  category?: string;
  coverImageUrl?: string | null;
}

interface ArticleSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (metadata: ArticleMetadata) => Promise<void>;
  onSaveDraft: (metadata: ArticleMetadata) => Promise<void>;
  initialMetadata: Partial<ArticleMetadata>;
  wordCount: number;
  readingTime: number;
  isSubmitting?: boolean;
  userId?: string;
  documentId?: string;
  currentCoverImageUrl?: string | null;
}

const AVAILABLE_CATEGORIES = [
  'Technology',
  'Science',
  'Research',
  'Tutorial',
  'Opinion',
  'News',
  'Analysis',
  'Review',
];

// Static suggested tags removed — tags must come from database suggestions

export default function ArticleSubmissionDialog({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
  initialMetadata,
  wordCount,
  readingTime,
  isSubmitting = false,
  userId,
  documentId,
  currentCoverImageUrl,
}: ArticleSubmissionDialogProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [metadata, setMetadata] = useState<ArticleMetadata>({
    tags: initialMetadata.tags || [],
    category: initialMetadata.category || '',
    coverImageUrl:
      initialMetadata.coverImageUrl || currentCoverImageUrl || null,
  });

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    currentCoverImageUrl || null
  );

  const [_errors, setErrors] = useState<
    Partial<Record<keyof ArticleMetadata, string>>
  >({});

  const validateMetadata = (): boolean => {
    const newErrors: Partial<Record<keyof ArticleMetadata, string>> = {};

    if (metadata.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    } else if (metadata.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoverImageChange = (imageUrl: string | null) => {
    console.log('🖼️ [SUBMISSION_DIALOG] Cover image changed:', imageUrl);
    setCoverImageUrl(imageUrl);
    setMetadata((prev) => ({ ...prev, coverImageUrl: imageUrl }));
  };

  const handleSubmit = async () => {
    if (validateMetadata()) {
      const finalMetadata = { ...metadata, coverImageUrl };
      console.log('🚀 [SUBMISSION_DIALOG] Submitting with metadata:', {
        tags: finalMetadata.tags,
        coverImageUrl: finalMetadata.coverImageUrl,
        hasCoverImage: !!finalMetadata.coverImageUrl,
      });
      await onSubmit(finalMetadata);
    }
  };

  const handleSaveDraft = async () => {
    const finalMetadata = { ...metadata, coverImageUrl };
    await onSaveDraft(finalMetadata);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`
        rounded-2xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border
        ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'}
      `}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-300'}`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-3xl font-bold font-premium ${isDark ? 'text-white' : 'text-black'}`}
            >
              Publish Article
            </h2>
            <button
              onClick={onClose}
              className={`p-3 rounded-xl transition-colors ${
                isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
              }`}
              disabled={isSubmitting}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div
              className={`flex items-center space-x-4 text-base ${isDark ? 'text-white/70' : 'text-black/70'}`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                {wordCount} words
              </span>
              <span className="opacity-60">•</span>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline
                    points="12,6 12,12 16,14"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                {readingTime} min read
              </span>
            </div>
            <ArticleStatusBadge status="draft" size="sm" />
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-8">
          {/* Cover Image */}
          {userId && (
            <div>
              <label
                className={`block text-base font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Cover Image
              </label>
              <CoverImageUpload
                userId={userId}
                documentId={documentId}
                currentImageUrl={coverImageUrl}
                onImageChange={handleCoverImageChange}
              />
              <p
                className={`mt-3 text-sm flex items-center gap-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Add an eye-catching cover image to make your article stand out
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label
              className={`block text-base font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}
            >
              Category
            </label>
            <select
              value={metadata.category}
              onChange={(e) =>
                setMetadata((prev) => ({ ...prev, category: e.target.value }))
              }
              className={`w-full px-4 py-4 rounded-xl text-base transition-all duration-200 border-2
                ${
                  isDark
                    ? 'border-neutral-600 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20 bg-neutral-800 text-white'
                    : 'border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 bg-neutral-50 text-black'
                }
                focus:outline-none`}
              disabled={isSubmitting}
            >
              <option
                value=""
                className={
                  isDark ? 'bg-black text-white' : 'bg-white text-black'
                }
              >
                Select a category
              </option>
              {AVAILABLE_CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                  className={
                    isDark ? 'bg-black text-white' : 'bg-white text-black'
                  }
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Tags (DB-only via TagInput) */}
          <div>
            <label
              className={`block text-base font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}
            >
              Tags * ({metadata.tags.length}/10)
            </label>

            {/* Klikalne kategorie zamiast wyszukiwarki */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TAGS.map((cat) => {
                const isSelected = metadata.tags.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setMetadata((prev) => {
                        const exists = prev.tags.includes(cat.slug);
                        const next = exists
                          ? prev.tags.filter((t) => t !== cat.slug)
                          : prev.tags.length < 10
                            ? [...prev.tags, cat.slug]
                            : prev.tags;
                        return { ...prev, tags: next };
                      });
                    }}
                    className={`text-sm px-3 py-2 rounded-xl border transition-all inline-flex items-center
                      ${
                        isSelected
                          ? isDark
                            ? 'bg-neutral-700 border-neutral-600 text-white'
                            : 'bg-neutral-200 border-neutral-300 text-black'
                          : isDark
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      }
                    `}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        isDark
                          ? 'bg-neutral-700 text-white border border-neutral-600'
                          : 'bg-neutral-200 text-black border border-neutral-300'
                      }`}
                  >
                    <span className="mr-2">#</span>
                    {(() => {
                      const match = CATEGORY_TAGS.find((c) => c.slug === tag);
                      return match ? match.label : tag;
                    })()}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className={`ml-2 p-1 rounded-full transition-colors
                        ${
                          isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-600'
                            : 'text-neutral-600 hover:text-black hover:bg-neutral-300'
                        }`}
                      disabled={isSubmitting}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <line
                          x1="18"
                          y1="6"
                          x2="6"
                          y2="18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="6"
                          y1="6"
                          x2="18"
                          y2="18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submission Info */}
          <div
            className={`rounded-2xl p-6 border
            ${
              isDark
                ? 'bg-neutral-800 border-neutral-700'
                : 'bg-neutral-100 border-neutral-300'
            }`}
          >
            <h3
              className={`font-semibold text-lg mb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}
            >
              <div
                className={`p-2 rounded-xl ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="16"
                    y1="13"
                    x2="8"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="16"
                    y1="17"
                    x2="8"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="10"
                    y1="9"
                    x2="8"
                    y2="9"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              Submission Process
            </h3>
            <ul
              className={`text-base space-y-3 ${isDark ? 'text-white/80' : 'text-black/80'}`}
            >
              <li className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-0.5
                  ${isDark ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-black'}`}
                >
                  1
                </span>
                Your article will be reviewed by our editorial team
              </li>
              <li className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-0.5
                  ${isDark ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-black'}`}
                >
                  2
                </span>
                Review typically takes 1-3 business days
              </li>
              <li className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-0.5
                  ${isDark ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-black'}`}
                >
                  3
                </span>
                You&apos;ll receive email notifications about status changes
              </li>
              <li className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-0.5
                  ${isDark ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-black'}`}
                >
                  4
                </span>
                Editorial suggestions will be clearly marked
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`p-6 border-t flex flex-col sm:flex-row gap-4 ${isDark ? 'border-neutral-700' : 'border-neutral-300'}`}
        >
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 border-2
              ${
                isSubmitting
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'border-neutral-600 text-white hover:bg-neutral-800 hover:border-neutral-500'
                    : 'border-neutral-300 text-black hover:bg-neutral-100 hover:border-neutral-400'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <polyline
                  points="17,21 17,13 7,13 7,21"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <polyline
                  points="7,3 7,8 15,8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </div>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200
              ${
                isSubmitting
                  ? 'opacity-50 cursor-not-allowed bg-neutral-600 text-white'
                  : isDark
                    ? 'bg-white text-black hover:bg-neutral-100 hover:shadow-lg'
                    : 'bg-black text-white hover:bg-neutral-800 hover:shadow-lg'
              }`}
          >
            <div className="flex items-center justify-center gap-3">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points="22,2 15,22 11,13 2,9 22,2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Submit for Review
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
