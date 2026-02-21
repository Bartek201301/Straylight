// ============================================================================
// SEARCH PERFORMANCE OPTIMIZATION SERVICE
// ============================================================================
// This service provides caching, query optimization, and performance
// monitoring for search functionality to improve response times and
// reduce database load.
// ============================================================================

import type { SearchQuery, SearchResponse } from './search-service';

// ============================================================================
// CACHE TYPES AND INTERFACES
// ============================================================================

interface CacheConfig {
  defaultTTL: number; // Time to live in seconds
  maxCacheSize: number; // Maximum number of cached items
  popularQueryTTL: number; // TTL for popular queries
  autocompleteCache: boolean; // Enable autocomplete caching
  searchAnalyticsCache: boolean; // Enable analytics caching
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  slowQueries: Array<{
    query: string;
    responseTime: number;
    timestamp: number;
  }>;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 300, // 5 minutes
  maxCacheSize: 1000,
  popularQueryTTL: 1800, // 30 minutes for popular queries
  autocompleteCache: true,
  searchAnalyticsCache: true,
};

// ============================================================================
// IN-MEMORY CACHE IMPLEMENTATION
// ============================================================================
// Note: In production, this should be replaced with Redis or similar

class InMemoryCache {
  private cache = new Map<string, CacheEntry>();
  public config: CacheConfig;
  public metrics: PerformanceMetrics;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      slowQueries: [],
    };
  }

  /**
   * Gets a cached item if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    this.metrics.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    // Update access statistics
    entry.hitCount++;
    entry.lastAccessed = now;
    this.metrics.cacheHits++;

    return entry.data;
  }

  /**
   * Sets a cached item with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;

    // If cache is full, remove least recently used items
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL,
      hitCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Deletes a cached item
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats() {
    const hitRate =
      this.metrics.totalRequests > 0
        ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100
        : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      maxCacheSize: this.config.maxCacheSize,
    };
  }

  /**
   * Evicts least recently used items when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Cleans up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// GLOBAL CACHE INSTANCE
// ============================================================================

const searchCache = new InMemoryCache();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    searchCache.cleanup();
  },
  5 * 60 * 1000
);

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

/**
 * Generates a cache key for search requests
 */
function generateSearchCacheKey(searchRequest: SearchQuery): string {
  const { query, filters = {}, pagination = {}, options = {} } = searchRequest;

  // Create a stable key from search parameters
  const keyParts = [
    'search',
    query.toLowerCase().trim(),
    JSON.stringify(filters),
    `page:${pagination.page || 1}`,
    `limit:${pagination.limit || 20}`,
    JSON.stringify(options),
  ];

  return keyParts.join('|');
}

/**
 * Generates a cache key for autocomplete requests
 */
function generateAutocompleteCacheKey(
  field: string,
  query: string,
  limit: number
): string {
  return `autocomplete|${field}|${query.toLowerCase()}|${limit}`;
}

/**
 * Generates a cache key for suggestions
 */
function generateSuggestionsCacheKey(
  query: string,
  limit: number,
  types: string[]
): string {
  return `suggestions|${query.toLowerCase()}|${limit}|${types.sort().join(',')}`;
}

/**
 * Generates a cache key for analytics
 */
function generateAnalyticsCacheKey(period: string, limit: number): string {
  // Include hour for short-term caching
  const hour = Math.floor(Date.now() / (60 * 60 * 1000));
  return `analytics|${period}|${limit}|${hour}`;
}

// ============================================================================
// SEARCH CACHING FUNCTIONS
// ============================================================================

/**
 * Cached search wrapper
 */
export async function getCachedSearchResults(
  searchRequest: SearchQuery,
  searchFunction: (request: SearchQuery) => Promise<SearchResponse>
): Promise<SearchResponse> {
  const startTime = Date.now();
  const cacheKey = generateSearchCacheKey(searchRequest);

  // Try to get from cache first
  const cachedResult = searchCache.get<SearchResponse>(cacheKey);
  if (cachedResult) {
    // Add cache metadata
    return {
      ...cachedResult,
      searchMetadata: {
        ...cachedResult.searchMetadata,
        cached: true,
        cacheHit: true,
        executionTime: Date.now() - startTime,
      },
    };
  }

  // Execute search if not cached
  const searchResult = await searchFunction(searchRequest);
  const responseTime = Date.now() - startTime;

  // Track performance metrics
  trackSearchPerformance(searchRequest.query, responseTime);

  // Determine cache TTL based on query characteristics
  const cacheTTL = determineCacheTTL(searchRequest, searchResult);

  // Cache the result
  searchCache.set(cacheKey, searchResult, cacheTTL);

  // Add metadata
  return {
    ...searchResult,
    searchMetadata: {
      ...searchResult.searchMetadata,
      cached: false,
      cacheHit: false,
    },
  };
}

/**
 * Cached autocomplete wrapper
 */
async function _getCachedAutocomplete<T>(
  field: string,
  query: string,
  limit: number,
  autocompleteFunction: (
    field: string,
    query: string,
    limit: number
  ) => Promise<T>
): Promise<T> {
  if (!searchCache.config?.autocompleteCache) {
    return autocompleteFunction(field, query, limit);
  }

  const cacheKey = generateAutocompleteCacheKey(field, query, limit);

  const cachedResult = searchCache.get<T>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await autocompleteFunction(field, query, limit);

  // Cache autocomplete for longer since it changes less frequently
  searchCache.set(cacheKey, result, 600); // 10 minutes

  return result;
}

/**
 * Cached suggestions wrapper
 */
async function _getCachedSuggestions<T>(
  query: string,
  limit: number,
  types: string[],
  suggestionsFunction: (
    query: string,
    limit: number,
    types: string[]
  ) => Promise<T>
): Promise<T> {
  const cacheKey = generateSuggestionsCacheKey(query, limit, types);

  const cachedResult = searchCache.get<T>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await suggestionsFunction(query, limit, types);

  // Cache suggestions for shorter time since they should be fresh
  searchCache.set(cacheKey, result, 180); // 3 minutes

  return result;
}

/**
 * Cached analytics wrapper
 */
async function _getCachedAnalytics<T>(
  period: string,
  limit: number,
  analyticsFunction: (period: string, limit: number) => Promise<T>
): Promise<T> {
  if (!searchCache.config?.searchAnalyticsCache) {
    return analyticsFunction(period, limit);
  }

  const cacheKey = generateAnalyticsCacheKey(period, limit);

  const cachedResult = searchCache.get<T>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await analyticsFunction(period, limit);

  // Cache analytics based on period
  const analyticsTTL = period === 'day' ? 300 : period === 'week' ? 900 : 1800;
  searchCache.set(cacheKey, result, analyticsTTL);

  return result;
}

// ============================================================================
// PERFORMANCE OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Determines optimal cache TTL based on search characteristics
 */
function determineCacheTTL(
  searchRequest: SearchQuery,
  searchResult: SearchResponse
): number {
  const { query, options = {} } = searchRequest;
  const { totalCount } = searchResult;

  // Popular queries get longer cache time
  if (isPopularQuery(query)) {
    return searchCache.config.popularQueryTTL;
  }

  // Exact phrase searches get longer cache (more stable)
  if (options.exactPhrase) {
    return 900; // 15 minutes
  }

  // Large result sets get shorter cache (more likely to change)
  if (totalCount > 100) {
    return 180; // 3 minutes
  }

  // Small result sets get longer cache
  if (totalCount < 10) {
    return 600; // 10 minutes
  }

  return searchCache.config.defaultTTL;
}

/**
 * Checks if a query is popular based on simple heuristics
 */
function isPopularQuery(query: string): boolean {
  // Simple heuristics - in production, this should check actual query frequency
  const commonTerms = [
    'javascript',
    'python',
    'react',
    'vue',
    'angular',
    'node',
    'typescript',
    'ai',
    'ml',
    'data',
  ];
  const lowerQuery = query.toLowerCase();

  return (
    commonTerms.some((term) => lowerQuery.includes(term)) || query.length <= 3
  );
}

/**
 * Tracks search performance metrics
 */
function trackSearchPerformance(query: string, responseTime: number): void {
  const metrics = searchCache.metrics;

  // Update average response time
  const totalTime =
    metrics.avgResponseTime * (metrics.totalRequests - 1) + responseTime;
  metrics.avgResponseTime = totalTime / metrics.totalRequests;

  // Track slow queries (over 2 seconds)
  if (responseTime > 2000) {
    metrics.slowQueries.push({
      query,
      responseTime,
      timestamp: Date.now(),
    });

    // Keep only last 100 slow queries
    if (metrics.slowQueries.length > 100) {
      metrics.slowQueries = metrics.slowQueries.slice(-100);
    }
  }
}

// ============================================================================
// QUERY OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Optimizes search query for better performance
 */
export function optimizeSearchQuery(query: string): {
  optimizedQuery: string;
  suggestions: string[];
  optimizations: string[];
} {
  const optimizations: string[] = [];
  const suggestions: string[] = [];
  let optimizedQuery = query.trim();

  // Remove excessive whitespace
  if (optimizedQuery !== optimizedQuery.replace(/\s+/g, ' ')) {
    optimizedQuery = optimizedQuery.replace(/\s+/g, ' ');
    optimizations.push('normalized_whitespace');
  }

  // Handle common typos and variations
  const commonReplacements: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    ai: 'artificial intelligence',
    ml: 'machine learning',
    dl: 'deep learning',
  };

  const words = optimizedQuery.toLowerCase().split(' ');
  const replacedWords = words.map((word) => commonReplacements[word] || word);

  if (JSON.stringify(words) !== JSON.stringify(replacedWords)) {
    suggestions.push(`Did you mean: "${replacedWords.join(' ')}"?`);
  }

  // Suggest more specific terms for very short queries
  if (optimizedQuery.length <= 2) {
    suggestions.push('Try using more specific terms for better results');
  }

  // Suggest using quotes for exact phrases
  if (optimizedQuery.includes(' ') && !optimizedQuery.includes('"')) {
    suggestions.push(`Try "${optimizedQuery}" for exact phrase matching`);
  }

  return {
    optimizedQuery,
    suggestions,
    optimizations,
  };
}

/**
 * Pre-warms cache with popular searches
 */
async function _preWarmCache(
  popularQueries: string[],
  searchFunction: (request: SearchQuery) => Promise<SearchResponse>
): Promise<void> {
  console.log('Pre-warming search cache...');

  const preWarmPromises = popularQueries.slice(0, 20).map(async (query) => {
    try {
      const searchRequest: SearchQuery = {
        query,
        filters: {},
        pagination: { page: 1, limit: 20 },
        options: { rankingMode: 'combined' },
      };

      // Only pre-warm if not already cached
      const cacheKey = generateSearchCacheKey(searchRequest);
      if (!searchCache.get(cacheKey)) {
        await getCachedSearchResults(searchRequest, searchFunction);
      }
    } catch (error) {
      console.error(`Failed to pre-warm cache for query "${query}":`, error);
    }
  });

  await Promise.all(preWarmPromises);
  console.log(`Pre-warmed cache with ${popularQueries.length} popular queries`);
}

// ============================================================================
// CACHE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Gets cache statistics and performance metrics
 */
export function getCacheStats() {
  return searchCache.getStats();
}

/**
 * Clears all cached data
 */
export function clearCache(): void {
  searchCache.clear();
}

/**
 * Invalidates cache entries matching a pattern
 */
export function invalidateCachePattern(pattern: string): number {
  let deletedCount = 0;
  const regex = new RegExp(pattern, 'i');

  for (const key of Array.from(searchCache['cache'].keys())) {
    if (regex.test(key)) {
      searchCache.delete(key);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Configures cache settings
 */
function _configureCaching(config: Partial<CacheConfig>): void {
  Object.assign(searchCache.config, config);
}

// ============================================================================
// DEBOUNCING UTILITIES
// ============================================================================

const debouncedFunctions = new Map<
  string,
  {
    timeout: NodeJS.Timeout;
    promise: Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }
>();

/**
 * Debounces search requests to prevent excessive API calls
 */
export function debounceSearch<T>(
  key: string,
  searchFunction: () => Promise<T>,
  delay: number = 300
): Promise<T> {
  // Cancel existing timeout for this key
  const existing = debouncedFunctions.get(key);
  if (existing) {
    clearTimeout(existing.timeout);
    existing.reject(new Error('Request debounced'));
  }

  // Create new debounced promise
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(async () => {
      try {
        const result = await searchFunction();
        resolve(result);
        debouncedFunctions.delete(key);
      } catch (error) {
        reject(error);
        debouncedFunctions.delete(key);
      }
    }, delay);

    debouncedFunctions.set(key, {
      timeout,
      promise: Promise.resolve(),
      resolve,
      reject,
    });
  });
}
