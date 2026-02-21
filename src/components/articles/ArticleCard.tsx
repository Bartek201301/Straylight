'use client';

import Link from 'next/link';
import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { calculateReadingTime } from '@/lib/content/reading-time';
import ArticleLikeButton from './ArticleLikeButton';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body_md: string;
    status: string;
    tags: string[];
    view_count: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    author_id: string;
    cover_image_url?: string | null;
    users?: {
      handle: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  };
  className?: string;
  variant?: 'default' | 'compact' | 'profile';
}

const ArticleCard = React.memo<ArticleCardProps>(
  function ArticleCard({
    article,
    className,
    variant = 'default',
  }: ArticleCardProps) {
    // Router for navigation
    const router = useRouter();

    // State and refs for overflow detection
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    const publishedDate = useMemo(
      () => article.published_at || article.created_at,
      [article.published_at, article.created_at]
    );
    const _formattedDate = useMemo(
      () =>
        new Date(publishedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      [publishedDate]
    );

    // Calculate reading time using proper utility - memoized for performance
    const readingTime = useMemo(
      () => calculateReadingTime(article.body_md).minutes,
      [article.body_md]
    );

    // Overflow detection effect
    useEffect(() => {
      const checkOverflow = () => {
        if (textRef.current) {
          // Create a temporary element to measure natural text height
          const tempElement = document.createElement('div');
          tempElement.style.cssText = `
          position: absolute;
          left: -9999px;
          width: ${textRef.current.offsetWidth}px;
          font-size: 14px;
          line-height: 1.5;
          font-family: inherit;
          padding: 0;
          margin: 0;
          border: none;
        `;
          tempElement.textContent = article.excerpt;
          document.body.appendChild(tempElement);

          const naturalHeight = tempElement.offsetHeight;
          document.body.removeChild(tempElement);

          // Calculate max height based on variant (accounting for line-height)
          const maxHeight = variant === 'compact' ? 48 : 64; // 12 * 4 lines or 16 * 4 lines

          setIsOverflowing(naturalHeight > maxHeight);
        }
      };

      // Check overflow after component mounts and content loads
      const timeoutId = setTimeout(checkOverflow, 100);

      // Re-check on window resize
      const handleResize = () => {
        setTimeout(checkOverflow, 150);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
      };
    }, [article.excerpt, variant]);

    // Determine background style based on cover image availability - memoized
    const backgroundStyle = useMemo(() => {
      if (article.cover_image_url) {
        return {
          backgroundImage: `url(${article.cover_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }
      // Fallback to AI pattern
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332E0C4' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='7' cy='53' r='1'/%3E%3Ccircle cx='53' cy='7' r='1'/%3E%3Cpath d='M20 20h20v20H20z'/%3E%3Cpath d='M30 10v40'/%3E%3Cpath d='M10 30h40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      };
    }, [article.cover_image_url]);

    // Dynamic card sizing based on variant - memoized
    const cardDimensions = useMemo(() => {
      switch (variant) {
        case 'compact':
          return 'w-full max-w-[240px] sm:max-w-[260px] h-[240px] sm:h-[260px]'; // For related articles - better grid fit with proper spacing
        case 'profile':
          return 'w-full h-[320px]'; // For profile pages - more expansion space
        default:
          return 'w-full max-w-[340px] sm:max-w-[360px] lg:max-w-[380px] h-[300px] sm:h-[320px] lg:h-[340px]'; // For main articles page - full expansion with mobile scaling
      }
    }, [variant]);

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

    return (
      <div className={cn('group/card', cardDimensions, className)}>
        <div
          className="block w-full h-full cursor-pointer"
          onClick={handleArticleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Read article: ${article.title}`}
        >
          <article
            className={cn(
              'cursor-pointer overflow-hidden relative w-full h-full rounded-md shadow-xl flex flex-col justify-between p-4 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl',
              // Only apply gradient background when no cover image exists
              !article.cover_image_url &&
                'bg-gradient-to-br from-ai-teal-900/20 via-neutral-900/90 to-ai-purple-900/20'
            )}
            style={backgroundStyle}
            itemScope
            itemType="https://schema.org/Article"
          >
            {/* Background Overlay - Darker for cover images to ensure text readability */}
            <div
              className={cn(
                'absolute w-full h-full top-0 left-0 transition duration-300 rounded-md',
                article.cover_image_url
                  ? 'bg-black/70 group-hover/card:bg-black/80' // Darker overlay for cover images
                  : 'bg-black/60 group-hover/card:bg-black/70' // Standard overlay for pattern background
              )}
            ></div>
            {/* Header Section - Fixed Height */}
            <div className="flex-shrink-0 h-16 z-10 relative">
              {article.users && (
                <Link
                  href={`/profile/${article.users.handle}`}
                  className="flex items-center space-x-3 group/author transition-all duration-200 h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {article.users.avatar_url ? (
                    <img
                      src={article.users.avatar_url}
                      alt={`${article.users.display_name || article.users.handle}'s avatar`}
                      className="h-10 w-10 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ai-teal-500 to-ai-purple-500 flex items-center justify-center border-2 border-white/20 flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {(article.users.display_name || article.users.handle)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p
                      className="font-medium text-sm text-gray-50 font-ai group-hover/author:!text-white group-hover/author:underline transition-all duration-200 truncate"
                      style={{ textShadow: 'none' }}
                    >
                      {article.users.display_name || article.users.handle}
                    </p>
                    <p className="text-xs text-gray-400 font-ai">
                      {readingTime} min read • {article.view_count} views
                    </p>
                  </div>
                </Link>
              )}
            </div>

            {/* Content Area - Flexible Middle with space for expansion */}
            <div className="flex-1 z-10 relative overflow-visible flex flex-col py-2 pb-4">
              <h1
                className={cn(
                  'font-bold text-gray-50 font-ai group-hover/card:text-white transition-colors duration-300 mb-3 leading-tight flex-shrink-0',
                  variant === 'compact' ? 'text-base' : 'text-lg'
                )}
                itemProp="headline"
              >
                {article.title}
              </h1>

              {/* Description container with smooth height transition */}
              <div className="relative">
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-500 ease-out relative',
                    variant === 'compact'
                      ? 'max-h-12 group-hover/card:max-h-24' // 3 lines → 6 lines for compact
                      : 'max-h-16 group-hover/card:max-h-32' // 4 lines → 8 lines for default
                  )}
                >
                  <p
                    ref={textRef}
                    className={cn(
                      'text-gray-300 font-ai leading-relaxed text-sm',
                      'group-hover/card:text-gray-200 transition-colors duration-300'
                    )}
                    itemProp="description"
                  >
                    {article.excerpt}
                  </p>
                </div>

                {/* Gradient fade overlay - only show when text overflows */}
                {isOverflowing && (
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t pointer-events-none transition-opacity duration-500 ease-out',
                      'group-hover/card:opacity-0',
                      'from-black/60 via-black/30 to-transparent'
                    )}
                  />
                )}
              </div>
            </div>

            {/* Footer - Absolutely positioned with smooth fade on hover */}
            <div className="absolute bottom-4 left-4 right-4 h-12 flex items-center justify-between z-10 transition-opacity duration-300 ease-out group-hover/card:opacity-0">
              {/* Primary Tag - Left */}
              <div className="flex-1 min-w-0">
                {article.tags && article.tags.length > 0 && (
                  <span className="inline-block text-xs font-ai font-medium px-2.5 py-1 rounded-full bg-gray-800/80 text-gray-200 transition-all duration-300 hover:bg-gray-700/90 backdrop-blur-sm truncate">
                    {(() => {
                      const t = article.tags[0];
                      const map: Record<string, string> = {
                        'machine-learning': 'Machine Learning',
                        'deep-learning': 'Deep Learning',
                        nlp: 'Natural Language Processing (NLP)',
                        'computer-vision': 'Computer Vision',
                        'generative-ai': 'Generative AI',
                        'ai-ethics-policy': 'AI Ethics & Policy',
                        'data-engineering': 'Data Engineering',
                        'cloud-infrastructure': 'Cloud & Infrastructure',
                        'tools-frameworks': 'Tools & Frameworks',
                      };
                      return map[t] || t;
                    })()}
                  </span>
                )}
              </div>

              {/* Like Button - Right */}
              <div
                className="flex-shrink-0 ml-3"
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

            {/* Hidden microdata */}
            <meta itemProp="dateModified" content={article.updated_at} />
            <meta itemProp="datePublished" content={publishedDate} />
            <meta
              itemProp="url"
              content={`https://straylight.ai/articles/${article.slug}`}
            />
            {article.users ? (
              <div
                itemProp="author"
                itemScope
                itemType="https://schema.org/Person"
                className="sr-only"
              >
                <span itemProp="name">
                  {article.users.display_name || article.users.handle}
                </span>
                <meta
                  itemProp="url"
                  content={`https://straylight.com/profile/${article.users.handle}`}
                />
              </div>
            ) : (
              <div
                itemProp="author"
                itemScope
                itemType="https://schema.org/Organization"
                className="sr-only"
              >
                <span itemProp="name">StrayLight Team</span>
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
            {/* Hidden keywords for SEO */}
            {article.tags &&
              article.tags.map((tag, index) => (
                <meta key={index} itemProp="keywords" content={tag} />
              ))}
          </article>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.article.id === nextProps.article.id &&
      prevProps.article.title === nextProps.article.title &&
      prevProps.article.excerpt === nextProps.article.excerpt &&
      prevProps.article.updated_at === nextProps.article.updated_at &&
      prevProps.article.view_count === nextProps.article.view_count &&
      prevProps.variant === nextProps.variant &&
      prevProps.className === nextProps.className
    );
  }
);

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;
