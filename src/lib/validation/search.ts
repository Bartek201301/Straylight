// ============================================================================
// SEARCH API VALIDATION SCHEMAS
// ============================================================================
// Zod validation schemas for search API endpoints including query parameters,
// filters, pagination, and search suggestions.
// ============================================================================

import { z } from 'zod';

// ============================================================================
// BASIC SEARCH VALIDATION
// ============================================================================

export const searchQuerySchema = z.object({
  // Required search query
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(500, 'Search query too long'),

  // Content type filters
  types: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined))
    .refine(
      (types) =>
        !types ||
        types.every((t) =>
          ['articles', 'library_items', 'research_papers'].includes(t)
        ),
      'Invalid content type. Must be one of: articles, library_items, research_papers'
    ),

  // Article status filters
  article_status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((s) => s.trim()) : undefined))
    .refine(
      (statuses) =>
        !statuses ||
        statuses.every((s) =>
          ['draft', 'pending', 'published', 'archived'].includes(s)
        ),
      'Invalid article status. Must be one of: draft, pending, published, archived'
    ),

  // Library item type filters
  library_types: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((t) => t.trim()) : undefined))
    .refine(
      (types) =>
        !types ||
        types.every((t) =>
          [
            'paper',
            'book',
            'video',
            'article',
            'website',
            'tool',
            'dataset',
          ].includes(t)
        ),
      'Invalid library item type'
    ),

  // Library item status filters
  library_status: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((s) => s.trim()) : undefined))
    .refine(
      (statuses) =>
        !statuses ||
        statuses.every((s) => ['pending', 'approved', 'rejected'].includes(s)),
      'Invalid library item status. Must be one of: pending, approved, rejected'
    ),

  // Tag filters
  tags: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : undefined
    ),

  // Date range filters
  date_start: z
    .string()
    .optional()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Invalid start date format'
    ),

  date_end: z
    .string()
    .optional()
    .refine(
      (date) => !date || !isNaN(Date.parse(date)),
      'Invalid end date format'
    ),

  // Author/submitter filters
  author_id: z.string().uuid('Invalid author ID').optional(),
  submitter_id: z.string().uuid('Invalid submitter ID').optional(),

  // Pagination
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((page) => page >= 1, 'Page must be at least 1'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine(
      (limit) => limit >= 1 && limit <= 100,
      'Limit must be between 1 and 100'
    ),

  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((offset) => !offset || offset >= 0, 'Offset must be non-negative'),

  // Search options
  include_content: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  ranking_mode: z
    .enum(['relevance', 'popularity', 'recent', 'combined', 'quality'])
    .optional()
    .default('combined'),

  fuzzy_search: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  exact_phrase: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  min_relevance: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (score) => !score || (score >= 0 && score <= 1),
      'Min relevance must be between 0 and 1'
    ),

  use_advanced_ranking: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

// ============================================================================
// SEARCH SUGGESTIONS VALIDATION
// ============================================================================

const searchSuggestionsSchema = z.object({
  // Partial query for suggestions
  q: z.string().min(1, 'Query is required').max(100, 'Query too long'),

  // Number of suggestions to return
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5))
    .refine(
      (limit) => limit >= 1 && limit <= 20,
      'Limit must be between 1 and 20'
    ),

  // Content types to suggest from
  types: z
    .string()
    .optional()
    .transform((val) =>
      val ? val.split(',').map((t) => t.trim()) : ['articles', 'library_items']
    )
    .refine(
      (types) =>
        types.every((t) =>
          ['articles', 'library_items', 'research_papers'].includes(t)
        ),
      'Invalid content type for suggestions'
    ),
});

// ============================================================================
// AUTOCOMPLETE VALIDATION
// ============================================================================

const autocompleteSchema = z.object({
  // Field to autocomplete (e.g., 'tags', 'authors', 'titles')
  field: z.enum(['tags', 'authors', 'titles', 'journals']).default('tags'),

  // Query to match against
  q: z.string().min(1, 'Query is required').max(50, 'Query too long'),

  // Number of completions to return
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine(
      (limit) => limit >= 1 && limit <= 50,
      'Limit must be between 1 and 50'
    ),
});

// ============================================================================
// SEARCH ANALYTICS VALIDATION
// ============================================================================

const searchAnalyticsSchema = z.object({
  // Time period for analytics
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),

  // Number of top queries to return
  top_queries_limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine(
      (limit) => limit >= 1 && limit <= 100,
      'Top queries limit must be between 1 and 100'
    ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SearchQueryParams = z.infer<typeof searchQuerySchema>;
type SearchSuggestionsParams = z.infer<typeof searchSuggestionsSchema>;
type AutocompleteParams = z.infer<typeof autocompleteSchema>;
type SearchAnalyticsParams = z.infer<typeof searchAnalyticsSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates and transforms search query parameters
 */
export function validateSearchQuery(
  searchParams: URLSearchParams
): SearchQueryParams {
  const params = Object.fromEntries(searchParams.entries());
  return searchQuerySchema.parse(params);
}

/**
 * Validates search suggestions parameters
 */
export function validateSuggestionsQuery(
  searchParams: URLSearchParams
): SearchSuggestionsParams {
  const params = Object.fromEntries(searchParams.entries());
  return searchSuggestionsSchema.parse(params);
}

/**
 * Validates autocomplete parameters
 */
export function validateAutocompleteQuery(
  searchParams: URLSearchParams
): AutocompleteParams {
  const params = Object.fromEntries(searchParams.entries());
  return autocompleteSchema.parse(params);
}

/**
 * Validates search analytics parameters
 */
export function validateAnalyticsQuery(
  searchParams: URLSearchParams
): SearchAnalyticsParams {
  const params = Object.fromEntries(searchParams.entries());
  return searchAnalyticsSchema.parse(params);
}
