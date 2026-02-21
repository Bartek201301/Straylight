'use client';

import React, { memo, useCallback } from 'react';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';
import AffiliateLibraryFilters, {
  FilterOptions,
} from './AffiliateLibraryFilters';
import AffiliateLibraryCard from './AffiliateLibraryCard';
import ResponsiveLibraryGrid, {
  LibraryGridItem,
} from './ResponsiveLibraryGrid';
import { useLibraryState } from '@/hooks/useLibraryState';
interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  count: number;
  hasMore: boolean;
}

interface AffiliateLibraryListProps {
  initialItems?: AffiliateLibraryRow[];
  initialPagination?: PaginationInfo;
  showFilters?: boolean;
  showMetadata?: boolean;
  itemsPerPage?: number;
  className?: string;
}

export default function AffiliateLibraryList({
  initialItems = [],
  initialPagination,
  showFilters = true,
  showMetadata = false,
  itemsPerPage = 12,
  className = '',
}: AffiliateLibraryListProps) {
  // Use enhanced state management hook
  const {
    items,
    pagination,
    filters,
    loading,
    searchLoading,
    error,
    availableTags,
    popularTags,
    popularTagsLoading,
    updateFilters,
    clearFilters,
    loadMore,
    refreshPopularTags,
  } = useLibraryState({
    initialItems,
    initialPagination,
    itemsPerPage,
    debounceMs: 500, // Increased debounce for better performance
  });

  // Memoized event handlers to prevent unnecessary re-renders
  const handleFiltersChange = useCallback(
    (newFilters: FilterOptions) => {
      updateFilters(newFilters);
    },
    [updateFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  // Handle card click (for analytics/tracking)
  const handleCardClick = useCallback((itemId: string) => {
    // Could be used for client-side analytics
    console.log('Card clicked:', itemId);
  }, []);

  // Memoized Results Grid Component to prevent unnecessary re-renders
  const MemoizedResultsGrid = memo(
    ({
      items: gridItems,
      showMetadata: gridShowMetadata,
      onCardClick: gridOnCardClick,
    }: {
      items: AffiliateLibraryRow[];
      showMetadata: boolean;
      onCardClick: (itemId: string) => void;
    }) => {
      return (
        <ResponsiveLibraryGrid variant="standard" gap="lg" size="md">
          {gridItems.map((item, index) => (
            <LibraryGridItem key={item.id} size="md">
              <AffiliateLibraryCard
                item={item}
                onCardClick={gridOnCardClick}
                showMetadata={gridShowMetadata}
                position={index}
              />
            </LibraryGridItem>
          ))}
        </ResponsiveLibraryGrid>
      );
    }
  );

  MemoizedResultsGrid.displayName = 'MemoizedResultsGrid';

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <ResponsiveLibraryGrid
          loading={true}
          loadingCount={itemsPerPage}
          variant="standard"
          gap="lg"
        >
          {/* Loading state - children not needed */}
        </ResponsiveLibraryGrid>
        {showFilters && (
          <div className={`pt-8 border-t ${'border-white/10'}`}>
            <div
              className={`backdrop-blur-sm border rounded-2xl p-6 ${'bg-white/5 border-white/10'}`}
            >
              <div className="animate-pulse space-y-4">
                <div className={`h-4 rounded w-1/4 ${'bg-white/20'}`}></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`h-10 rounded ${'bg-white/20'}`}></div>
                  <div className={`h-10 rounded ${'bg-white/20'}`}></div>
                  <div className={`h-10 rounded ${'bg-white/20'}`}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div
          className={`backdrop-blur-sm border rounded-2xl p-8 max-w-2xl mx-auto ${'bg-white/5 border-white/10'}`}
        >
          <div className="text-red-400 text-lg font-medium mb-2 font-inter">
            Błąd Ładowania Biblioteki
          </div>
          <p className={`mb-6 font-source ${'text-white/70'}`}>{error}</p>
          <button
            onClick={() => updateFilters(filters, true)}
            className={`px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 font-medium font-source ${'bg-white text-black hover:bg-white/90'}`}
          >
            Spróbuj Ponownie
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (items.length === 0 && !loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div
            className={`backdrop-blur-sm border rounded-2xl p-8 max-w-2xl mx-auto ${'bg-white/5 border-white/10'}`}
          >
            <div className="text-6xl mb-4"></div>
            <h3
              className={`text-lg font-medium mb-2 font-inter ${'text-white'}`}
            >
              Nie znaleziono elementów
            </h3>
            <p className={`mb-6 font-source ${'text-white/70'}`}>
              Spróbuj dostosować filtry lub wyszukiwane frazy, aby znaleźć to,
              czego szukasz.
            </p>
            <button
              onClick={handleClearFilters}
              className={`px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 font-medium font-source ${'bg-white text-black hover:bg-white/90'}`}
            >
              Wyczyść Filtry
            </button>
          </div>
        </div>
        {showFilters && (
          <div className={`pt-8 border-t ${'border-white/10'}`}>
            <AffiliateLibraryFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              availableTags={availableTags}
              isLoading={searchLoading}
              popularTags={popularTags}
              popularTagsLoading={popularTagsLoading}
              onRefreshPopularTags={refreshPopularTags}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters - Now at Top */}
      {showFilters && (
        <div className={`pb-6 border-b ${'border-white/10'}`}>
          <AffiliateLibraryFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            availableTags={availableTags}
            isLoading={searchLoading}
            popularTags={popularTags}
            popularTagsLoading={popularTagsLoading}
            onRefreshPopularTags={refreshPopularTags}
          />
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className={`text-sm font-source ${'text-white/70'}`}>
          Wyświetlanie {items.length.toLocaleString()} z{' '}
          {pagination.total.toLocaleString()} elementów
        </div>
        <div className={`text-sm font-source ${'text-white/60'}`}>
          {filters.sort_by && (
            <>
              Sorted by {filters.sort_by.replace('_', ' ')} (
              {filters.sort_order})
            </>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <MemoizedResultsGrid
        items={items}
        showMetadata={showMetadata}
        onCardClick={handleCardClick}
      />

      {/* Load More */}
      {pagination.hasMore && (
        <div className="text-center pt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className={`px-6 py-3 border rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium font-source ${'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                Ładowanie...
              </span>
            ) : (
              `Załaduj Więcej (pozostało ${(pagination.total - items.length).toLocaleString()})`
            )}
          </button>
        </div>
      )}

      {/* Loading Overlay for Append */}
      {loading && items.length > 0 && (
        <div
          className={`fixed bottom-4 right-4 backdrop-blur-sm border shadow-lg rounded-lg p-3 flex items-center gap-2 z-50 ${'bg-white/10 border-white/20'}`}
        >
          <svg
            className={`animate-spin h-4 w-4 ${'text-white'}`}
            viewBox="0 0 24 24"
          >
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
          <span className={`text-sm font-source ${'text-white/80'}`}>
            Ładowanie kolejnych elementów...
          </span>
        </div>
      )}
    </div>
  );
}
