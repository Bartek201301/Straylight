'use client';

import React, { useState, useCallback, useMemo, memo, useRef } from 'react';
import {
  AffiliateItemType,
  AFFILIATE_ITEM_TYPES,
} from '@/lib/types/affiliate-library';
import { PopularTag } from '@/app/api/affiliate-library/popular-tags/route';

export interface FilterOptions {
  type?: AffiliateItemType;
  tags?: string[];
  search?: string;
  sort_by?: 'rating' | 'created_at' | 'title' | 'click_count';
  sort_order?: 'asc' | 'desc';
}

interface AffiliateLibraryFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (_filters: FilterOptions) => void;
  onClearFilters: () => void;
  availableTags?: string[];
  isLoading?: boolean;
  popularTags?: PopularTag[];
  popularTagsLoading?: boolean;
  onRefreshPopularTags?: () => void;
}

const SORT_OPTIONS = [
  { value: 'rating:desc', label: 'Najwyżej oceniane' },
  { value: 'rating:asc', label: 'Najniżej oceniane' },
  { value: 'created_at:desc', label: 'Najnowsze najpierw' },
  { value: 'created_at:asc', label: 'Najstarsze najpierw' },
  { value: 'title:asc', label: 'Alfabetycznie A-Z' },
  { value: 'title:desc', label: 'Alfabetycznie Z-A' },
  { value: 'click_count:desc', label: 'Najpopularniejsze' },
  { value: 'click_count:asc', label: 'Najmniej popularne' },
];

// Pre-defined common tags to avoid API calls
const COMMON_TAGS = [
  'AI',
  'Machine Learning',
  'Programming',
  'JavaScript',
  'Python',
  'React',
  'Next.js',
  'TypeScript',
  'Productivity',
  'Design',
  'Business',
  'Career Development',
  'Self-Help',
  'Fiction',
  'Non-Fiction',
  'Technical',
  'Beginner',
  'Advanced',
  'Web Development',
  'Data Science',
  'Advanced',
  'Free',
  'Premium',
];

function AffiliateLibraryFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  availableTags = [],
  isLoading = false,
  popularTags = [],
  popularTagsLoading = false,
  onRefreshPopularTags,
}: AffiliateLibraryFiltersProps) {
  const [tagInput, setTagInput] = useState('');
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Ref for the search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use popular tags if available, fallback to common tags + available tags
  const displayTags = useMemo(() => {
    if (popularTags.length > 0) {
      // Use popular tags and merge with any additional available tags not in popular
      const popularTagNames = popularTags.map((tag) => tag.tag);
      const additionalTags = availableTags.filter(
        (tag) => !popularTagNames.includes(tag)
      );
      return [...popularTagNames, ...additionalTags].slice(0, 12);
    }

    // Fallback: merge available tags with common tags, removing duplicates
    return Array.from(new Set([...COMMON_TAGS, ...availableTags])).slice(0, 12);
  }, [popularTags, availableTags]);

  const updateFilter = useCallback(
    (key: keyof FilterOptions, value: any) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
    },
    []
  );

  // Manual search function - only called on button click or Enter press
  const handleSearch = useCallback(() => {
    onFiltersChange({
      ...filters,
      search: searchValue || undefined,
    });
  }, [filters, onFiltersChange, searchValue]);

  // Handle Enter key press for search
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleSortChange = useCallback(
    (sortValue: string) => {
      const [sort_by, sort_order] = sortValue.split(':') as [
        FilterOptions['sort_by'],
        FilterOptions['sort_order'],
      ];
      onFiltersChange({
        ...filters,
        sort_by,
        sort_order,
      });
    },
    [filters, onFiltersChange]
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !filters.tags?.includes(trimmedTag)) {
      updateFilter('tags', [...(filters.tags || []), trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFilter(
      'tags',
      filters.tags?.filter((tag) => tag !== tagToRemove) || []
    );
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const hasActiveFilters = Boolean(
    filters.type ||
      filters.search ||
      filters.tags?.length ||
      filters.sort_by ||
      filters.sort_order
  );

  return (
    <div
      className={`backdrop-blur-sm border rounded-2xl p-6 space-y-6 ${'bg-white/5 border-white/10'}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className={`text-lg font-semibold font-inter ${'text-white'}`}>
          Filtruj Bibliotekę
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`text-sm underline transition-colors font-source ${'text-white/60 hover:text-white/80'}`}
            disabled={isLoading}
          >
            Wyczyść wszystkie filtry
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label
          htmlFor="search"
          className={`block text-sm font-medium mb-2 font-source ${'text-white'}`}
        >
          Szukaj
        </label>
        <div className="relative flex flex-col sm:flex-row gap-2">
          <input
            ref={searchInputRef}
            id="search"
            type="text"
            placeholder="Przeszukuj tytuły, opisy, autorów..."
            value={searchValue}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all font-source text-sm sm:text-base ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 placeholder:text-white/50'}`}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl hover:scale-105 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-source font-medium text-sm sm:text-base whitespace-nowrap ${'bg-white text-black hover:bg-white/90 focus:ring-white/20'}`}
          >
            {isLoading ? (
              <div
                className={`animate-spin rounded-full h-4 w-4 border-2 border-t-transparent ${'border-black'}`}
              ></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
            Szukaj
          </button>
        </div>
      </div>

      {/* Main Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Type Filter */}
        <div className="order-1">
          <label
            htmlFor="type"
            className={`block text-sm font-medium mb-2 font-source ${'text-white'}`}
          >
            Typ
          </label>
          <select
            id="type"
            value={filters.type || ''}
            onChange={(e) => updateFilter('type', e.target.value || undefined)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20'}`}
            style={{
              colorScheme: 'dark',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
            disabled={isLoading}
          >
            <option
              value=""
              style={{
                backgroundColor: '#666666',
                color: '#fff',
              }}
            >
              Wszystkie Typy
            </option>
            {Object.entries(AFFILIATE_ITEM_TYPES).map(([value, label]) => (
              <option
                key={value}
                value={value}
                style={{
                  backgroundColor: '#666666',
                  color: '#fff',
                }}
              >
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort - Mobile: 2nd position, Desktop: 3rd position */}
        <div className="order-2 sm:order-3">
          <label
            htmlFor="sort"
            className={`block text-sm font-medium mb-2 font-source ${'text-white'}`}
          >
            Sortuj według
          </label>
          <select
            id="sort"
            value={`${filters.sort_by || 'rating'}:${filters.sort_order || 'desc'}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20'}`}
            style={{
              colorScheme: 'dark',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
            disabled={isLoading}
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                style={{
                  backgroundColor: '#666666',
                  color: '#fff',
                }}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Filter - Mobile: 3rd position, Desktop: 2nd position */}
        <div className="order-3 sm:order-2">
          <label
            htmlFor="tags"
            className={`block text-sm font-medium mb-2 font-source ${'text-white'}`}
          >
            Tagi
          </label>
          <div className="space-y-3">
            <input
              type="text"
              id="tags"
              placeholder="Dodaj tagi..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all font-source ${'border-white/20 bg-white/10 text-white focus:ring-white/20 focus:border-white/40 hover:bg-white/20 placeholder-white/50'}`}
              disabled={isLoading}
            />
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors font-mono ${'bg-white/10 text-white'}`}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className={`focus:outline-none transition-colors ${'text-white/80 hover:text-white'}`}
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.tags.length > 3 && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-mono ${'bg-white/10 text-white/60'}`}
                  >
                    +{filters.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium font-source ${'text-white'}`}>
            {popularTags.length > 0 ? 'Popularne tagi:' : 'Popularne tagi:'}
          </label>
          {onRefreshPopularTags && (
            <button
              onClick={onRefreshPopularTags}
              disabled={popularTagsLoading || isLoading}
              className={`text-xs px-2 py-1 rounded-md border transition-colors font-source ${'border-white/20 text-white/60 hover:text-white/80 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed'}`}
              title="Refresh popular tags"
            >
              {popularTagsLoading ? '...' : '↻'}
            </button>
          )}
        </div>

        {popularTagsLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className={`h-7 rounded-lg animate-pulse ${'bg-white/10'}`}
                style={{ width: `${60 + Math.random() * 40}px` }}
              />
            ))}
          </div>
        ) : displayTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayTags.map((tag, _index) => {
              const popularTag = popularTags.find((pt) => pt.tag === tag);
              const count = popularTag?.count;

              return (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  disabled={filters.tags?.includes(tag) || isLoading}
                  className={`px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 disabled:cursor-not-allowed transition-colors font-mono group relative ${'border-white/20 text-white/80 hover:bg-white/10 focus:ring-white/20 disabled:bg-white/5 disabled:text-white/40'}`}
                  title={count ? `Used in ${count} items` : undefined}
                >
                  {tag}
                  {count && count > 1 && (
                    <span
                      className={`ml-1.5 text-[10px] opacity-60 group-hover:opacity-80 ${'text-white/60'}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className={`text-sm text-center py-4 rounded-lg border-2 border-dashed ${'text-white/40 border-white/10'}`}
          >
            Brak dostępnych tagów
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className={`pt-4 border-t ${'border-white/10'}`}>
          <div className={`text-sm font-source ${'text-white/70'}`}>
            <span className="font-medium">Aktywne filtry:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.type && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono ${'bg-white/10'}`}
                >
                  Type: {AFFILIATE_ITEM_TYPES[filters.type]}
                </span>
              )}
              {filters.search && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono ${'bg-white/10'}`}
                >
                  Search: &ldquo;{filters.search}&rdquo;
                </span>
              )}
              {filters.tags && filters.tags.length > 0 && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono ${'bg-white/10'}`}
                >
                  Tags: {filters.tags.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom comparison function for memo to prevent unnecessary re-renders
const areEqual = (
  prevProps: AffiliateLibraryFiltersProps,
  nextProps: AffiliateLibraryFiltersProps
) => {
  // Compare primitive props
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.popularTagsLoading !== nextProps.popularTagsLoading)
    return false;

  // Deep compare filters object
  const prevFilters = prevProps.filters;
  const nextFilters = nextProps.filters;

  if (prevFilters.search !== nextFilters.search) return false;
  if (prevFilters.type !== nextFilters.type) return false;
  if (prevFilters.sort_by !== nextFilters.sort_by) return false;
  if (prevFilters.sort_order !== nextFilters.sort_order) return false;

  // Compare tags arrays
  const prevTags = prevFilters.tags || [];
  const nextTags = nextFilters.tags || [];
  if (prevTags.length !== nextTags.length) return false;
  for (let i = 0; i < prevTags.length; i++) {
    if (prevTags[i] !== nextTags[i]) return false;
  }

  // Compare availableTags arrays
  const prevAvailableTags = prevProps.availableTags || [];
  const nextAvailableTags = nextProps.availableTags || [];
  if (prevAvailableTags.length !== nextAvailableTags.length) return false;
  for (let i = 0; i < prevAvailableTags.length; i++) {
    if (prevAvailableTags[i] !== nextAvailableTags[i]) return false;
  }

  // Compare popularTags arrays
  const prevPopularTags = prevProps.popularTags || [];
  const nextPopularTags = nextProps.popularTags || [];
  if (prevPopularTags.length !== nextPopularTags.length) return false;
  for (let i = 0; i < prevPopularTags.length; i++) {
    const prev = prevPopularTags[i];
    const next = nextPopularTags[i];
    if (prev.tag !== next.tag || prev.count !== next.count) return false;
  }

  // If we get here, all props are functionally equal
  return true;
};

// Memoize component with custom comparison to prevent unnecessary re-renders
export default memo(AffiliateLibraryFilters, areEqual);
