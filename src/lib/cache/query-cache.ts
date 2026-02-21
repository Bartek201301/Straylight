/**
 * Query Cache Implementation for Database Operations
 * Provides in-memory caching with TTL and cache invalidation strategies
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for invalidation
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache or execute fetcher function
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.cache.get(key);
    const ttl = options.ttl || this.defaultTTL;

    // Check if cached data is still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    try {
      // Fetch fresh data
      const data = await fetcher();

      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
        tags: options.tags || [],
      });

      return data;
    } catch (error) {
      // If we have stale cached data and the fetch fails, return stale data
      if (cached) {
        console.warn(
          `Cache: Returning stale data for key ${key} due to fetch error:`,
          error
        );
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Invalidate cache entries by key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by tag
   */
  invalidateByTag(tag: string): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: string[];
    memoryUsage: number;
  } {
    const entries = Array.from(this.cache.keys());

    return {
      size: this.cache.size,
      entries,
      memoryUsage: JSON.stringify(Object.fromEntries(this.cache)).length,
    };
  }

  /**
   * Preload cache with data
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags || [],
    });
  }
}

// Global cache instance
export const queryCache = new QueryCache();

// Cache key builders for different data types
export const CacheKeys = {
  // Articles
  articles: (params: Record<string, any> = {}) =>
    `articles:${new URLSearchParams(params).toString()}`,
  articleBySlug: (slug: string) => `article:slug:${slug}`,
  popularArticles: (limit: number = 6) => `articles:popular:${limit}`,
  featuredArticles: () => 'articles:featured',

  // Users
  userById: (id: string) => `user:id:${id}`,
  userByHandle: (handle: string) => `user:handle:${handle}`,

  // Dashboard
  dashboardStats: () => 'dashboard:stats',
  adminStats: () => 'admin:stats',

  // Affiliate Library
  affiliateLibrary: (params: Record<string, any> = {}) =>
    `affiliate:${new URLSearchParams(params).toString()}`,
  featuredTools: () => 'affiliate:featured',

  // Votes
  articleVotes: (articleId: string) => `votes:article:${articleId}`,
  userVote: (userId: string, itemId: string, itemType: string) =>
    `vote:user:${userId}:${itemType}:${itemId}`,

  // Search
  searchResults: (query: string, type?: string) =>
    `search:${query}${type ? `:${type}` : ''}`,
};

// Cache tags for invalidation
export const CacheTags = {
  ARTICLES: 'articles',
  USERS: 'users',
  DASHBOARD: 'dashboard',
  AFFILIATE: 'affiliate',
  VOTES: 'votes',
  SEARCH: 'search',
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 2 * 60 * 60 * 1000, // 2 hours
};

// Auto-cleanup every 10 minutes
setInterval(
  () => {
    const cleaned = queryCache.cleanup();
    if (cleaned > 0) {
      console.log(`Cache: Cleaned up ${cleaned} expired entries`);
    }
  },
  10 * 60 * 1000
);
