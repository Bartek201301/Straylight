'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { PopularArticle, ArticleWithAuthor } from '@/lib/supabase';
import ArticleLikeButton from '@/components/articles/ArticleLikeButton';

interface LeaderboardArticleCardProps {
  article: PopularArticle | ArticleWithAuthor;
  className?: string;
  rank?: number; // For leaderboard display
  variant?: 'leaderboard' | 'compact'; // leaderboard shows rank, compact is for newest
}

export default function LeaderboardArticleCard({
  article,
  className,
  rank,
  variant = 'compact',
}: LeaderboardArticleCardProps) {
  const router = useRouter();

  // Type guard to check if article is PopularArticle (has rank_position and like_count)
  const isPopularArticle = (
    art: PopularArticle | ArticleWithAuthor
  ): art is PopularArticle => {
    return 'rank_position' in art && 'like_count' in art;
  };

  const popularArticle = isPopularArticle(article) ? article : null;
  const displayRank =
    variant === 'leaderboard'
      ? rank || popularArticle?.rank_position || 1
      : null;

  // Get author info from either structure
  const authorInfo = popularArticle
    ? {
        handle: popularArticle.author_handle,
        display_name: popularArticle.author_display_name,
        avatar_url: popularArticle.author_avatar_url,
      }
    : 'users' in article
      ? article.users
      : undefined;

  // Calculate reading time (simple estimation)
  const wordCount = article.excerpt?.split(' ').length || 0;
  const readingTime = Math.max(1, Math.round(wordCount / 50));

  const formattedDate = new Date(
    article.published_at || article.created_at
  ).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Handle article navigation
  const handleArticleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('[data-no-navigate]')) {
      return;
    }
    router.push(`/articles/${article.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleArticleClick(e);
    }
  };

  // Get rank styling and icon
  const getRankStyling = () => {
    if (!displayRank) return { className: '', icon: null };

    if (displayRank === 1) {
      return {
        className:
          'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
      };
    } else if (displayRank === 2) {
      return {
        className: 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
          </svg>
        ),
      };
    } else if (displayRank === 3) {
      return {
        className:
          'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-200',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.7-2h8.6l.9-5.4-2.1 1.4L12 8l-3.1 2l-2.1-1.4L7.7 14z" />
          </svg>
        ),
      };
    } else {
      return {
        className:
          'bg-gradient-to-br from-neutral-600 to-neutral-800 text-white',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        ),
      };
    }
  };

  return (
    <article
      className={cn(
        'group cursor-pointer overflow-hidden relative rounded-lg transition-all duration-300 hover:scale-[1.02] border',
        'card-base bg-gradient-to-br from-white/5 to-white/3 border-white/10',
        'hover:from-white/10 hover:to-white/5 hover:border-white/20',
        'h-[160px] md:h-[180px] flex', // Horizontal layout
        className
      )}
      onClick={handleArticleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${article.title}`}
      itemScope
      itemType="https://schema.org/Article"
    >
      {/* Rank indicator (for leaderboard variant) */}
      {variant === 'leaderboard' &&
        displayRank &&
        (() => {
          const rankStyle = getRankStyling();
          return (
            <div className="flex-shrink-0 w-12 flex items-center justify-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shadow-lg relative',
                  rankStyle.className
                )}
              >
                {rankStyle.icon || displayRank}
              </div>
            </div>
          );
        })()}

      {/* Article image/cover */}
      <div className="flex-shrink-0 w-20 md:w-24 relative overflow-hidden">
        {article.cover_image_url ? (
          <div
            className="w-full h-full bg-cover bg-center bg-gradient-to-br from-neutral-800 to-neutral-900 group-hover:scale-110 transition-transform duration-300"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%), url(${article.cover_image_url})`,
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ai-teal-900/20 via-neutral-900 to-ai-purple-900/20 flex items-center justify-center">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-ai-teal-500/30 to-ai-purple-500/30 flex items-center justify-center">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-white/70"
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

      {/* Content area */}
      <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
        {/* Top section: Title and author */}
        <div className="space-y-2">
          <h3
            className="font-bold text-white font-inter leading-tight text-sm md:text-base line-clamp-2 group-hover:text-white/95 transition-colors duration-300"
            itemProp="headline"
          >
            {article.title}
          </h3>

          {/* Author info */}
          {authorInfo && (
            <Link
              href={`/profile/${authorInfo.handle}`}
              className="inline-flex items-center space-x-2 group/author transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {authorInfo.avatar_url ? (
                <img
                  src={authorInfo.avatar_url}
                  alt={`${authorInfo.display_name || authorInfo.handle}'s avatar`}
                  className="h-5 w-5 md:h-6 md:w-6 rounded-full border border-white/20 object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-gradient-to-br from-ai-teal-500 to-ai-purple-500 flex items-center justify-center border border-white/20 flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {(authorInfo.display_name || authorInfo.handle)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs md:text-sm text-white/70 font-inter group-hover/author:text-white/90 group-hover/author:underline transition-all duration-200 truncate">
                {authorInfo.display_name || authorInfo.handle}
              </span>
            </Link>
          )}
        </div>

        {/* Bottom section: Metadata and actions */}
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center space-x-3">
            <span>{formattedDate}</span>
            <span>{readingTime} min</span>
          </div>

          {/* Like button */}
          <div
            data-no-navigate
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ArticleLikeButton
              articleId={article.id}
              className="scale-75 text-xs"
              showCount={true}
            />
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
}
