import { useState, useEffect, useCallback, useRef } from 'react';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';
import { FilterOptions } from '@/components/affiliate/AffiliateLibraryFilters';
import { PopularTag } from '@/app/api/affiliate-library/popular-tags/route';

interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
  count: number;
  hasMore: boolean;
}

interface AffiliateLibraryResponse {
  success: boolean;
  data: {
    items: AffiliateLibraryRow[];
    pagination: PaginationInfo;
    filters: Record<string, any>;
  };
  message: string;
}

interface UseLibraryStateProps {
  initialItems?: AffiliateLibraryRow[];
  initialPagination?: PaginationInfo;
  itemsPerPage?: number;
  debounceMs?: number;
}

interface LibraryState {
  items: AffiliateLibraryRow[];
  pagination: PaginationInfo;
  filters: FilterOptions;
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
  availableTags: string[];
  popularTags: PopularTag[];
  popularTagsLoading: boolean;
  popularTagsError: string | null;
}

export function useLibraryState({
  initialItems = [],
  initialPagination,
  itemsPerPage = 12,
  debounceMs = 300,
}: UseLibraryStateProps = {}) {
  // State management
  const [state, setState] = useState<LibraryState>({
    items: initialItems,
    pagination: initialPagination || {
      limit: itemsPerPage,
      offset: 0,
      total: 0,
      count: 0,
      hasMore: false,
    },
    filters: {}, // Start with empty filters
    loading: false,
    searchLoading: false,
    error: null,
    availableTags: [],
    popularTags: [],
    popularTagsLoading: false,
    popularTagsError: null,
  });

  // Race condition handling
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  // Debouncing for search
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Popular tags caching
  const popularTagsCacheRef = useRef<{
    tags: PopularTag[];
    timestamp: number;
    ttl: number;
  } | null>(null);

  // Cancel previous requests to handle race conditions
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Enhanced fetch function with race condition handling
  const fetchItems = useCallback(
    async (
      newFilters: FilterOptions,
      offset: number = 0,
      append: boolean = false,
      immediate: boolean = false
    ) => {
      // Cancel previous requests
      cancelPendingRequests();

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Generate request ID for race condition handling
      const requestId = ++requestIdRef.current;

      const executeRequest = async () => {
        // Set appropriate loading state based on operation type
        if (!append) {
          const isSearchOperation = newFilters.search !== undefined;
          setState((prev) => ({
            ...prev,
            loading: !isSearchOperation,
            searchLoading: isSearchOperation,
            error: null,
          }));
        }

        try {
          const params = new URLSearchParams();

          // Add filters to params
          if (newFilters.type) params.set('type', newFilters.type);
          if (newFilters.search) params.set('search', newFilters.search);
          if (newFilters.tags?.length)
            params.set('tags', newFilters.tags.join(','));
          if (newFilters.sort_by) params.set('sort_by', newFilters.sort_by);
          if (newFilters.sort_order)
            params.set('sort_order', newFilters.sort_order);

          // Add pagination
          params.set('limit', itemsPerPage.toString());
          params.set('offset', offset.toString());

          const response = await fetch(
            `/api/affiliate-library?${params.toString()}`,
            { signal: abortController.signal }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch library items: ${response.statusText}`
            );
          }

          const data: AffiliateLibraryResponse = await response.json();

          // Check if this is still the latest request
          if (requestId !== requestIdRef.current) {
            return; // Ignore outdated response
          }

          if (data.success) {
            setState((prev) => {
              const newItems = append
                ? [...prev.items, ...data.data.items]
                : data.data.items;

              // Extract available tags from items
              const allTags = data.data.items.flatMap(
                (item) => item.tags || []
              );
              const uniqueTags = Array.from(
                new Set([...prev.availableTags, ...allTags])
              );

              return {
                ...prev,
                items: newItems,
                pagination: data.data.pagination,
                filters: newFilters,
                availableTags: uniqueTags,
                loading: false,
                searchLoading: false,
                error: null,
              };
            });
          } else {
            throw new Error(data.message || 'Failed to fetch library items');
          }
        } catch (err) {
          // Ignore aborted requests
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }

          // Check if this is still the latest request
          if (requestId !== requestIdRef.current) {
            return;
          }

          const errorMessage =
            err instanceof Error ? err.message : 'An error occurred';
          setState((prev) => ({
            ...prev,
            loading: false,
            searchLoading: false,
            error: errorMessage,
          }));

          console.error('Error fetching library items:', err);
        }
      };

      // Apply debouncing for search queries (unless immediate)
      if (!immediate && newFilters.search && newFilters.search.trim()) {
        debounceTimeoutRef.current = setTimeout(executeRequest, debounceMs);
      } else {
        await executeRequest();
      }
    },
    [itemsPerPage, debounceMs, cancelPendingRequests]
  );

  // Fetch popular tags with caching
  const fetchPopularTags = useCallback(async (skipCache: boolean = false) => {
    // Check cache first
    const cache = popularTagsCacheRef.current;
    const now = Date.now();

    if (!skipCache && cache && now - cache.timestamp < cache.ttl * 1000) {
      setState((prev) => ({
        ...prev,
        popularTags: cache.tags,
        popularTagsError: null,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      popularTagsLoading: true,
      popularTagsError: null,
    }));

    try {
      const params = new URLSearchParams();
      if (skipCache) params.set('skip_cache', 'true');

      const response = await fetch(
        `/api/affiliate-library/popular-tags?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch popular tags: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const { tags, cache_info } = data.data;

        // Update cache
        popularTagsCacheRef.current = {
          tags,
          timestamp: now,
          ttl: cache_info.ttl_seconds,
        };

        setState((prev) => ({
          ...prev,
          popularTags: tags,
          popularTagsLoading: false,
          popularTagsError: null,
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch popular tags');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch popular tags';

      setState((prev) => ({
        ...prev,
        popularTags: [],
        popularTagsLoading: false,
        popularTagsError: errorMessage,
      }));

      console.error('Error fetching popular tags:', err);
    }
  }, []);

  // Handle filter changes with smart loading states
  const updateFilters = useCallback(
    (newFilters: FilterOptions, immediate: boolean = false) => {
      fetchItems(newFilters, 0, false, immediate);
    },
    [fetchItems]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    fetchItems(emptyFilters, 0, false, true);
  }, [fetchItems]);

  // Load more items (pagination)
  const loadMore = useCallback(() => {
    if (state.pagination.hasMore && !state.loading) {
      const newOffset = state.pagination.offset + state.pagination.limit;
      fetchItems(state.filters, newOffset, true, true);
    }
  }, [fetchItems, state.filters, state.pagination, state.loading]);

  // Initial load
  useEffect(() => {
    if (initialItems.length === 0) {
      fetchItems({}, 0, false, true);
    }

    // Load popular tags on mount
    fetchPopularTags();

    // Cleanup on unmount
    return () => {
      cancelPendingRequests();
    };
  }, [
    fetchItems,
    fetchPopularTags,
    initialItems.length,
    cancelPendingRequests,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingRequests();
    };
  }, [cancelPendingRequests]);

  // Refresh popular tags function
  const refreshPopularTags = useCallback(() => {
    fetchPopularTags(true);
  }, [fetchPopularTags]);

  return {
    // State
    items: state.items,
    pagination: state.pagination,
    filters: state.filters,
    loading: state.loading,
    searchLoading: state.searchLoading,
    error: state.error,
    availableTags: state.availableTags,
    popularTags: state.popularTags,
    popularTagsLoading: state.popularTagsLoading,
    popularTagsError: state.popularTagsError,

    // Actions
    updateFilters,
    clearFilters,
    loadMore,
    refreshPopularTags,

    // Utils
    hasActiveFilters: Boolean(
      state.filters.type ||
        state.filters.search ||
        state.filters.tags?.length ||
        state.filters.sort_by ||
        state.filters.sort_order
    ),
  };
}
