'use client';

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  Suspense,
  useRef,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import dynamic from 'next/dynamic';

const ArticleEditor = dynamic(
  () => import('@/components/editor/ArticleEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white/70">Loading editor...</span>
        </div>
      </div>
    ),
  }
);
import CollapsibleSidebarToolbar from '@/components/editor/CollapsibleSidebarToolbar';
import MobileEditorMessage from '@/components/editor/MobileEditorMessage';
import ArticleSubmissionDialog, {
  ArticleMetadata,
} from '@/components/articles/ArticleSubmissionDialog';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getArticleAccessControl } from '@/lib/content/article-status';
import { htmlToMarkdown, isMarkdown } from '@/lib/content/html-to-markdown';
import Stepper, { Step } from '@/components/editor/Stepper';
import { AnimatePresence, motion } from 'framer-motion';

interface Article {
  id: string;
  title: string;
  slug: string;
  body_md: string;
  status: string;
  tags: string[];
  excerpt: string;
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to format relative date
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'dzisiaj';
  if (diffDays === 1) return 'wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `${weeks} tyg. temu`;
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingArticle, setExistingArticle] = useState<Article | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // State for editable title and excerpt
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');

  // Ref for title textarea auto-resize
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // State for submission dialog
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  // State for tutorial stepper
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if we're editing an existing article
  const editId = searchParams?.get('edit');

  // Load existing article if editing
  const loadArticle = useCallback(
    async (articleId: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/articles/${articleId}`);

        if (!response.ok) {
          throw new Error('Failed to load article');
        }

        const result = await response.json();
        const article = result.data;

        // Verify ownership
        if (article.author_id !== user?.id) {
          showError('You cannot edit this article');
          router.push('/dashboard/articles');
          return;
        }

        // Use centralized access control logic
        const accessControl = getArticleAccessControl(
          article.status as any,
          true
        );

        if (!accessControl.permissions.canView) {
          showError('This article cannot be accessed');
          router.push('/dashboard/articles');
          return;
        }

        setExistingArticle(article);
        setCoverImageUrl(article.cover_image_url || null);
        setIsReadOnly(accessControl.permissions.isReadOnly);
        setTitle(article.title || '');
        setExcerpt(article.excerpt || '');
      } catch (error) {
        console.error('Error loading article:', error);
        showError('Failed to load article');
        router.push('/dashboard/articles');
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, showError, router]
  );

  // Load article on mount if editing
  useEffect(() => {
    if (editId && user) {
      loadArticle(editId);
    }
  }, [editId, user, loadArticle]);

  // Auto-resize title textarea when title changes
  useLayoutEffect(() => {
    const resizeTextarea = () => {
      if (titleTextareaRef.current) {
        // Reset height to recalculate
        titleTextareaRef.current.style.height = 'auto';
        // Set new height based on scroll height
        const newHeight = titleTextareaRef.current.scrollHeight;
        if (newHeight > 0) {
          titleTextareaRef.current.style.height = `${newHeight}px`;
        }
      }
    };

    // Immediate resize (synchronous)
    resizeTextarea();

    // Also resize after a microtask to ensure DOM is fully updated
    const timeoutId = setTimeout(resizeTextarea, 0);

    // And after browser has finished painting (double RAF for reliability)
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(resizeTextarea);
    });

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [title]);

  // Additional effect to resize after article is loaded
  useEffect(() => {
    if (existingArticle && titleTextareaRef.current) {
      // Force resize after article loads with a small delay
      // This ensures fonts are loaded and DOM is ready
      const timeoutId = setTimeout(() => {
        if (titleTextareaRef.current) {
          titleTextareaRef.current.style.height = 'auto';
          const newHeight = titleTextareaRef.current.scrollHeight;
          if (newHeight > 0) {
            titleTextareaRef.current.style.height = `${newHeight}px`;
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [existingArticle]);

  const handleSave = async (
    markdown: string,
    metadata?: Partial<ArticleMetadata>
  ) => {
    console.log('[FRONTEND] handleSave called');
    console.log('[FRONTEND] Save parameters:', {
      markdownLength: markdown?.length || 0,
      hasMetadata: !!metadata,
      metadata: metadata,
      userId: user?.id,
      hasUser: !!user,
      existingArticleId: existingArticle?.id,
    });

    if (!user) {
      console.error('[FRONTEND] No user found for save operation');
      showError('Please sign in to save articles');
      return;
    }

    // Prevent multiple simultaneous saves
    if (isSubmitting) {
      console.log('[FRONTEND] Save already in progress, skipping');
      return;
    }

    // Validate markdown content
    if (!markdown || markdown.trim().length === 0) {
      console.error('[FRONTEND] Empty content, cannot save');
      showError('Cannot save empty article');
      return;
    }

    // Check if content is HTML instead of Markdown (safety check)
    if (!isMarkdown(markdown)) {
      console.warn(
        '[FRONTEND] Content appears to be HTML, converting to Markdown'
      );
      markdown = htmlToMarkdown(markdown);
      console.log('[FRONTEND] Converted HTML to Markdown', {
        newMarkdownLength: markdown.length,
      });
    }

    console.log('[FRONTEND] Starting save operation');
    setIsSubmitting(true);

    try {
      let response;

      // Determine cover image URL (null if empty)
      const finalCoverImageUrl =
        metadata?.coverImageUrl ||
        coverImageUrl ||
        existingArticle?.cover_image_url ||
        null;

      const requestBody: any = {
        body_md: markdown,
        title: title || 'Untitled Draft',
        tags: metadata?.tags || existingArticle?.tags || [],
        excerpt: excerpt || '',
        status: 'draft',
        author_id: user.id,
      };

      // Only include cover_image_url if it has a value
      if (finalCoverImageUrl) {
        requestBody.cover_image_url = finalCoverImageUrl;
      }

      console.log('[FRONTEND] Prepared request body:', {
        title: requestBody.title,
        author_id: requestBody.author_id,
        status: requestBody.status,
        body_md_length: requestBody.body_md.length,
        tags_count: requestBody.tags.length,
        has_excerpt: !!requestBody.excerpt,
        has_cover_image: !!finalCoverImageUrl,
      });

      if (existingArticle) {
        // Update existing article (only fields allowed by schema)
        console.log(
          '[FRONTEND] Updating existing article:',
          existingArticle.id
        );
        const updateBody: any = {
          title: requestBody.title,
          body_md: requestBody.body_md,
          status: requestBody.status,
          tags: requestBody.tags,
          excerpt: requestBody.excerpt,
        };

        // Only include cover_image_url if it has a value
        if (finalCoverImageUrl) {
          updateBody.cover_image_url = finalCoverImageUrl;
        }

        console.log('[FRONTEND] Update request body:', updateBody);

        response = await fetch(`/api/articles/${existingArticle.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateBody),
        });
      } else {
        // Create new article
        console.log('[FRONTEND] Creating new article');
        console.log('[FRONTEND] Create request body:', requestBody);

        response = await fetch('/api/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      console.log(
        '[FRONTEND] API Response status:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[FRONTEND] API Error response:', errorData);
        const errorMessage =
          errorData.message || errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[FRONTEND] API Success response:', result);

      const article = result.data || result;
      console.log('[FRONTEND] Extracted article data:', {
        id: article?.id,
        title: article?.title,
        status: article?.status,
        created_at: article?.created_at,
      });

      // Validate the response
      if (!article || !article.id) {
        console.error('[FRONTEND] Invalid response structure:', {
          result,
          article,
        });
        throw new Error('Invalid response from server');
      }

      showSuccess(
        existingArticle
          ? 'Article updated successfully!'
          : 'Draft saved successfully!',
        'Your changes have been saved.'
      );

      // Update the existing article state (for both new and existing)
      if (existingArticle) {
        setExistingArticle((prev) => ({
          ...prev,
          ...article,
          // Preserve original creation date
          created_at: prev?.created_at || article.created_at,
        }));
      } else {
        // For new articles, update state and URL without page reload
        console.log('[SAVE_DRAFT] New article created, updating state', {
          articleId: article.id,
        });
        setExistingArticle(article);

        // Update URL without reload using replaceState
        window.history.replaceState(null, '', `/write?edit=${article.id}`);
        console.log('[SAVE_DRAFT] URL updated to /write?edit=' + article.id);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      showError(
        'Failed to save article',
        `${errorMessage}. Please check your connection and try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation function to check if article is ready for submission
  const validateArticleForSubmission = (): boolean => {
    // Validate title
    if (!title || title.trim().length < 10) {
      showWarning(
        `You need at least 10 characters for the title. Currently you have: ${title?.trim().length || 0} characters.`,
        '⚠️ Title too short'
      );
      return false;
    }

    // Validate excerpt
    if (!excerpt || excerpt.trim().length < 50) {
      showWarning(
        `You need at least 50 characters for the excerpt. Currently you have: ${excerpt?.trim().length || 0} characters.`,
        '⚠️ Excerpt too short'
      );
      return false;
    }

    // Validate content
    const html = editorInstance?.getHTML() || '';
    const markdown = htmlToMarkdown(html);

    if (!markdown || markdown.trim().length === 0) {
      showWarning(
        'Your article content cannot be empty. Please write some content before submitting.',
        '⚠️ Empty article'
      );
      return false;
    }

    // Check if content is too short (minimum 100 characters)
    if (markdown.trim().length < 100) {
      showWarning(
        `You need at least 100 characters for the article content. Currently you have: ${markdown.trim().length} characters.`,
        '⚠️ Article too short'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (markdown: string, metadata: ArticleMetadata) => {
    // Validate title and excerpt (kept for safety, but should not be needed now)
    if (!title || title.trim().length < 10) {
      showError('Title must be at least 10 characters');
      return;
    }
    if (!excerpt || excerpt.trim().length < 50) {
      showError('Excerpt must be at least 50 characters');
      return;
    }

    // Validate markdown content
    if (!markdown || markdown.trim().length === 0) {
      showError('Cannot submit empty article');
      return;
    }

    // Check if content is HTML instead of Markdown (safety check)
    if (!isMarkdown(markdown)) {
      console.warn(
        '[SUBMIT] Content appears to be HTML, converting to Markdown'
      );
      markdown = htmlToMarkdown(markdown);
    }

    console.log('📝 [WRITE_PAGE] handleSubmit called with metadata:', {
      title,
      excerpt,
      coverImageUrl: metadata.coverImageUrl,
      localCoverImageUrl: coverImageUrl,
      existingCoverImageUrl: existingArticle?.cover_image_url,
      hasCoverImage: !!(
        metadata.coverImageUrl ||
        coverImageUrl ||
        existingArticle?.cover_image_url
      ),
    });

    if (!user) {
      showError('Please sign in to submit articles');
      return;
    }

    // Prevent multiple simultaneous submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      let response;

      // Determine cover image URL (null if empty)
      const finalCoverImageUrl =
        metadata.coverImageUrl ||
        coverImageUrl ||
        existingArticle?.cover_image_url ||
        null;

      const requestBody: any = {
        body_md: markdown,
        title: title,
        tags: metadata.tags,
        excerpt: excerpt,
        status: 'pending', // Submit for review
        author_id: user.id,
      };

      // Only include cover_image_url if it has a value
      if (finalCoverImageUrl) {
        requestBody.cover_image_url = finalCoverImageUrl;
      }

      if (existingArticle) {
        // Update existing article and change status to pending
        const updateBody: any = {
          title: requestBody.title,
          body_md: requestBody.body_md,
          status: requestBody.status,
          tags: requestBody.tags,
          excerpt: requestBody.excerpt,
        };

        // Only include cover_image_url if it has a value
        if (finalCoverImageUrl) {
          updateBody.cover_image_url = finalCoverImageUrl;
        }

        console.log(
          '🔄 [WRITE_PAGE] Updating existing article with ID:',
          existingArticle.id
        );
        console.log('🔄 [WRITE_PAGE] Update body:', {
          title: updateBody.title,
          cover_image_url: updateBody.cover_image_url,
          hasCoverImage: !!updateBody.cover_image_url,
        });
        response = await fetch(`/api/articles/${existingArticle.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateBody),
        });
      } else {
        // Create new article with pending status
        console.log('➕ [WRITE_PAGE] Creating new article');
        console.log('➕ [WRITE_PAGE] Request body:', {
          title: requestBody.title,
          cover_image_url: requestBody.cover_image_url,
          hasCoverImage: !!requestBody.cover_image_url,
        });
        response = await fetch('/api/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const article = result.data || result;

      // Validate the response
      if (!article || !article.id) {
        throw new Error('Invalid response from server');
      }

      showSuccess(
        'Article submitted for review!',
        'You will receive a notification when the review is complete.'
      );

      // Small delay before redirect to allow user to see the success message
      setTimeout(() => {
        router.push('/dashboard/articles');
      }, 1500);
    } catch (error) {
      console.error('Error submitting article:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';

      showError(
        'Failed to submit article for review',
        `${errorMessage}. Please check your connection and try again.`
      );
      throw error; // Re-throw so the dialog can handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading screen while loading article
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="pt-16 sm:pt-20 pb-6 sm:pb-8">
              <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="text-white/70">Loading article...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {/* Mobile Message - Show on screens smaller than tablet */}
      <div className="block md:hidden">
        <MobileEditorMessage />
      </div>

      {/* Full Editor - Show on tablet and larger screens */}
      <div
        className="hidden md:block min-h-screen bg-[#000000]"
        style={{ backgroundColor: '#000000' }}
      >
        <div className="pt-4 pb-6">
          {/* Back link (align to content) */}
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              <div className="w-64 flex-shrink-0 hidden lg:block" />
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                <div className="mt-[8.5rem]">
                  <Link
                    href="/dashboard/articles"
                    className="inline-flex items-center gap-2 transition-colors font-mono text-sm text-white/70 hover:text-white"
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
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Powrót do artykułów
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main layout with sticky TOC space (desktop) */}
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              {/* Empty space for TOC alignment */}
              <aside className="w-64 flex-shrink-0 hidden lg:block" />

              {/* Article content */}
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                {/* Header with editable fields */}
                <header className="mb-8">
                  <time className="text-sm font-mono block my-3 text-white/60">
                    {formatRelativeDate(new Date().toISOString())}
                  </time>

                  {/* Editable Title */}
                  <div className="mb-6">
                    <textarea
                      ref={titleTextareaRef}
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onInput={(e) => {
                        // Also handle onInput for better responsiveness
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Tytuł artykułu, minimalnie 10 znaków"
                      disabled={isReadOnly}
                      rows={1}
                      className={`w-full text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-inter text-white bg-transparent outline-none focus:ring-0 placeholder:text-white/30 resize-none overflow-hidden border-2 rounded-lg px-2 transition-colors ${
                        title.trim().length > 0 && title.trim().length < 10
                          ? 'border-red-500/50 focus:border-red-500'
                          : 'border-transparent focus:border-white/20'
                      }`}
                      style={{ minHeight: '3em' }}
                    />
                    {/* Character counter for title */}
                    <div className="mt-2 flex items-center gap-2 text-sm font-mono">
                      <span
                        className={`${
                          title.trim().length >= 10
                            ? 'text-green-500'
                            : title.trim().length > 0
                              ? 'text-red-500'
                              : 'text-white/40'
                        }`}
                      >
                        {title.trim().length} / 10 characters
                      </span>
                      {title.trim().length > 0 && title.trim().length < 10 && (
                        <span className="text-red-400 text-xs">
                          • Need {10 - title.trim().length} more characters
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Editable Excerpt */}
                  <div className="mb-8">
                    <textarea
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Krótki opis artykułu, minimum 50 znaków"
                      rows={3}
                      disabled={isReadOnly}
                      className={`w-full text-xl leading-relaxed font-source text-white/80 bg-transparent outline-none focus:ring-0 resize-none placeholder:text-white/30 border-2 rounded-lg px-3 py-2 transition-colors ${
                        excerpt.trim().length > 0 && excerpt.trim().length < 50
                          ? 'border-red-500/50 focus:border-red-500'
                          : 'border-transparent focus:border-white/20'
                      }`}
                    />
                    {/* Character counter for excerpt */}
                    <div className="mt-2 flex items-center gap-2 text-sm font-mono">
                      <span
                        className={`${
                          excerpt.trim().length >= 50
                            ? 'text-green-500'
                            : excerpt.trim().length > 0
                              ? 'text-red-500'
                              : 'text-white/40'
                        }`}
                      >
                        {excerpt.trim().length} / 50 characters
                      </span>
                      {excerpt.trim().length > 0 &&
                        excerpt.trim().length < 50 && (
                          <span className="text-red-400 text-xs">
                            • Need {50 - excerpt.trim().length} more characters
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Metadata bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-white/60">
                      <span>Autor: {user?.handle || 'StrayLight'}</span>
                      <span>•</span>
                      <span>
                        {Math.max(
                          1,
                          Math.ceil(
                            (editorInstance?.storage?.characterCount?.words?.() ||
                              0) / 200
                          )
                        )}{' '}
                        min czytania
                      </span>
                    </div>

                    {/* Like Button (placeholder) */}
                    <div className="flex items-center">
                      <button
                        disabled
                        className="opacity-50 cursor-not-allowed scale-125"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-white/40"
                        >
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </header>

                {/* Separator */}
                <div className="h-px mb-12 bg-white/10" />

                {/* Editor - No wrapper, black background */}
                <div
                  className="w-full"
                  style={{ maxWidth: '100%', width: '100%' }}
                >
                  <ArticleEditor
                    className="w-full max-w-full"
                    onEditorReady={setEditorInstance}
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    initialContent={
                      existingArticle?.body_md ||
                      'Treść artykułu, minimum 100 znaków...'
                    }
                    placeholder="Treść artykułu, minimum 100 znaków..."
                    documentId={
                      existingArticle?.id ||
                      `new-article-${user?.id}-${Date.now()}`
                    }
                    userId={user?.id}
                    enableAutosave={true}
                    autosaveDelay={30000}
                    enablePreview={false}
                    defaultPreviewMode="edit"
                    enablePublishing={!isReadOnly}
                    showStatusBadge={false}
                    disabled={isReadOnly}
                    articleStatus={(existingArticle?.status as any) || 'draft'}
                    initialMetadata={{
                      tags: existingArticle?.tags || [],
                      category: '',
                      coverImageUrl:
                        coverImageUrl ||
                        existingArticle?.cover_image_url ||
                        null,
                    }}
                    currentCoverImageUrl={
                      coverImageUrl || existingArticle?.cover_image_url
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Sidebar Toolbar - Fixed to left edge */}
          <div className="hidden xl:block fixed left-2 top-36 z-10">
            <div className="glass-enhanced rounded-2xl shadow-premium bg-white/5 border-white/10">
              <CollapsibleSidebarToolbar
                editor={editorInstance}
                userId={user?.id}
                documentId={existingArticle?.id}
              />
            </div>
          </div>

          {/* Tutorial FAB Button - Left bottom corner */}
          <button
            onClick={() => setShowTutorial(true)}
            className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white shadow-xl transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
            aria-label="Pokaż tutorial edytora"
            title="Pomoc - Tutorial edytora"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Fixed Action Buttons - Bottom Right Corner of Screen */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <button
              onClick={() => {
                // Get HTML from editor and convert to Markdown
                const html = editorInstance?.getHTML() || '';
                console.log('[SAVE_DRAFT] Converting HTML to Markdown', {
                  htmlLength: html.length,
                  htmlPreview: html.substring(0, 100),
                });

                // Convert HTML to Markdown before saving
                const markdown = htmlToMarkdown(html);
                console.log('[SAVE_DRAFT] Markdown converted', {
                  markdownLength: markdown.length,
                  markdownPreview: markdown.substring(0, 100),
                  isValidMarkdown: isMarkdown(markdown),
                });

                handleSave(markdown);
              }}
              disabled={isSubmitting || isReadOnly}
              className={`btn-premium hover-lift micro-interaction px-4 py-2.5 shadow-xl flex items-center gap-2 bg-white/10 text-white hover:bg-white/20
                ${isSubmitting || isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Save article draft"
            >
              {isSubmitting && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            {!isReadOnly &&
              (!existingArticle || existingArticle.status === 'draft') && (
                <button
                  onClick={() => {
                    // Validate article before opening submission dialog
                    if (validateArticleForSubmission()) {
                      setShowSubmissionDialog(true);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`btn-premium btn-premium-primary hover-lift micro-interaction px-4 py-2.5 shadow-xl flex items-center gap-2
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m22 2-7 20-4-9-9-4 20-7z" fill="currentColor" />
                  </svg>
                  Submit for Review
                </button>
              )}
          </div>
        </div>

        {/* Article Submission Dialog */}
        <ArticleSubmissionDialog
          isOpen={showSubmissionDialog}
          onClose={() => setShowSubmissionDialog(false)}
          onSubmit={async (metadata) => {
            // Convert HTML to Markdown
            const html = editorInstance?.getHTML() || '';
            const markdown = htmlToMarkdown(html);
            console.log(
              '[SUBMISSION_DIALOG] Submitting with metadata:',
              metadata
            );

            // Call handleSubmit with markdown and metadata
            await handleSubmit(markdown, metadata);
            setShowSubmissionDialog(false);
          }}
          onSaveDraft={async (metadata) => {
            // Convert HTML to Markdown
            const html = editorInstance?.getHTML() || '';
            const markdown = htmlToMarkdown(html);
            console.log(
              '[SUBMISSION_DIALOG] Saving draft with metadata:',
              metadata
            );

            // Call handleSave with markdown and metadata
            await handleSave(markdown, metadata);
            setShowSubmissionDialog(false);
          }}
          initialMetadata={{
            tags: existingArticle?.tags || [],
            category: '',
            coverImageUrl:
              coverImageUrl || existingArticle?.cover_image_url || null,
          }}
          wordCount={editorInstance?.storage?.characterCount?.words?.() || 0}
          readingTime={Math.max(
            1,
            Math.ceil(
              (editorInstance?.storage?.characterCount?.words?.() || 0) / 200
            )
          )}
          isSubmitting={isSubmitting}
          userId={user?.id}
          documentId={existingArticle?.id}
          currentCoverImageUrl={
            coverImageUrl || existingArticle?.cover_image_url || null
          }
        />

        {/* Tutorial Stepper Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowTutorial(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowTutorial(false)}
                  className="absolute -top-4 -right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-xl transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
                  aria-label="Zamknij tutorial"
                >
                  <svg
                    className="h-5 w-5"
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

                <Stepper
                  initialStep={1}
                  onFinalStepCompleted={() => setShowTutorial(false)}
                  backButtonText="Wstecz"
                  nextButtonText="Dalej"
                  completeButtonText="Zakończ"
                >
                  {/* Slajd 1 - Minimalne wymagania */}
                  <Step>
                    <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Minimalne wymagania
                    </h2>

                    {/* Kompaktowy layout - 3 karty w rzędzie */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {/* Karta 1 - Tytuł */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
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
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">
                              Tytuł
                            </h3>
                            <p className="text-sm text-white/70">
                              min. 10 znaków
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Karta 2 - Excerpt */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
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
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">
                              Excerpt
                            </h3>
                            <p className="text-sm text-white/70">
                              min. 50 znaków
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Karta 3 - Treść */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">
                              Treść
                            </h3>
                            <p className="text-sm text-white/70">
                              min. 100 znaków
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Step>

                  {/* Slajd 2 - Nagłówki H2 */}
                  <Step>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
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
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Nagłówki H2 - Nawigacja
                    </h2>
                    <div className="w-full">
                      <div className="grid grid-cols-[3fr_2fr] gap-3 w-full">
                        {/* Lewa kolumna: obraz + tekst */}
                        <div className="space-y-3">
                          {/* Lewy obraz - szerszy, poziomy */}
                          <div className="rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                            <Image
                              src="/stepper/2.1.png"
                              alt="Nagłówki w artykule"
                              width={482}
                              height={252}
                              className="w-full h-auto"
                            />
                          </div>

                          {/* Tekst pod lewym obrazem */}
                          <p className="text-sm leading-relaxed text-white/80">
                            Używaj <strong className="text-white">H2</strong>{' '}
                            aby stworzyć automatyczne odnośniki w menu, które
                            ułatwią czytelnikom nawigację po artykule. Nagłówki
                            drugiego poziomu generują spis treści automatycznie,
                            pozwalając na szybkie przemieszczanie się między
                            sekcjami.
                          </p>
                        </div>

                        {/* Prawa kolumna: prawy obraz */}
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                          <Image
                            src="/stepper/2.2.png"
                            alt="Toolbar - opcja H2"
                            width={262}
                            height={338}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    </div>
                  </Step>

                  {/* Slajd 3 - Toolbar */}
                  <Step>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Toolbar edytora
                    </h2>
                    <div className="w-full">
                      <div className="grid grid-cols-[2fr_3fr] gap-4 w-full">
                        {/* Lewa kolumna: porady dotyczące korzystania z narzędzi */}
                        <div className="space-y-3 text-sm text-white/80 leading-relaxed">
                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Nagłówki
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">H2</strong>{' '}
                              generują nawigację,{' '}
                              <strong className="text-white">H3</strong> dla
                              podsekcji.
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Formatowanie
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">Bold</strong> dla
                              kluczowych pojęć,{' '}
                              <em className="italic">Italic</em> dla akcentów.
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Listy
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">
                                Bullet List
                              </strong>{' '}
                              dla elementów,{' '}
                              <strong className="text-white">
                                Numbered List
                              </strong>{' '}
                              dla kroków.
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Kod
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">Code Block</strong>{' '}
                              dla dłuższych fragmentów z kolorowaniem składni.
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Cytaty
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">Quote</strong> dla
                              cytatów ekspertów i definicji - wyróżnia treść
                              wizualnie.
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Media
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">Add Image</strong>{' '}
                              dla diagramów i zrzutów.{' '}
                              <strong className="text-white">Link</strong> z
                              opisowymi tekstami.
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-semibold mb-1 flex items-center gap-1.5 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              Narzędzia
                            </h3>
                            <p className="text-xs">
                              <strong className="text-white">Divider</strong>{' '}
                              rozdziela sekcje.{' '}
                              <strong className="text-white">Clear</strong>{' '}
                              czyści formatowanie.
                            </p>
                          </div>
                        </div>

                        {/* Prawa kolumna: dwa screeny obok siebie */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Screen 1 */}
                          <div className="rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                            <Image
                              src="/stepper/3.1.png"
                              alt="Toolbar część 1"
                              width={212}
                              height={468}
                              className="w-full h-auto"
                            />
                          </div>

                          {/* Screen 2 */}
                          <div className="rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                            <Image
                              src="/stepper/3.2.png"
                              alt="Toolbar część 2"
                              width={212}
                              height={468}
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Step>

                  {/* Slajd 4 - Zapisywanie i Submit */}
                  <Step>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
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
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Zapisywanie i publikacja
                    </h2>

                    {/* Grid 2x2 - 4 równe części */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full">
                      {/* Lewa górna - tekst o braku autozapisu */}
                      <div className="flex items-center justify-center p-6 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="text-center space-y-2">
                          <svg
                            className="w-8 h-8 mx-auto text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <p className="text-sm text-white/90 leading-relaxed">
                            <strong className="text-red-300 block mb-1">
                              BRAK autozapisu!
                            </strong>
                            Zawsze pamiętaj o kliknięciu{' '}
                            <strong className="text-white">
                              &quot;Save Draft&quot;
                            </strong>{' '}
                            przed wyjściem z karty, aby nie utracić postępu w
                            pisaniu artykułu.
                          </p>
                        </div>
                      </div>

                      {/* Prawa górna - zdjęcie 4.1 (przyciski) */}
                      <div className="flex items-center justify-center rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                        <Image
                          src="/stepper/4.1.png"
                          alt="Przyciski Save Draft i Submit"
                          width={313}
                          height={161}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Lewa dolna - zdjęcie 4.2 (AI logo) dopasowane do rozmiaru 4.1 */}
                      <div className="flex items-center justify-center rounded-lg overflow-hidden border border-white/10 bg-neutral-900">
                        <Image
                          src="/stepper/4.2.png"
                          alt="AI assistance"
                          width={313}
                          height={161}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Prawa dolna - tekst o metadanych przed submitem */}
                      <div className="flex items-center justify-center p-6 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-center space-y-2">
                          <svg
                            className="w-8 h-8 mx-auto text-white/70"
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
                          <p className="text-sm text-white/80 leading-relaxed">
                            Przed submitem artykułu do przeglądu będziesz musiał
                            dodać{' '}
                            <strong className="text-white">cover image</strong>,{' '}
                            <strong className="text-white">tagi</strong> oraz{' '}
                            <strong className="text-white">kategorię</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Step>
                </Stepper>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}

export default function WritePage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="pt-16 sm:pt-20 pb-6 sm:pb-8">
                <div className="flex items-center justify-center min-h-96">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                    <span className="text-black/70 dark:text-white/70">
                      Loading...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProtectedRoute>
      }
    >
      <WritePageContent />
    </Suspense>
  );
}
