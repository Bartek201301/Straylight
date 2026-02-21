'use client';

import React from 'react';
import { cn } from '@/lib/utils';
type LibraryGridVariant = 'compact' | 'standard' | 'expanded';
type LibraryGridSize = 'sm' | 'md' | 'lg';

interface ResponsiveLibraryGridProps {
  children?: React.ReactNode;
  className?: string;
  variant?: LibraryGridVariant;
  size?: LibraryGridSize;
  minItemWidth?: string;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingCount?: number;
}

/**
 * ResponsiveLibraryGrid - Optimized grid for displaying library items
 *
 * Responsive breakpoints:
 * - Mobile (default): 1 column
 * - Small (sm: 640px+): 2 columns
 * - Medium (md: 768px+): 3 columns
 * - Large (lg: 1024px+): 4 columns
 * - Extra Large (xl: 1280px+): 4-6 columns (depending on variant)
 *
 * @param variant - Grid density: 'compact' (6 cols), 'standard' (4 cols), 'expanded' (4 cols)
 * @param size - Item sizing: 'sm', 'md', 'lg'
 * @param minItemWidth - CSS min-width for grid items (auto-fit behavior)
 * @param gap - Space between items
 * @param loading - Show loading skeleton
 * @param loadingCount - Number of skeleton items to show
 */
export default function ResponsiveLibraryGrid({
  children,
  className = '',
  variant = 'standard',
  size = 'md',
  minItemWidth,
  gap = 'md',
  loading = false,
  loadingCount = 8,
}: ResponsiveLibraryGridProps) {
  // Responsive grid classes based on variant
  const getGridClasses = () => {
    const baseClasses = 'grid w-full';

    if (minItemWidth) {
      // Use CSS auto-fit with minimum width
      return cn(
        baseClasses,
        `grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`
      );
    }

    // Predefined responsive breakpoints
    switch (variant) {
      case 'compact':
        return cn(
          baseClasses,
          'grid-cols-1', // Mobile: 1 column
          'sm:grid-cols-2', // Small: 2 columns
          'md:grid-cols-3', // Medium: 3 columns
          'lg:grid-cols-4', // Large: 4 columns
          'xl:grid-cols-5', // XL: 5 columns
          '2xl:grid-cols-6' // 2XL: 6 columns
        );

      case 'expanded':
        return cn(
          baseClasses,
          'grid-cols-1', // Mobile: 1 column
          'sm:grid-cols-2', // Small: 2 columns
          'lg:grid-cols-3', // Large: 3 columns (wider items)
          'xl:grid-cols-4' // XL: 4 columns
        );

      case 'standard':
      default:
        return cn(
          baseClasses,
          'grid-cols-1', // Mobile: 1 column
          'sm:grid-cols-2', // Small: 2 columns
          'md:grid-cols-3', // Medium: 3 columns
          'lg:grid-cols-4', // Large: 4 columns
          'xl:grid-cols-4' // XL: 4 columns (stable)
        );
    }
  };

  // Gap sizing
  const getGapClass = () => {
    switch (gap) {
      case 'sm':
        return 'gap-3';
      case 'md':
        return 'gap-4 sm:gap-6';
      case 'lg':
        return 'gap-6 sm:gap-8';
      case 'xl':
        return 'gap-8 sm:gap-10';
      default:
        return 'gap-4 sm:gap-6';
    }
  };

  // Size-based item styling
  const getItemSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'min-h-[220px] sm:min-h-[260px]';
      case 'md':
        return 'min-h-[260px] sm:min-h-[300px] md:min-h-[320px]';
      case 'lg':
        return 'min-h-[300px] sm:min-h-[340px] lg:min-h-[380px]';
      default:
        return 'min-h-[260px] sm:min-h-[300px] md:min-h-[320px]';
    }
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {[...Array(loadingCount)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className={cn(
            `backdrop-blur-sm border rounded-2xl p-4 animate-pulse ${'bg-white/5 border-white/10'}`,
            getItemSizeClasses()
          )}
        >
          <div className="space-y-4">
            {/* Image placeholder */}
            <div className={`rounded-xl h-32 w-full ${'bg-white/20'}`} />

            {/* Content placeholders */}
            <div className="space-y-2">
              <div className={`rounded h-4 w-3/4 ${'bg-white/20'}`} />
              <div className={`rounded h-3 w-1/2 ${'bg-white/20'}`} />
            </div>

            {/* Description placeholder */}
            <div className="space-y-2">
              <div className={`rounded h-3 w-full ${'bg-white/20'}`} />
              <div className={`rounded h-3 w-2/3 ${'bg-white/20'}`} />
            </div>

            {/* Button placeholder */}
            <div className={`rounded h-8 w-full ${'bg-white/20'}`} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div
      className={cn(getGridClasses(), getGapClass(), className)}
      style={{
        // Ensure consistent item sizing
        gridAutoRows: 'minmax(auto, max-content)',
      }}
    >
      {loading ? renderLoadingSkeleton() : children}
    </div>
  );
}

// Utility component for consistent item styling
export function LibraryGridItem({
  children,
  className = '',
  size = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  size?: LibraryGridSize;
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'min-h-[220px] sm:min-h-[260px]';
      case 'md':
        return 'min-h-[260px] sm:min-h-[300px] md:min-h-[320px]';
      case 'lg':
        return 'min-h-[300px] sm:min-h-[340px] lg:min-h-[380px]';
      default:
        return 'min-h-[260px] sm:min-h-[300px] md:min-h-[320px]';
    }
  };

  return (
    <div className={cn('flex flex-col h-full', getSizeClasses(), className)}>
      {children}
    </div>
  );
}
