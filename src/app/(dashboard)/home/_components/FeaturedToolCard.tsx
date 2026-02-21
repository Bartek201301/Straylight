'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { FeaturedTool } from '@/lib/supabase';
import { openAffiliateLink } from '@/lib/analytics/affiliate-tracking';
import type { AffiliateLibraryRow } from '@/lib/types/affiliate-library';

interface FeaturedToolCardProps {
  tool: FeaturedTool;
  className?: string;
  variant?: 'default' | 'carousel';
}

export default function FeaturedToolCard({
  tool,
  className,
  variant = 'default',
}: FeaturedToolCardProps) {
  const [isClicking, setIsClicking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const isCarousel = variant === 'carousel';

  const handleClick = async () => {
    if (isClicking || !tool.is_active) return;

    setIsClicking(true);
    setTrackingStatus('idle');

    try {
      // Convert FeaturedTool to AffiliateLibraryRow for tracking
      const affiliateItem: AffiliateLibraryRow = {
        ...tool,
        type: tool.type as 'book' | 'tool',
        price_range: tool.price_range as
          | 'free'
          | 'under-50'
          | '50-100'
          | '100-200'
          | 'over-200'
          | null,
        isbn: null,
        publisher: null,
        publication_year: null,
        updated_at: tool.created_at, // Use created_at as fallback
      };

      await openAffiliateLink(affiliateItem, {
        source: 'card',
        context: {
          position: tool.featured_order,
          page: 'home_feed',
        },
        onSuccess: (result) => {
          setTrackingStatus('success');
          console.log('✅ Featured tool click tracked:', {
            toolId: result.itemId,
            clickCount: result.clickCount,
            trackingId: result.trackingId,
          });
        },
        onError: (error) => {
          setTrackingStatus('error');
          console.warn('⚠️ Featured tool tracking failed:', error.message);
        },
      });
    } catch (error) {
      console.error('❌ Failed to handle featured tool click:', error);
      setTrackingStatus('error');
    } finally {
      setIsClicking(false);
      setTimeout(() => setTrackingStatus('idle'), 2000);
    }
  };

  const renderRating = () => {
    if (!tool.rating) return null;

    const fullStars = Math.floor(tool.rating);
    const hasHalfStar = tool.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-sm">
            ★
          </span>
        ))}
        {hasHalfStar && <span className="text-yellow-400 text-sm">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-white/30 text-sm">
            ☆
          </span>
        ))}
        <span className="text-xs text-white/60 ml-1">
          ({tool.rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const getTypeIcon = () => {
    return tool.type === 'book' ? '📚' : '🔧';
  };

  const getTypeLabel = () => {
    return tool.type === 'book' ? 'Book' : 'AI Tool';
  };

  const getPriceRangeLabel = () => {
    if (!tool.price_range) return null;

    const priceLabels = {
      free: 'Free',
      'under-50': '<$50',
      '50-100': '$50-$100',
      '100-200': '$100-$200',
      'over-200': '>$200',
    };

    return priceLabels[tool.price_range as keyof typeof priceLabels];
  };

  const getButtonStyling = () => {
    const baseClasses = cn(
      'w-full rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 ring-white/30',
      isCarousel ? 'px-4 py-2.5 text-base' : 'px-3 py-2 text-sm'
    );

    if (trackingStatus === 'success') {
      return `${baseClasses} bg-emerald-500 text-black hover:bg-emerald-400`;
    }

    if (trackingStatus === 'error') {
      return `${baseClasses} bg-amber-500 text-black hover:bg-amber-400`;
    }

    if (isClicking) {
      return `${baseClasses} bg-gray-200 text-black opacity-90`;
    }

    if (tool.is_active) {
      return `${baseClasses} bg-white text-black hover:bg-gray-100 hover:scale-[1.02] shadow-lg`;
    }

    // Disabled state
    return `${baseClasses} bg-white/10 text-white/50 border border-white/10 cursor-not-allowed ring-0 shadow-none`;
  };

  return (
    <div
      className={cn(
        'card-base border rounded-xl overflow-hidden group transition-all duration-300 relative flex flex-col',
        'bg-gradient-to-b from-white/5 to-white/3 border-white/10',
        'hover:from-white/10 hover:to-white/5 hover:border-white/20 hover:transform hover:scale-[1.02]',
        isCarousel ? 'h-full max-h-[240px]' : 'h-[240px]',
        className
      )}
    >
      {/* Top section with image, title and type badge */}
      <div
        className={cn(
          'flex items-start gap-3 border-b border-white/10',
          isCarousel ? 'p-3' : 'p-4'
        )}
      >
        {/* Tool image/icon */}
        <div
          className={cn(
            'relative rounded-lg overflow-hidden flex-shrink-0',
            isCarousel ? 'w-10 h-10' : 'w-12 h-12'
          )}
        >
          {tool.image_url && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 animate-pulse bg-white/10" />
              )}
              <Image
                src={tool.image_url}
                alt={tool.title}
                fill
                sizes="48px"
                className="object-cover"
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => setImageLoading(false)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10">
              <span className="text-xl text-white/60">{getTypeIcon()}</span>
            </div>
          )}
        </div>

        {/* Title and metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-bold leading-tight text-white line-clamp-2 font-inter',
                isCarousel ? 'text-sm' : 'text-sm'
              )}
            >
              {tool.title}
            </h3>
            <span className="px-2 py-1 rounded-full text-xs font-mono bg-white/10 text-white/70 flex-shrink-0">
              {getTypeLabel()}
            </span>
          </div>

          {tool.author && (
            <div className="text-xs text-white/60 font-inter mt-1 truncate">
              by {tool.author}
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className={cn('flex-1 space-y-3', isCarousel ? 'p-3' : 'p-4')}>
        {/* Rating */}
        {renderRating()}

        {/* Price range for tools */}
        {tool.type === 'tool' && tool.price_range && (
          <div>
            <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
              {getPriceRangeLabel()}
            </span>
          </div>
        )}

        {/* Tags - show up to 2 */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tool.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded text-xs font-mono bg-white/10 text-white/70"
              >
                {tag}
              </span>
            ))}
            {tool.tags.length > 2 && (
              <span className="px-2 py-1 rounded text-xs font-mono bg-white/10 text-white/60">
                +{tool.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action section */}
      <div className={cn(isCarousel ? 'p-3 pt-0' : 'p-4 pt-0')}>
        <button
          onClick={handleClick}
          disabled={isClicking || !tool.is_active}
          className={getButtonStyling()}
        >
          {isClicking ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Opening...
            </span>
          ) : trackingStatus === 'success' ? (
            <span className="flex items-center justify-center gap-1">
              ✅ Opened
            </span>
          ) : trackingStatus === 'error' ? (
            <span className="flex items-center justify-center gap-1">
              ⚠️ Try Again
            </span>
          ) : (
            <>{tool.type === 'book' ? 'Zobacz książkę' : 'Sprawdź narzędzie'}</>
          )}
        </button>
      </div>
    </div>
  );
}
