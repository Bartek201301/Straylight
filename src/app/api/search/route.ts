// ============================================================================
// SEARCH API ENDPOINT
// ============================================================================
// Main search endpoint that handles full-text search across articles and
// library items with advanced filtering, ranking, and pagination support.
// ============================================================================

import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  ValidationError,
} from '@/lib/errors/api-errors';
import {
  validateSearchQuery,
  type SearchQueryParams,
} from '@/lib/validation/search';
import {
  performMultiTableSearch,
  logSearchQuery,
  type SearchFilters,
  type SearchOptions,
  type SearchPagination,
} from '@/lib/services/search-service';
import { recordSearchPerformance } from '@/lib/services/search-performance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// MAIN SEARCH ENDPOINT
// ============================================================================

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validatedParams = validateSearchQuery(searchParams);

    // Transform validated parameters to search service format
    const searchRequest = transformParamsToSearchRequest(validatedParams);

    // Perform the search
    const searchResponse = await performMultiTableSearch(searchRequest);
    const responseTime = Date.now() - startTime;

    // Record performance metrics
    recordSearchPerformance(validatedParams.q, responseTime, true);

    // Log the search query for analytics
    await logSearchQuery(
      validatedParams.q,
      searchResponse.totalCount,
      responseTime,
      undefined // TODO: Add user ID when auth context is available
    );

    // Format the response
    const responseData = {
      results: searchResponse.results,
      query: validatedParams.q,
      totalCount: searchResponse.totalCount,
      pagination: {
        ...searchResponse.pagination,
        hasMore: searchResponse.pagination.hasNextPage,
      },
      metadata: {
        ...searchResponse.searchMetadata,
        requestId,
        responseTime: Date.now() - startTime,
      },
      filters: searchRequest.filters,
      options: {
        rankingMode: validatedParams.ranking_mode,
        useAdvancedRanking: validatedParams.use_advanced_ranking,
        includeContent: validatedParams.include_content,
        fuzzySearch: validatedParams.fuzzy_search,
        exactPhrase: validatedParams.exact_phrase,
      },
    };

    return createSuccessResponse(
      responseData,
      `Found ${searchResponse.totalCount} results`,
      requestId
    );
  } catch (error) {
    // Record failed search performance
    const responseTime = Date.now() - startTime;

    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('q') || '';
      if (query) {
        recordSearchPerformance(query, responseTime, false);
        await logSearchQuery(query, 0, responseTime);
      }
    } catch (logError) {
      console.error('Failed to log failed search:', logError);
    }

    return handleAPIError(error, requestId);
  }
}

// ============================================================================
// SEARCH SUGGESTIONS ENDPOINT
// ============================================================================

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();

    if (!body.action) {
      throw new ValidationError('Action is required');
    }

    switch (body.action) {
      case 'suggestions':
        return await handleSearchSuggestions(body, requestId);
      case 'autocomplete':
        return await handleAutocomplete(body, requestId);
      case 'analytics':
        return await handleSearchAnalytics(body, requestId);
      default:
        throw new ValidationError(`Unknown action: ${body.action}`);
    }
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transforms validated query parameters to search service format
 */
function transformParamsToSearchRequest(params: SearchQueryParams) {
  // Build filters
  const filters: SearchFilters = {
    contentTypes: params.types as
      | ('articles' | 'library_items' | 'research_papers')[]
      | undefined,
    articleStatus: params.article_status as
      | ('draft' | 'pending' | 'published' | 'archived')[]
      | undefined,
    libraryItemTypes: params.library_types as
      | (
          | 'paper'
          | 'book'
          | 'video'
          | 'article'
          | 'website'
          | 'tool'
          | 'dataset'
        )[]
      | undefined,
    libraryItemStatus: params.library_status as
      | ('pending' | 'approved' | 'rejected')[]
      | undefined,
    tags: params.tags,
    authorId: params.author_id,
    submitterId: params.submitter_id,
  };

  // Add date range filter if provided
  if (params.date_start || params.date_end) {
    filters.dateRange = {
      start: params.date_start,
      end: params.date_end,
    };
  }

  // Build pagination
  const pagination: SearchPagination = {
    page: params.page,
    limit: params.limit,
  };

  // Use offset if provided, otherwise calculate from page
  if (params.offset !== undefined) {
    pagination.offset = params.offset;
  }

  // Build search options
  const options: SearchOptions = {
    includeContent: params.include_content,
    rankingMode: params.ranking_mode,
    fuzzySearch: params.fuzzy_search,
    exactPhrase: params.exact_phrase,
    minRelevanceScore: params.min_relevance,
    useAdvancedRanking: params.use_advanced_ranking,
  };

  return {
    query: params.q,
    filters,
    pagination,
    options,
  };
}

/**
 * Handles search suggestions requests
 */
async function handleSearchSuggestions(body: any, requestId: string) {
  const { getPopularSearchQueries } = await import(
    '@/lib/services/search-service'
  );

  // For now, return popular queries as suggestions
  // TODO: Implement smart suggestions based on content analysis
  const suggestions = await getPopularSearchQueries(body.limit || 5);

  return createSuccessResponse(
    {
      suggestions: suggestions.map((s) => ({
        query: s.query,
        frequency: s.count,
        avgResponseTime: s.avgResponseTime,
      })),
      query: body.q || '',
      type: 'popular_queries',
    },
    'Search suggestions retrieved',
    requestId
  );
}

/**
 * Handles autocomplete requests
 */
async function handleAutocomplete(body: any, requestId: string) {
  const { supabase } = await import('@/lib/supabase');

  const { field, q, limit } = body;

  let autocompleteResults: string[] = [];

  try {
    switch (field) {
      case 'tags':
        // Get tags that start with the query
        const { data: articles } = await supabase
          .from('articles')
          .select('tags')
          .eq('status', 'published');

        const { data: libraryItems } = await supabase
          .from('library_items')
          .select('tags')
          .eq('submission_status', 'approved');

        // Collect all tags and filter by query
        const allTags = new Set<string>();
        [...(articles || []), ...(libraryItems || [])].forEach((item) => {
          item.tags?.forEach((tag: string) => {
            if (tag.toLowerCase().includes(q.toLowerCase())) {
              allTags.add(tag);
            }
          });
        });

        autocompleteResults = Array.from(allTags).slice(0, limit);
        break;

      case 'authors':
        // Get author names/handles that match the query
        const { data: users } = await supabase
          .from('users')
          .select('handle, display_name')
          .or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`)
          .limit(limit);

        autocompleteResults = (users || []).map(
          (user) => user.display_name || user.handle
        );
        break;

      case 'titles':
        // Get article and library item titles that match
        const { data: articleTitles } = await supabase
          .from('articles')
          .select('title')
          .ilike('title', `%${q}%`)
          .eq('status', 'published')
          .limit(limit);

        autocompleteResults = (articleTitles || []).map((item) => item.title);
        break;

      case 'journals':
        // Get journal names from library items
        const { data: journals } = await supabase
          .from('library_items')
          .select('journal')
          .ilike('journal', `%${q}%`)
          .eq('submission_status', 'approved')
          .not('journal', 'is', null)
          .limit(limit);

        autocompleteResults = Array.from(
          new Set((journals || []).map((item) => item.journal).filter(Boolean))
        );
        break;

      default:
        throw new ValidationError(`Unsupported autocomplete field: ${field}`);
    }
  } catch (error) {
    console.error(`Autocomplete error for field ${field}:`, error);
    // Return empty results on error rather than failing
    autocompleteResults = [];
  }

  return createSuccessResponse(
    {
      completions: autocompleteResults,
      field,
      query: q,
      count: autocompleteResults.length,
    },
    'Autocomplete results retrieved',
    requestId
  );
}

/**
 * Handles search analytics requests
 */
async function handleSearchAnalytics(body: any, requestId: string) {
  const { getPopularSearchQueries } = await import(
    '@/lib/services/search-service'
  );
  const { supabase } = await import('@/lib/supabase');

  const { period = 'week', top_queries_limit = 10 } = body;

  // Calculate date range based on period
  const now = new Date();
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const startDate = new Date(
    now.getTime() - periodMs[period as keyof typeof periodMs]
  );

  try {
    // Get search statistics for the period
    const { data: searchStats, error } = await supabase
      .from('search_statistics')
      .select('query, result_count, response_time_ms, search_timestamp')
      .gte('search_timestamp', startDate.toISOString())
      .order('search_timestamp', { ascending: false });

    if (error) throw error;

    // Get popular queries
    const popularQueries = await getPopularSearchQueries(top_queries_limit);

    // Calculate analytics
    const totalSearches = searchStats?.length || 0;
    const avgResponseTime =
      totalSearches > 0
        ? (searchStats?.reduce(
            (sum, stat) => sum + (stat.response_time_ms || 0),
            0
          ) || 0) / totalSearches
        : 0;

    const avgResultCount =
      totalSearches > 0
        ? (searchStats?.reduce(
            (sum, stat) => sum + (stat.result_count || 0),
            0
          ) || 0) / totalSearches
        : 0;

    return createSuccessResponse(
      {
        period,
        totalSearches,
        avgResponseTime: Math.round(avgResponseTime),
        avgResultCount: Math.round(avgResultCount * 10) / 10,
        popularQueries,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      },
      'Search analytics retrieved',
      requestId
    );
  } catch (error) {
    console.error('Search analytics error:', error);

    // Return basic analytics on error
    return createSuccessResponse(
      {
        period,
        totalSearches: 0,
        avgResponseTime: 0,
        avgResultCount: 0,
        popularQueries: [],
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
        error: 'Failed to retrieve detailed analytics',
      },
      'Basic search analytics retrieved',
      requestId
    );
  }
}
