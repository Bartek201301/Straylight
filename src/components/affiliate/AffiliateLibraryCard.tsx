'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  AffiliateLibraryRow,
  AFFILIATE_ITEM_TYPES,
} from '@/lib/types/affiliate-library';
import { openAffiliateLink } from '@/lib/analytics/affiliate-tracking';
import { createPortal } from 'react-dom';

interface AffiliateLibraryCardProps {
  item: AffiliateLibraryRow;
  onCardClick?: (_itemId: string) => void;
  showMetadata?: boolean;
  className?: string;
  source?: 'card' | 'list' | 'search' | 'recommendation';
  position?: number;
  context?: {
    searchQuery?: string;
    filter?: string;
  };
}

export default function AffiliateLibraryCard({
  item,
  onCardClick,
  showMetadata = false,
  className = '',
  source = 'card',
  position,
  context,
}: AffiliateLibraryCardProps) {
  // Primary CTA styling - more visible to encourage affiliate clicks (white button)
  const getButtonStyling = () => {
    const baseClasses =
      'w-full px-3.5 py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm md:px-4 md:py-2.5 md:text-base font-source shadow-lg focus:outline-none focus:ring-2 ring-white/30';

    if (trackingStatus === 'success') {
      return `${baseClasses} bg-emerald-500 text-black hover:bg-emerald-400`;
    }

    if (trackingStatus === 'error') {
      return `${baseClasses} bg-amber-500 text-black hover:bg-amber-400`;
    }

    if (isClicking) {
      return `${baseClasses} bg-gray-200 text-black opacity-90`;
    }

    if (item.is_active) {
      return `${baseClasses} bg-white text-black hover:bg-gray-100 hover:scale-[1.01] hover:shadow-xl border border-black/10`;
    }

    // Disabled state
    return `${baseClasses} bg-white/10 text-white/50 border border-white/10 cursor-not-allowed ring-0 shadow-none`;
  };
  const [isClicking, setIsClicking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleClick = async () => {
    if (isClicking) return;

    setIsClicking(true);
    setTrackingStatus('idle');

    try {
      await openAffiliateLink(item, {
        source,
        context: {
          position,
          ...context,
        },
        onSuccess: (result) => {
          setTrackingStatus('success');
          onCardClick?.(item.id);
          console.log('✅ Affiliate click tracked:', {
            itemId: result.itemId,
            clickCount: result.clickCount,
            trackingId: result.trackingId,
          });
        },
        onError: (error) => {
          setTrackingStatus('error');
          console.warn('⚠️ Affiliate tracking failed:', error.message);
        },
        onRetry: (attempt) => {
          console.log(`🔄 Retrying affiliate tracking (attempt ${attempt})...`);
        },
      });
    } catch (error) {
      console.error('❌ Failed to handle affiliate click:', error);
      setTrackingStatus('error');
    } finally {
      setIsClicking(false);

      // Reset status after a short delay
      setTimeout(() => setTrackingStatus('idle'), 2000);
    }
  };

  const renderRating = () => {
    if (!item.rating) return null;

    const fullStars = Math.floor(item.rating);
    const hasHalfStar = item.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">
            ★
          </span>
        ))}
        {/* Half star */}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className={`${'text-white/30'}`}>
            ☆
          </span>
        ))}
        <span className={`ml-1 ${'text-white/60'}`}>
          ({item.rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const getTypeIcon = () => {
    return item.type === 'book' ? '' : '';
  };

  const getTypeLabel = () => {
    return AFFILIATE_ITEM_TYPES[item.type];
  };

  const getPriceRangeLabel = () => {
    if (!item.price_range) return null;

    const priceLabels = {
      free: 'Free',
      'under-50': 'Under $50',
      '50-100': '$50-$100',
      '100-200': '$100-$200',
      'over-200': 'Over $200',
    };

    return priceLabels[item.price_range];
  };

  return (
    <div
      className={`backdrop-blur-sm border rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 relative flex flex-col h-auto min-h-[230px] sm:min-h-[270px] md:h-[300px] ${'bg-gradient-to-b from-white/10 to-white/5 border-white/10 hover:from-white/20 hover:to-white/10 hover:border-white/20'} ${className}`}
      onClick={() => setDetailsOpen(true)}
    >
      {/* Top header with thumbnail, title and "added by" */}
      <div
        className={`p-3 md:p-4 flex items-center gap-3 border-b ${'border-white/10'}`}
      >
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden">
          {item.image_url && !imageError ? (
            <>
              {imageLoading && (
                <div
                  className={`absolute inset-0 animate-pulse ${'bg-white/10'}`}
                ></div>
              )}
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                sizes="64px"
                className="object-cover"
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => setImageLoading(false)}
              />
            </>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${'bg-white/10'}`}
            >
              <span className={`text-xl ${'text-white/60'}`}>
                {getTypeIcon()}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm sm:text-base font-black leading-tight font-inter line-clamp-2 ${'text-white'}`}
          >
            {item.title}
          </h3>
          <div
            className={`text-[11px] sm:text-xs mt-1 font-source ${'text-white/60'}`}
          >
            Dodane przez {item.author ? item.author : 'StrayLight'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-mono ${'bg-white/10 text-white/70'}`}
          >
            {getTypeLabel()}
          </span>
          {!item.is_active && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-mono">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-3 md:p-4 space-y-2">
        {/* Optional description and details */}

        {/* Description hidden on card; shown in modal only */}

        {/* Price Range (for tools) */}
        {item.type === 'tool' && item.price_range && (
          <div className="text-xs sm:text-sm">
            <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] sm:text-xs font-medium">
              {getPriceRangeLabel()}
            </span>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={`px-2 py-1 rounded text-xs font-mono ${'bg-white/10 text-white/70'}`}
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 4 && (
              <span
                className={`px-2 py-1 rounded text-xs font-mono ${'bg-white/10 text-white/60'}`}
              >
                +{item.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Metadata (if enabled) */}
        {showMetadata && (
          <div
            className={`text-xs space-y-1 pt-2 border-t font-source ${'text-white/50 border-white/10'}`}
          >
            <div>Clicks: {item.click_count.toLocaleString()}</div>
            <div>Added: {new Date(item.created_at).toLocaleDateString()}</div>
            {item.isbn && <div>ISBN: {item.isbn}</div>}
          </div>
        )}

        {/* Action Button */}
        <div className={`pt-2 border-t mt-auto ${'border-white/10'}`}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {renderRating()}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={isClicking || !item.is_active}
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
                  Otwieranie...
                </span>
              ) : trackingStatus === 'success' ? (
                <span className="flex items-center justify-center gap-1">
                  ✅ Otwarto
                </span>
              ) : trackingStatus === 'error' ? (
                <span className="flex items-center justify-center gap-1">
                  ⚠️ Spróbuj ponownie
                </span>
              ) : (
                <>{item.type === 'book' ? 'Zobacz' : 'Sprawdź narzędzie'}</>
              )}
            </button>
            <p
              className={`text-[10px] sm:text-[11px] text-center font-source ${'text-white/60'}`}
            >
              Kliknij przycisk, aby samodzielnie sprawdzić narzędzie
            </p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailsOpen &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center ${'bg-black/80 backdrop-blur-sm'}`}
            onClick={() => setDetailsOpen(false)}
          >
            <div
              className={`relative w-full max-w-4xl md:max-w-5xl rounded-2xl border p-6 md:p-8 flex flex-col max-h-[85vh] overflow-y-auto ${'bg-gradient-to-b from-white/10 to-white/5 border-white/20'}`}
              onClick={(e) => e.stopPropagation()}
              style={{ boxSizing: 'border-box' }}
            >
              <div
                className={`flex items-start gap-4 border-b pb-4 md:pb-6 ${'border-white/10'}`}
              >
                {item.image_url && (
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-xl md:text-2xl font-black leading-tight font-inter ${'text-white'}`}
                  >
                    {item.title}
                  </h3>
                  <div
                    className={`text-sm mt-1 font-source ${'text-white/60'}`}
                  >
                    {item.author && <span>Dodane przez {item.author}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-mono ${'bg-white/10 text-white/70'}`}
                    >
                      {getTypeLabel()}
                    </span>
                    {item.price_range && item.type === 'tool' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        {getPriceRangeLabel()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-6 space-y-4">
                <div
                  className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-source ${'text-white/80'}`}
                >
                  {item.description || 'Brak opisu od administratorów.'}
                </div>
                {(item.publisher || item.publication_year) && (
                  <div
                    className={`text-xs md:text-sm font-source ${'text-white/60'}`}
                  >
                    {item.publisher}
                    {item.publication_year && ` (${item.publication_year})`}
                  </div>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded text-xs font-mono ${'bg-white/10 text-white/70'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div
                className={`mt-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t ${'border-white/10'}`}
              >
                <button
                  onClick={() => setDetailsOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium font-source ${'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                >
                  Zamknij
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  disabled={isClicking || !item.is_active}
                  className={getButtonStyling()}
                  aria-label={
                    item.type === 'book'
                      ? 'Zobacz pełny opis i przejdź do źródła'
                      : 'Otwórz narzędzie przez link partnerski'
                  }
                >
                  {item.type === 'book' ? 'Zobacz' : 'Otwórz narzędzie'}
                </button>
              </div>

              <button
                aria-label="Zamknij"
                onClick={() => setDetailsOpen(false)}
                className={`absolute top-3 right-3 px-2 py-1 rounded-md text-sm ${'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
