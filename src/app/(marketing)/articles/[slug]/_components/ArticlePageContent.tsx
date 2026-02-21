'use client';

import Container from '@/components/layout/Container';
import type { Article } from '@/lib/supabase';
import ArticleContent from './ArticleContent';
import RelatedArticles from '@/components/articles/RelatedArticles';
import ArticleToc from '@/components/articles/ArticleToc';
import ArticleTocOverlay from '@/components/articles/ArticleTocOverlay';
import ArticleLikeButton from '@/components/articles/ArticleLikeButton';
import { OptimizedThumbnail } from '@/components/ui/display/OptimizedImage';
import ContentGateOverlay from '@/components/auth/ContentGateOverlay';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface ArticlePageContentProps {
  article: Article;
  processedContent: any;
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

export default function ArticlePageContent({
  article,
  processedContent,
}: ArticlePageContentProps) {
  const { user } = useAuth();
  const relativeDate = formatRelativeDate(
    article.published_at || article.created_at
  );

  return (
    <Container size="full" withGutters={false}>
      <div
        className="pt-4 pb-6 bg-[#000000] min-h-screen"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Back link (align to content) */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <div className="w-64 flex-shrink-0 hidden lg:block" />
            <div className="flex-1 min-w-0 lg:max-w-4xl">
              <div className="mt-[8.5rem]">
                <Link
                  href="/articles"
                  className={`inline-flex items-center gap-2 transition-colors font-mono text-sm ${
                    false
                      ? 'text-black/70 hover:text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
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

        {/* Main layout with sticky TOC (desktop) + mobile overlay */}
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
                <time
                  className={`text-sm font-mono block my-3 ${
                    false ? 'text-black/60' : 'text-white/60'
                  }`}
                >
                  {relativeDate}
                </time>
                <h1
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 font-inter ${'text-white'}`}
                >
                  {article.title}
                </h1>

                {processedContent.enhancedExcerpt && (
                  <p
                    className={`text-xl leading-relaxed mb-8 font-source ${
                      false ? 'text-black/80' : 'text-white/80'
                    }`}
                  >
                    {processedContent.enhancedExcerpt}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div
                    className={`flex flex-wrap items-center gap-4 text-sm font-mono ${
                      false ? 'text-black/60' : 'text-white/60'
                    }`}
                  >
                    <span>
                      Autor:{' '}
                      {(article as any).users ? (
                        <Link
                          href={`/profile/${(article as any).users.handle}`}
                          className="underline hover:text-white transition-colors"
                        >
                          {(article as any).users.display_name ||
                            (article as any).users.handle}
                        </Link>
                      ) : (
                        'StrayLight'
                      )}
                    </span>
                    <span>•</span>
                    <span>
                      {Math.max(
                        1,
                        Math.ceil(processedContent.readingTimeData.minutes)
                      )}{' '}
                      min czytania
                    </span>
                  </div>

                  {/* Like Button */}
                  <div className="flex items-center">
                    <ArticleLikeButton
                      articleId={article.id}
                      showCount={true}
                      className="scale-125"
                    />
                  </div>
                </div>
              </header>

              {/* Cover Image */}
              {console.log('🖼️ [ARTICLE_VIEW] Cover image check:', {
                articleTitle: article.title,
                coverImageUrl: article.cover_image_url,
                hasCoverImage: !!article.cover_image_url,
                coverImageType: typeof article.cover_image_url,
              })}
              {article.cover_image_url && (
                <div className="mb-12">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/10">
                    <OptimizedThumbnail
                      src={article.cover_image_url}
                      alt={`Cover image for ${article.title}`}
                      width={1200}
                      height={675}
                      className="w-full h-full object-cover"
                      priority={true}
                    />
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className={`h-px mb-12 ${'bg-white/10'}`} />

              {/* Content - Wrapped with gate overlay for unauthenticated users */}
              <div className="relative">
                <div
                  className="article-content font-source"
                  style={
                    !user
                      ? {
                          maxHeight: '200vh',
                          overflow: 'hidden',
                          position: 'relative',
                          maskImage:
                            'linear-gradient(to bottom, black 60%, transparent 100%)',
                          WebkitMaskImage:
                            'linear-gradient(to bottom, black 60%, transparent 100%)',
                        }
                      : undefined
                  }
                >
                  <ArticleContent
                    html={processedContent.html}
                    error={processedContent.error}
                    rawContent={article.body_md}
                    articleId={article.id}
                    articleTitle={article.title}
                  />
                </div>

                {/* Content Gate Overlay - Only shown to unauthenticated users */}
                {!user && (
                  <ContentGateOverlay
                    title="Zaloguj się, aby przeczytać pełny artykuł"
                    description="Dołącz do StrayLight, aby uzyskać dostęp do pełnego artykułu i całej biblioteki eksperckich informacji o AI, rozwoju kariery i trendach technologicznych."
                    variant="gradient"
                  />
                )}
              </div>

              {/* Frontmatter dev box */}
              {processedContent.frontmatter &&
                process.env.NODE_ENV === 'development' && (
                  <div
                    className={`mt-8 p-4 rounded-lg ${
                      false ? 'bg-gray-100' : 'bg-neutral-900'
                    }`}
                  >
                    <h3
                      className={`text-sm font-semibold mb-2 ${
                        false ? 'text-gray-600' : 'text-neutral-400'
                      }`}
                    >
                      Frontmatter (Development Mode)
                    </h3>
                    <pre
                      className={`text-xs overflow-x-auto ${
                        false ? 'text-gray-500' : 'text-neutral-500'
                      }`}
                    >
                      {JSON.stringify(processedContent.frontmatter, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Related */}
              <div className="mt-12">
                <RelatedArticles slug={article.slug} limit={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
