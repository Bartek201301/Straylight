// ============================================================================
// MULTI-TABLE SEARCH SERVICE FOR STRAYLIGHT
// ============================================================================
// This service provides comprehensive search functionality across articles,
// library items (including research papers), and other content types using
// Supabase full-text search with proper ranking and aggregation.
// ============================================================================

import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import {
  rankSearchResults,
  type RankingOptions,
  type EnhancedSearchResult,
} from './ranking-service';
import {
  getCachedSearchResults,
  optimizeSearchQuery,
  debounceSearch,
} from './search-cache';

// ============================================================================
// SEARCH TYPES AND INTERFACES
// ============================================================================

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  pagination?: SearchPagination;
  options?: SearchOptions;
}

export interface SearchFilters {
  contentTypes?: ('articles' | 'library_items' | 'research_papers')[];
  articleStatus?: ('draft' | 'pending' | 'published' | 'archived')[];
  libraryItemTypes?: (
    | 'paper'
    | 'book'
    | 'video'
    | 'article'
    | 'website'
    | 'tool'
    | 'dataset'
  )[];
  libraryItemStatus?: ('pending' | 'approved' | 'rejected')[];
  tags?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  authorId?: string;
  submitterId?: string;
}

export interface SearchPagination {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchOptions {
  includeContent?: boolean;
  rankingMode?: 'relevance' | 'popularity' | 'recent' | 'combined' | 'quality';
  fuzzySearch?: boolean;
  exactPhrase?: boolean;
  minRelevanceScore?: number;
  useAdvancedRanking?: boolean;
  rankingOptions?: RankingOptions;
}

export interface SearchResult {
  id: string;
  type: 'article' | 'library_item';
  title: string;
  description?: string;
  excerpt?: string;
  content?: string;
  author?: {
    id: string;
    handle: string;
  };
  submitter?: {
    id: string;
    handle: string;
  };
  tags: string[];
  url?: string;
  itemType?: string;
  status: string;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  approvedAt?: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[] | EnhancedSearchResult[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchMetadata: {
    query: string;
    executionTime: number;
    resultsByType: {
      articles: number;
      library_items: number;
    };
    appliedFilters: SearchFilters;
    rankingMode?: string;
    cached?: boolean;
    cacheHit?: boolean;
    queryOptimizations?: string[];
    querySuggestions?: string[];
    originalQuery?: string;
    optimizedQuery?: string;
  };
}

// ============================================================================
// SEARCH QUERY BUILDERS
// ============================================================================

/**
 * Builds PostgreSQL full-text search query from user input
 */
function buildSearchQuery(query: string, options: SearchOptions = {}): string {
  if (!query.trim()) return '';

  let normalizedQuery = query.trim();

  if (options.exactPhrase) {
    // For exact phrase matching, wrap in quotes
    return `"${normalizedQuery.replace(/"/g, '\\"')}"`;
  }

  if (options.fuzzySearch) {
    // For fuzzy search, use prefix matching with wildcards
    normalizedQuery = normalizedQuery
      .split(/\s+/)
      .map((term) => `${term}:*`)
      .join(' & ');
  } else {
    // Standard search with AND logic
    normalizedQuery = normalizedQuery.split(/\s+/).join(' & ');
  }

  return normalizedQuery;
}

/**
 * Builds WHERE clause for content filtering
 */
function buildFilterClause(filters: SearchFilters = {}): {
  articles: string[];
  libraryItems: string[];
} {
  const articleFilters: string[] = [];
  const libraryItemFilters: string[] = [];

  // Article status filter
  if (filters.articleStatus && filters.articleStatus.length > 0) {
    const statusList = filters.articleStatus.map((s) => `'${s}'`).join(', ');
    articleFilters.push(`status IN (${statusList})`);
  } else {
    // Default to published articles only
    articleFilters.push(`status = 'published'`);
  }

  // Library item status filter
  if (filters.libraryItemStatus && filters.libraryItemStatus.length > 0) {
    const statusList = filters.libraryItemStatus
      .map((s) => `'${s}'`)
      .join(', ');
    libraryItemFilters.push(`submission_status IN (${statusList})`);
  } else {
    // Default to approved library items only
    libraryItemFilters.push(`submission_status = 'approved'`);
  }

  // Library item type filter
  if (filters.libraryItemTypes && filters.libraryItemTypes.length > 0) {
    const typeList = filters.libraryItemTypes.map((t) => `'${t}'`).join(', ');
    libraryItemFilters.push(`item_type IN (${typeList})`);
  }

  // Tag filters (both tables)
  if (filters.tags && filters.tags.length > 0) {
    const tagFilter = `tags && ARRAY[${filters.tags.map((t) => `'${t}'`).join(', ')}]`;
    articleFilters.push(tagFilter);
    libraryItemFilters.push(tagFilter);
  }

  // Date range filters
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      articleFilters.push(`published_at >= '${filters.dateRange.start}'`);
      libraryItemFilters.push(`approved_at >= '${filters.dateRange.start}'`);
    }
    if (filters.dateRange.end) {
      articleFilters.push(`published_at <= '${filters.dateRange.end}'`);
      libraryItemFilters.push(`approved_at <= '${filters.dateRange.end}'`);
    }
  }

  // Author/submitter filters
  if (filters.authorId) {
    articleFilters.push(`author_id = '${filters.authorId}'`);
  }
  if (filters.submitterId) {
    libraryItemFilters.push(`submitter_id = '${filters.submitterId}'`);
  }

  return {
    articles: articleFilters,
    libraryItems: libraryItemFilters,
  };
}

// ============================================================================
// SEARCH EXECUTION FUNCTIONS
// ============================================================================

/**
 * Searches articles with full-text search and ranking
 */
async function searchArticles(
  searchQuery: string,
  filters: string[],
  options: SearchOptions,
  pagination: SearchPagination
): Promise<{ results: SearchResult[]; count: number }> {
  if (!searchQuery) {
    return { results: [], count: 0 };
  }

  try {
    // Use the optimized search function instead of view queries
    const { data, error } = await getSupabaseAdmin().rpc(
      'search_articles_with_ranking',
      {
        search_query: searchQuery,
        limit_count: pagination.limit || 20,
        offset_count: pagination.offset || 0,
      }
    );

    if (error) throw error;

    // Transform database results to SearchResult format
    const results: SearchResult[] = (data || []).map((row: any) => ({
      id: row.id,
      type: 'article' as const,
      title: row.title,
      description: row.excerpt,
      excerpt: row.excerpt,
      content: options.includeContent ? row.body_md : undefined, // Include content if requested
      author: {
        id: row.author_id,
        handle: row.author_handle,
        displayName: row.author_display_name,
        avatarUrl: row.author_avatar_url,
      },
      tags: row.tags || [],
      status: 'published',
      viewCount: row.view_count,
      createdAt: row.created_at,
      publishedAt: row.published_at,
      relevanceScore: row.search_rank || 1.0,
      voteCount: row.vote_count || 0,
      metadata: {
        articleStatus: 'published',
        searchRank: row.search_rank,
      },
    }));

    // Apply additional filters that couldn't be handled in the database function
    let filteredResults = results;

    // Apply author filter if present
    const authorFilter = filters.find((f) => f.includes('author_id'));
    if (authorFilter) {
      const authorId = authorFilter.match(/'([^']+)'/)?.[1];
      if (authorId) {
        filteredResults = filteredResults.filter(
          (r) => r.author?.id === authorId
        );
      }
    }

    // Apply date filters if present
    const startDateFilter = filters.find((f) => f.includes('published_at >='));
    if (startDateFilter) {
      const date = startDateFilter.match(/'([^']+)'/)?.[1];
      if (date) {
        filteredResults = filteredResults.filter(
          (r) => r.publishedAt && new Date(r.publishedAt) >= new Date(date)
        );
      }
    }

    const endDateFilter = filters.find((f) => f.includes('published_at <='));
    if (endDateFilter) {
      const date = endDateFilter.match(/'([^']+)'/)?.[1];
      if (date) {
        filteredResults = filteredResults.filter(
          (r) => r.publishedAt && new Date(r.publishedAt) <= new Date(date)
        );
      }
    }

    return {
      results: filteredResults,
      count: filteredResults.length,
    };
  } catch (error) {
    console.error('Error searching articles:', error);
    return { results: [], count: 0 };
  }
}

/**
 * Searches library items with full-text search and ranking
 */
async function searchLibraryItems(
  searchQuery: string,
  filters: string[],
  options: SearchOptions,
  pagination: SearchPagination
): Promise<{ results: SearchResult[]; count: number }> {
  if (!searchQuery) {
    return { results: [], count: 0 };
  }

  const client = options.includeContent ? getSupabaseAdmin() : supabase;

  try {
    // Build the Supabase query with filters
    let query = client
      .from('library_item_search_results')
      .select(
        `
        id,
        title,
        description,
        author,
        journal,
        item_type,
        tags,
        url,
        doi,
        publication_year,
        view_count,
        approved_at,
        created_at,
        submitter_id,
        submitter_handle,
        submitter_display_name
      `
      )
      .textSearch('search_vector', searchQuery, {
        type: 'websearch',
        config: 'english',
      });

    // Apply filters
    filters.forEach((filter) => {
      if (filter.includes('item_type IN')) {
        const types = filter
          .match(/\(([^)]+)\)/)?.[1]
          ?.split(',')
          .map((t) => t.trim().replace(/'/g, ''));
        if (types && types.length > 0) {
          query = query.in('item_type', types);
        }
      }
      if (filter.includes('submitter_id')) {
        const submitterId = filter.match(/'([^']+)'/)?.[1];
        if (submitterId) query = query.eq('submitter_id', submitterId);
      }
      if (filter.includes('approved_at >=')) {
        const date = filter.match(/'([^']+)'/)?.[1];
        if (date) query = query.gte('approved_at', date);
      }
      if (filter.includes('approved_at <=')) {
        const date = filter.match(/'([^']+)'/)?.[1];
        if (date) query = query.lte('approved_at', date);
      }
    });

    // Apply pagination and ordering
    query = query
      .range(
        pagination.offset || 0,
        (pagination.offset || 0) + (pagination.limit || 20) - 1
      )
      .order('approved_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const results: SearchResult[] = (data || []).map((row: any) => ({
      id: row.id,
      type: 'library_item' as const,
      title: row.title,
      description: row.description,
      author: row.author
        ? {
            id: row.submitter_id,
            handle: row.submitter_handle,
          }
        : undefined,
      submitter: {
        id: row.submitter_id,
        handle: row.submitter_handle,
      },
      tags: row.tags || [],
      url: row.url,
      itemType: row.item_type,
      status: 'approved', // From the view filter
      viewCount: row.view_count,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
      relevanceScore: 1.0, // Supabase handles relevance internally
      metadata: {
        itemType: row.item_type,
        author: row.author,
        journal: row.journal,
        doi: row.doi,
        publicationYear: row.publication_year,
        submissionStatus: 'approved',
      },
    }));

    return { results, count: count || 0 };
  } catch (error) {
    console.error('Error searching library items:', error);
    return { results: [], count: 0 };
  }
}

// ============================================================================
// MAIN SEARCH SERVICE
// ============================================================================

/**
 * Internal search function without caching
 */
async function _performMultiTableSearch(
  searchRequest: SearchQuery
): Promise<SearchResponse> {
  const startTime = Date.now();

  const { query, filters = {}, pagination = {}, options = {} } = searchRequest;

  // Set defaults
  const paginationSettings = {
    page: pagination.page || 1,
    limit: Math.min(pagination.limit || 20, 100), // Cap at 100 results per page
    offset:
      pagination.offset ||
      ((pagination.page || 1) - 1) * (pagination.limit || 20),
  };

  const searchOptions = {
    includeContent: options.includeContent || false,
    rankingMode: options.rankingMode || 'combined',
    fuzzySearch: options.fuzzySearch || false,
    exactPhrase: options.exactPhrase || false,
    minRelevanceScore: options.minRelevanceScore || 0,
    ...options,
  };

  // Build search query
  const searchQuery = buildSearchQuery(query, searchOptions);
  if (!searchQuery) {
    return {
      results: [],
      totalCount: 0,
      pagination: {
        page: paginationSettings.page,
        limit: paginationSettings.limit,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      searchMetadata: {
        query,
        executionTime: Date.now() - startTime,
        resultsByType: { articles: 0, library_items: 0 },
        appliedFilters: filters,
        rankingMode: searchOptions.useAdvancedRanking
          ? searchOptions.rankingMode
          : 'basic',
      },
    };
  }

  // Build filter clauses
  const filterClauses = buildFilterClause(filters);

  // Determine which content types to search
  const contentTypes = filters.contentTypes || ['articles', 'library_items'];
  const shouldSearchArticles = contentTypes.includes('articles');
  const shouldSearchLibraryItems =
    contentTypes.includes('library_items') ||
    contentTypes.includes('research_papers');

  // Execute searches in parallel
  const searchPromises: Promise<{ results: SearchResult[]; count: number }>[] =
    [];

  if (shouldSearchArticles) {
    searchPromises.push(
      searchArticles(
        searchQuery,
        filterClauses.articles,
        searchOptions,
        paginationSettings
      )
    );
  }

  if (shouldSearchLibraryItems) {
    searchPromises.push(
      searchLibraryItems(
        searchQuery,
        filterClauses.libraryItems,
        searchOptions,
        paginationSettings
      )
    );
  }

  // If no content types selected, return empty results
  if (searchPromises.length === 0) {
    return {
      results: [],
      totalCount: 0,
      pagination: {
        page: paginationSettings.page,
        limit: paginationSettings.limit,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      searchMetadata: {
        query,
        executionTime: Date.now() - startTime,
        resultsByType: { articles: 0, library_items: 0 },
        appliedFilters: filters,
        rankingMode: searchOptions.useAdvancedRanking
          ? searchOptions.rankingMode
          : 'basic',
      },
    };
  }

  try {
    const searchResults = await Promise.all(searchPromises);

    // Combine and sort results by relevance score
    let allResults: SearchResult[] = [];
    let totalCount = 0;
    let articleCount = 0;
    let libraryItemCount = 0;

    searchResults.forEach((result, index) => {
      allResults = allResults.concat(result.results);
      totalCount += result.count;

      if (index === 0 && shouldSearchArticles) {
        articleCount = result.count;
      } else if (
        (index === 1 && shouldSearchArticles) ||
        (index === 0 && !shouldSearchArticles)
      ) {
        libraryItemCount = result.count;
      }
    });

    // Apply advanced ranking if requested
    let finalResults: SearchResult[] | EnhancedSearchResult[] = allResults;

    if (searchOptions.useAdvancedRanking) {
      const rankingOptions: RankingOptions = {
        mode: searchOptions.rankingMode || 'combined',
        ...searchOptions.rankingOptions,
      };

      finalResults = await rankSearchResults(allResults, rankingOptions);
    } else {
      // Sort combined results by relevance score
      allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      finalResults = allResults;
    }

    // Apply pagination to combined results
    const startIndex = paginationSettings.offset;
    const endIndex = startIndex + paginationSettings.limit;
    const paginatedResults = finalResults.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / paginationSettings.limit);
    const hasNextPage = paginationSettings.page < totalPages;
    const hasPreviousPage = paginationSettings.page > 1;

    return {
      results: paginatedResults,
      totalCount,
      pagination: {
        page: paginationSettings.page,
        limit: paginationSettings.limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      searchMetadata: {
        query,
        executionTime: Date.now() - startTime,
        resultsByType: {
          articles: articleCount,
          library_items: libraryItemCount,
        },
        appliedFilters: filters,
        rankingMode: searchOptions.useAdvancedRanking
          ? searchOptions.rankingMode
          : 'basic',
      },
    };
  } catch (error) {
    console.error('Error performing multi-table search:', error);

    return {
      results: [],
      totalCount: 0,
      pagination: {
        page: paginationSettings.page,
        limit: paginationSettings.limit,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      searchMetadata: {
        query,
        executionTime: Date.now() - startTime,
        resultsByType: { articles: 0, library_items: 0 },
        appliedFilters: filters,
        rankingMode: searchOptions.useAdvancedRanking
          ? searchOptions.rankingMode
          : 'basic',
      },
    };
  }
}

/**
 * Performs multi-table search across articles and library items with caching and optimization
 */
export async function performMultiTableSearch(
  searchRequest: SearchQuery
): Promise<SearchResponse> {
  // Optimize the search query
  const queryOptimization = optimizeSearchQuery(searchRequest.query);

  // Use optimized query if it's different
  const optimizedRequest =
    queryOptimization.optimizedQuery !== searchRequest.query
      ? { ...searchRequest, query: queryOptimization.optimizedQuery }
      : searchRequest;

  // Apply caching to the search function
  const searchResult = await getCachedSearchResults(
    optimizedRequest,
    _performMultiTableSearch
  );

  // Add query optimization metadata
  return {
    ...searchResult,
    searchMetadata: {
      ...searchResult.searchMetadata,
      queryOptimizations: queryOptimization.optimizations,
      querySuggestions: queryOptimization.suggestions,
      originalQuery: searchRequest.query,
      optimizedQuery: queryOptimization.optimizedQuery,
    },
  };
}

/**
 * Debounced search function for real-time search interfaces
 */
async function _performDebouncedSearch(
  searchRequest: SearchQuery,
  debounceKey?: string,
  delay: number = 300
): Promise<SearchResponse> {
  const key = debounceKey || `search_${JSON.stringify(searchRequest)}`;

  return debounceSearch(
    key,
    () => performMultiTableSearch(searchRequest),
    delay
  );
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Search only articles
 */
async function _searchArticlesOnly(
  query: string,
  filters?: Omit<SearchFilters, 'contentTypes'>,
  options?: SearchOptions,
  pagination?: SearchPagination
): Promise<SearchResponse> {
  return performMultiTableSearch({
    query,
    filters: { ...filters, contentTypes: ['articles'] },
    options,
    pagination,
  });
}

/**
 * Search only library items
 */
async function _searchLibraryItemsOnly(
  query: string,
  filters?: Omit<SearchFilters, 'contentTypes'>,
  options?: SearchOptions,
  pagination?: SearchPagination
): Promise<SearchResponse> {
  return performMultiTableSearch({
    query,
    filters: { ...filters, contentTypes: ['library_items'] },
    options,
    pagination,
  });
}

/**
 * Search only research papers (library items with type='paper')
 */
async function _searchResearchPapersOnly(
  query: string,
  filters?: Omit<SearchFilters, 'contentTypes' | 'libraryItemTypes'>,
  options?: SearchOptions,
  pagination?: SearchPagination
): Promise<SearchResponse> {
  return performMultiTableSearch({
    query,
    filters: {
      ...filters,
      contentTypes: ['library_items'],
      libraryItemTypes: ['paper'],
    },
    options,
    pagination,
  });
}

// ============================================================================
// SEARCH ANALYTICS AND STATISTICS
// ============================================================================

/**
 * Log search query for analytics
 */
export async function logSearchQuery(
  query: string,
  resultCount: number,
  responseTime: number,
  userId?: string
): Promise<void> {
  try {
    const { error } = await supabase.from('search_statistics').insert({
      query,
      result_count: resultCount,
      response_time_ms: responseTime,
      user_id: userId,
    });

    if (error) {
      console.error('Error logging search query:', error);
    }
  } catch (error) {
    console.error('Error logging search query:', error);
  }
}

/**
 * Get popular search queries
 */
export async function getPopularSearchQueries(limit: number = 10): Promise<
  {
    query: string;
    count: number;
    avgResponseTime: number;
  }[]
> {
  try {
    const { data, error } = await supabase
      .from('search_statistics')
      .select('query, response_time_ms')
      .gte(
        'search_timestamp',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ) // Last 30 days
      .order('search_timestamp', { ascending: false });

    if (error) throw error;

    // Aggregate by query
    const queryStats = new Map<string, { count: number; totalTime: number }>();

    data?.forEach((row) => {
      const existing = queryStats.get(row.query) || { count: 0, totalTime: 0 };
      queryStats.set(row.query, {
        count: existing.count + 1,
        totalTime: existing.totalTime + (row.response_time_ms || 0),
      });
    });

    // Convert to array and sort by count
    return Array.from(queryStats.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting popular search queries:', error);
    return [];
  }
}
