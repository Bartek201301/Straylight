'use client';

import { useMemo, useState, useEffect } from 'react';
import Container from '@/components/layout/Container';
import ArticleContent from '@/app/(marketing)/articles/[slug]/_components/ArticleContent';
import {
  processArticleContent,
  ProcessedMarkdown,
} from '@/lib/content/markdown';
import ArticleToc from '@/components/articles/ArticleToc';
import ArticleTocOverlay from '@/components/articles/ArticleTocOverlay';
import Link from 'next/link';

interface PreviewData {
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  coverImageUrl?: string;
  metadata?: any;
}

interface PreviewContentProps {
  previewData: PreviewData;
}

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

export default function PreviewContent({ previewData }: PreviewContentProps) {
  const [processedContent, setProcessedContent] = useState<
    (ProcessedMarkdown & { enhancedExcerpt?: string }) | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Function to clean up sessionStorage when navigating back
  const handleBackToEditor = () => {
    sessionStorage.removeItem('article-preview-data');
  };

  // Process the markdown content
  useEffect(() => {
    async function processContent() {
      try {
        setIsProcessing(true);

        // Mock article object for processing
        const mockArticle = {
          id: 'preview',
          title: previewData.title,
          body_md: previewData.content,
          excerpt: previewData.excerpt || '',
          tags: previewData.tags || [],
          slug: 'preview',
          status: 'draft' as const,
          author_id: 'preview',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: null,
          view_count: 0,
          cover_image_url: previewData.coverImageUrl || null,
          featured: false,
        };

        const result = await processArticleContent(mockArticle);
        setProcessedContent(result);
      } catch (error) {
        console.error('Error processing preview content:', error);
        setProcessedContent({
          html: `<p>Error processing content: ${error}</p>`,
          error: 'Failed to process markdown content',
          wordCount: 0,
          readingTime: 1,
          readingTimeData: {
            minutes: 1,
            words: 0,
            time: 60,
            text: '1 min',
            imageReadingTime: 0,
            codeReadingTime: 0,
            textReadingTime: 60,
          },
          readingStats: {
            textWords: 0,
            codeWords: 0,
            imageCount: 0,
            readingSpeed: 'average' as const,
          },
          enhancedExcerpt: previewData.excerpt || '',
          frontmatter: undefined,
        });
      } finally {
        setIsProcessing(false);
      }
    }

    processContent();
  }, [previewData]);

  // Calculate reading time for display
  const readingTimeMinutes = useMemo(() => {
    const wordCount = previewData.content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [previewData.content]);

  const currentDate = new Date().toISOString();
  const relativeDate = formatRelativeDate(currentDate);

  return (
    <Container size="full" withGutters={false}>
      <div className="pt-4 pb-6">
        {/* Back link (align to content) */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <div className="w-64 flex-shrink-0 hidden lg:block" />
            <div className="flex-1 min-w-0 lg:max-w-4xl">
              <div className="mt-[8.5rem]">
                <Link
                  href="/write"
                  onClick={handleBackToEditor}
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
                  Powrót do edytora
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main layout matching article page */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {/* Sticky TOC (left) */}
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              <div className="fixed top-36 left-[calc(50%-640px)] w-64 z-30 h-fit">
                <ArticleToc />
              </div>
            </aside>

            {/* Article content */}
            <div className="flex-1 min-w-0 lg:max-w-4xl">
              {/* Mobile TOC overlay trigger */}
              <ArticleTocOverlay />
              {/* Header */}
              <header className="mb-8">
                <time className="text-sm font-mono block my-3 text-white/60">
                  {relativeDate}
                </time>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 font-inter text-white">
                  {previewData.title}
                </h1>

                {(processedContent?.enhancedExcerpt || previewData.excerpt) && (
                  <p className="text-xl leading-relaxed mb-8 font-source text-white/80">
                    {processedContent?.enhancedExcerpt || previewData.excerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-white/60">
                    <span>
                      Autor:{' '}
                      <span className="underline hover:text-white transition-colors">
                        You (Preview)
                      </span>
                    </span>
                    <span>•</span>
                    <span>{readingTimeMinutes} min czytania</span>
                  </div>
                </div>

                {/* Tags */}
                {previewData.tags && previewData.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {previewData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </header>

              {/* Separator */}
              <div className="h-px mb-12 bg-white/10" />

              {/* Content */}
              <div className="article-content font-source">
                {isProcessing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="text-white/70">
                        Processing content...
                      </span>
                    </div>
                  </div>
                ) : processedContent ? (
                  <ArticleContent
                    html={processedContent.html || ''}
                    error={processedContent.error}
                    rawContent={previewData.content}
                    articleId="preview"
                    articleTitle={previewData.title}
                  />
                ) : (
                  <div className="text-center text-white/70 py-12">
                    No content available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
