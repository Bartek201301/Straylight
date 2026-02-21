'use client';

import Link from 'next/link';
import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PopularArticle, ArticleWithAuthor } from '@/lib/supabase';
import { calculateReadingTime } from '@/lib/content/reading-time';
import ArticleLikeButton from '@/components/articles/ArticleLikeButton';

interface EnhancedArticleCardProps {
  article: PopularArticle | ArticleWithAuthor;
  className?: string;
  rank?: number;
  variant?: 'leaderboard' | 'compact';
}

const EnhancedArticleCard = React.memo<EnhancedArticleCardProps>(
  function EnhancedArticleCard({
    article,
    className,
    rank,
    variant = 'compact',
  }: EnhancedArticleCardProps) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);

    // Type guard to check if article is PopularArticle - memoized
    const isPopularArticle = useMemo(
      () =>
        (art: PopularArticle | ArticleWithAuthor): art is PopularArticle => {
          return 'rank_position' in art && 'like_count' in art;
        },
      []
    );

    const popularArticle = useMemo(
      () => (isPopularArticle(article) ? article : null),
      [article, isPopularArticle]
    );
    const displayRank = useMemo(
      () =>
        variant === 'leaderboard'
          ? rank || popularArticle?.rank_position || 1
          : null,
      [variant, rank, popularArticle?.rank_position]
    );

    // Get author info from either structure - memoized
    const authorInfo = useMemo(
      () =>
        popularArticle
          ? {
              handle: popularArticle.author_handle,
              display_name: popularArticle.author_display_name,
              avatar_url: popularArticle.author_avatar_url,
            }
          : 'users' in article
            ? article.users
            : undefined,
      [popularArticle, article]
    );

    // Calculate reading time using proper utility - memoized
    const readingTime = useMemo(
      () =>
        article.body_md
          ? calculateReadingTime(article.body_md).minutes
          : Math.max(
              1,
              Math.round((article.excerpt?.split(' ').length || 0) / 200)
            ),
      [article.body_md, article.excerpt]
    );

    const formattedDate = useMemo(
      () =>
        new Date(article.published_at || article.created_at).toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
          }
        ),
      [article.published_at, article.created_at]
    );

    // Handle article navigation - memoized callbacks
    const handleArticleClick = useCallback(
      (e: React.MouseEvent | React.KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('[data-no-navigate]')) {
          return;
        }
        router.push(`/articles/${article.slug}`);
      },
      [router, article.slug]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleArticleClick(e);
        }
      },
      [handleArticleClick]
    );

    // Get fallback pattern for cards without cover image - memoized
    const fallbackPattern = useMemo(() => {
      return `linear-gradient(135deg, rgba(50, 224, 196, 0.15) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(168, 85, 247, 0.15) 100%), 
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332E0C4' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat`;
    }, []);

    return (
      <article
        className={cn(
          'group cursor-pointer overflow-hidden relative rounded-xl transition-all duration-300 border border-white/10',
          'bg-card-base',
          'hover:border-white/20 hover:shadow-lg hover:shadow-black/10',
          'w-full flex flex-col transition-all duration-300', // Dynamic height with smooth transitions
          isHovered ? 'h-[320px] md:h-[360px]' : 'h-[240px] md:h-[280px]', // Smaller default, expand on hover
          className
        )}
        onClick={handleArticleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
        role="button"
        aria-label={`Read article: ${article.title}`}
        itemScope
        itemType="https://schema.org/Article"
      >
        {/* Rank indicator (for leaderboard variant) */}
        {variant === 'leaderboard' && displayRank && (
          <div className="absolute top-3 left-3 z-20">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 flex items-center justify-center font-bold text-xs shadow-lg">
              {displayRank}
            </div>
          </div>
        )}

        {/* Top Image Section - 50% height */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: fallbackPattern }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ai-teal-500/30 to-ai-purple-500/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Content Section - 50% height */}
        <div className="relative flex-1 p-3 flex flex-col justify-between bg-card-base">
          {/* Title - Bold and prominent */}
          <div className="mb-2">
            <h3
              className="font-bold text-white font-inter leading-tight text-base md:text-lg line-clamp-2 transition-colors duration-300"
              itemProp="headline"
            >
              {article.title}
            </h3>
          </div>

          {/* Author info and metadata row */}
          <div className="flex items-center justify-between mb-1">
            {/* Left side - Author handle + metadata */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {authorInfo && (
                <>
                  <Link
                    href={`/profile/${authorInfo.handle}`}
                    className="text-xs text-white/80 hover:text-white hover:underline font-inter font-medium transition-all duration-200 truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{authorInfo.handle}
                  </Link>
                  <span className="text-xs text-white/60">•</span>
                </>
              )}
              <span className="text-xs text-white/60 font-inter">
                {formattedDate}
              </span>
              <span className="text-xs text-white/60">•</span>
              <span className="text-xs text-white/60 font-inter">
                {readingTime} min
              </span>
            </div>

            {/* Right side - Like button with count */}
            <div
              className="flex items-center space-x-2 flex-shrink-0"
              data-no-navigate
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ArticleLikeButton
                articleId={article.id}
                className="scale-90 text-xs"
                showCount={true}
              />
            </div>
          </div>

          {/* Description - unfolds on hover */}
          <div
            className={cn(
              'transition-all duration-300 ease-out overflow-hidden',
              isHovered
                ? 'max-h-16 opacity-100 translate-y-0'
                : 'max-h-0 opacity-0 translate-y-1'
            )}
          >
            <div className="pt-1 border-t border-white/10">
              <p className="text-white/70 font-inter leading-relaxed text-xs">
                {article.excerpt}
              </p>
            </div>
          </div>
        </div>

        {/* Hidden microdata */}
        <meta
          itemProp="dateModified"
          content={article.published_at || article.created_at}
        />
        <meta
          itemProp="datePublished"
          content={article.published_at || article.created_at}
        />
        <meta
          itemProp="url"
          content={`https://straylight.ai/articles/${article.slug}`}
        />
        {authorInfo && (
          <div
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
            className="sr-only"
          >
            <span itemProp="name">
              {authorInfo.display_name || authorInfo.handle}
            </span>
            <meta
              itemProp="url"
              content={`https://straylight.ai/profile/${authorInfo.handle}`}
            />
          </div>
        )}
        <div
          itemProp="publisher"
          itemScope
          itemType="https://schema.org/Organization"
          className="sr-only"
        >
          <span itemProp="name">StrayLight</span>
          <span itemProp="url">https://straylight.ai</span>
        </div>
        <meta itemProp="inLanguage" content="en-US" />
      </article>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.article.id === nextProps.article.id &&
      prevProps.article.title === nextProps.article.title &&
      prevProps.article.excerpt === nextProps.article.excerpt &&
      prevProps.variant === nextProps.variant &&
      prevProps.rank === nextProps.rank &&
      prevProps.className === nextProps.className
    );
  }
);

EnhancedArticleCard.displayName = 'EnhancedArticleCard';

export default EnhancedArticleCard;
