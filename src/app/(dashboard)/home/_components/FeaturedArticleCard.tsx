'use client';

import Link from 'next/link';
import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { calculateReadingTime } from '@/lib/content/reading-time';
import type { FeaturedArticle } from '@/lib/supabase';
import ArticleLikeButton from '@/components/articles/ArticleLikeButton';

interface FeaturedArticleCardProps {
  article: FeaturedArticle;
  className?: string;
  variant?: 'large' | 'medium';
}

const FeaturedArticleCard = React.memo<FeaturedArticleCardProps>(
  function FeaturedArticleCard({
    article,
    className,
    variant = 'large',
  }: FeaturedArticleCardProps) {
    const router = useRouter();

    // Calculate reading time - memoized
    const readingTime = useMemo(
      () => calculateReadingTime(article.body_md).minutes,
      [article.body_md]
    );

    const formattedDate = useMemo(
      () =>
        new Date(article.published_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      [article.published_at]
    );

    // Handle article navigation - memoized callbacks
    const handleArticleClick = useCallback(
      (e: React.MouseEvent | React.KeyboardEvent) => {
        // Don't navigate if clicking on the author link or like button
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

    // Determine background style based on cover image availability - memoized
    const backgroundStyle = useMemo(() => {
      if (article.cover_image_url) {
        return {
          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.8) 100%), url(${article.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }
      // Fallback to gradient with AI pattern overlay
      return {
        background: `linear-gradient(135deg, rgba(50, 224, 196, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%), 
                   url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332E0C4' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat`,
      };
    }, [article.cover_image_url]);

    // Card dimensions based on variant - memoized
    const cardDimensions = useMemo(() => {
      if (variant === 'large') {
        return 'h-[320px] md:h-[380px]'; // Large hero cards
      }
      return 'h-[280px] md:h-[320px]'; // Medium cards
    }, [variant]);

    return (
      <article
        className={cn(
          'group cursor-pointer overflow-hidden relative w-full rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
          cardDimensions,
          'bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90',
          className
        )}
        style={backgroundStyle}
        onClick={handleArticleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Read article: ${article.title}`}
        itemScope
        itemType="https://schema.org/Article"
      >
        {/* Background overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/90 group-hover:via-black/40" />

        {/* Content container */}
        <div className="relative h-full flex flex-col justify-between p-6 md:p-8 z-10">
          {/* Top section with author */}
          <div className="flex-shrink-0">
            <Link
              href={`/profile/${article.author_handle}`}
              className="inline-flex items-center space-x-3 group/author transition-all duration-200 hover:transform hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            >
              {article.author_avatar_url ? (
                <img
                  src={article.author_avatar_url}
                  alt={`${article.author_display_name || article.author_handle}'s avatar`}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-white/30 object-cover flex-shrink-0 group-hover/author:border-white/50 transition-all duration-200"
                />
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-ai-teal-500 to-ai-purple-500 flex items-center justify-center border-2 border-white/30 flex-shrink-0 group-hover/author:border-white/50 transition-all duration-200">
                  <span className="text-white text-sm md:text-base font-bold">
                    {(article.author_display_name || article.author_handle)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col justify-center min-w-0">
                <p className="font-medium text-sm md:text-base text-white/90 font-inter group-hover/author:text-white group-hover/author:underline transition-all duration-200 truncate">
                  {article.author_display_name || article.author_handle}
                </p>
                <p className="text-xs md:text-sm text-white/60 font-inter">
                  {formattedDate} • {readingTime} min read
                </p>
              </div>
            </Link>
          </div>

          {/* Bottom section with content */}
          <div className="flex-1 flex flex-col justify-end space-y-4">
            {/* Title and excerpt */}
            <div className="space-y-3">
              <h1
                className={cn(
                  'font-bold text-white font-inter leading-tight group-hover:text-white/95 transition-colors duration-300',
                  variant === 'large'
                    ? 'text-xl md:text-2xl lg:text-3xl'
                    : 'text-lg md:text-xl lg:text-2xl'
                )}
                itemProp="headline"
              >
                {article.title}
              </h1>

              <p
                className={cn(
                  'text-white/80 font-inter leading-relaxed group-hover:text-white/90 transition-colors duration-300 line-clamp-2 md:line-clamp-3',
                  variant === 'large' ? 'text-sm md:text-base' : 'text-sm'
                )}
                itemProp="description"
              >
                {article.excerpt}
              </p>
            </div>

            {/* Footer with tags and actions */}
            <div className="flex items-center justify-between pt-2">
              {/* Primary tag */}
              <div className="flex-1 min-w-0">
                {article.tags && article.tags.length > 0 && (
                  <span className="inline-block text-xs md:text-sm font-inter font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/90 transition-all duration-300 hover:bg-white/20 backdrop-blur-sm border border-white/20 truncate">
                    {(() => {
                      const t = article.tags[0];
                      const tagMap: Record<string, string> = {
                        'machine-learning': 'Machine Learning',
                        'deep-learning': 'Deep Learning',
                        nlp: 'NLP',
                        'computer-vision': 'Computer Vision',
                        'generative-ai': 'Generative AI',
                        'ai-ethics-policy': 'AI Ethics',
                        'data-engineering': 'Data Engineering',
                        'cloud-infrastructure': 'Cloud',
                        'tools-frameworks': 'Tools',
                      };
                      return tagMap[t] || t;
                    })()}
                  </span>
                )}
              </div>

              {/* Like button and views */}
              <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
                <span className="text-xs md:text-sm text-white/70 font-inter">
                  {article.view_count} views
                </span>
                <div
                  data-no-navigate
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <ArticleLikeButton
                    articleId={article.id}
                    className="flex-shrink-0"
                    showCount={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden microdata */}
        <meta itemProp="dateModified" content={article.published_at} />
        <meta itemProp="datePublished" content={article.published_at} />
        <meta
          itemProp="url"
          content={`https://straylight.ai/articles/${article.slug}`}
        />
        <div
          itemProp="author"
          itemScope
          itemType="https://schema.org/Person"
          className="sr-only"
        >
          <span itemProp="name">
            {article.author_display_name || article.author_handle}
          </span>
          <meta
            itemProp="url"
            content={`https://straylight.ai/profile/${article.author_handle}`}
          />
        </div>
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
        {/* Hidden keywords for SEO */}
        {article.tags &&
          article.tags.map((tag, index) => (
            <meta key={index} itemProp="keywords" content={tag} />
          ))}
      </article>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.article.id === nextProps.article.id &&
      prevProps.article.title === nextProps.article.title &&
      prevProps.article.excerpt === nextProps.article.excerpt &&
      prevProps.article.published_at === nextProps.article.published_at &&
      prevProps.article.view_count === nextProps.article.view_count &&
      prevProps.variant === nextProps.variant &&
      prevProps.className === nextProps.className
    );
  }
);

FeaturedArticleCard.displayName = 'FeaturedArticleCard';

export default FeaturedArticleCard;
