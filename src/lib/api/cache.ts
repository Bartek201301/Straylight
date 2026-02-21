/**
 * API Response Caching System
 * Provides HTTP cache headers and response optimization for API routes
 */

export interface CacheOptions {
  maxAge?: number; // Cache duration in seconds
  staleWhileRevalidate?: number; // Stale-while-revalidate duration in seconds
  private?: boolean; // Whether cache is private (user-specific)
  mustRevalidate?: boolean; // Force revalidation
  noCache?: boolean; // Disable caching entirely
  etag?: boolean; // Generate ETag for conditional requests
  vary?: string[]; // Vary headers for cache keying
}

export class ApiCache {
  /**
   * Generate cache headers for successful responses
   */
  static headers(options: CacheOptions = {}): Record<string, string> {
    const {
      maxAge = 300, // 5 minutes default
      staleWhileRevalidate,
      private: isPrivate = false,
      mustRevalidate = false,
      noCache = false,
      vary = ['Accept-Encoding'],
    } = options;

    if (noCache) {
      return this.noCache();
    }

    const cacheDirectives: string[] = [];

    // Set cache visibility
    cacheDirectives.push(isPrivate ? 'private' : 'public');

    // Set max age
    cacheDirectives.push(`max-age=${maxAge}`);

    // Add stale-while-revalidate if specified
    if (staleWhileRevalidate) {
      cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    // Add must-revalidate if specified
    if (mustRevalidate) {
      cacheDirectives.push('must-revalidate');
    }

    const headers: Record<string, string> = {
      'Cache-Control': cacheDirectives.join(', '),
      Vary: vary.join(', '),
    };

    // Add CDN-specific cache headers for public content
    if (!isPrivate) {
      headers['CDN-Cache-Control'] = `public, max-age=${maxAge * 2}`;
      headers['Surrogate-Control'] = `max-age=${maxAge * 10}`;
    }

    return headers;
  }

  /**
   * Headers for no-cache responses (dynamic, user-specific content)
   */
  static noCache(): Record<string, string> {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };
  }

  /**
   * Headers for long-term cached content (static/rarely changing)
   */
  static longTerm(maxAge: number = 86400): Record<string, string> {
    return this.headers({
      maxAge,
      staleWhileRevalidate: maxAge * 2,
      mustRevalidate: false,
    });
  }

  /**
   * Headers for short-term cached content (frequently changing)
   */
  static shortTerm(maxAge: number = 60): Record<string, string> {
    return this.headers({
      maxAge,
      staleWhileRevalidate: maxAge * 2,
      mustRevalidate: true,
    });
  }

  /**
   * Headers for user-specific content
   */
  static private(maxAge: number = 300): Record<string, string> {
    return this.headers({
      maxAge,
      private: true,
      vary: ['Accept-Encoding', 'Authorization'],
    });
  }

  /**
   * Generate ETag for response content
   */
  static generateETag(content: any): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(typeof content === 'string' ? content : JSON.stringify(content))
      .digest('hex');
    return `"${hash}"`;
  }

  /**
   * Check if request matches ETag (conditional GET)
   */
  static checkETag(request: Request, content: any): string | null {
    const etag = this.generateETag(content);
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch === etag) {
      return etag;
    }

    return null;
  }

  /**
   * Create cached response with proper headers
   */
  static createResponse(
    data: any,
    options: CacheOptions & { status?: number } = {}
  ): Response {
    const { status = 200, etag = false, ...cacheOptions } = options;

    // Check for ETag match (304 Not Modified)
    if (etag) {
      const headers = {
        ...this.headers(cacheOptions),
        ETag: this.generateETag(data),
      };

      return Response.json(data, { status, headers });
    }

    return Response.json(data, {
      status,
      headers: this.headers(cacheOptions),
    });
  }

  /**
   * Create 304 Not Modified response
   */
  static notModified(etag: string): Response {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}

/**
 * Cache configuration presets for different content types
 */
export const CachePresets = {
  // Articles and content (5 minutes, revalidate on stale)
  ARTICLES: {
    maxAge: 300,
    staleWhileRevalidate: 600,
    etag: true,
  },

  // Popular/trending content (2 minutes, must revalidate)
  POPULAR: {
    maxAge: 120,
    staleWhileRevalidate: 300,
    mustRevalidate: true,
    etag: true,
  },

  // Search results (1 minute, user-specific)
  SEARCH: {
    maxAge: 60,
    private: true,
    vary: ['Accept-Encoding', 'Authorization', 'User-Agent'],
  },

  // User profile data (5 minutes, private)
  USER_PROFILE: {
    maxAge: 300,
    private: true,
    etag: true,
  },

  // Admin dashboard (30 seconds, no stale)
  ADMIN_DASHBOARD: {
    maxAge: 30,
    mustRevalidate: true,
    private: true,
  },

  // Static configuration (1 hour, long stale)
  STATIC_CONFIG: {
    maxAge: 3600,
    staleWhileRevalidate: 7200,
    etag: true,
  },

  // Real-time data (no cache)
  REALTIME: {
    noCache: true,
  },

  // Analytics data (10 minutes, private)
  ANALYTICS: {
    maxAge: 600,
    private: true,
    mustRevalidate: true,
  },
};

/**
 * Conditional caching based on request context
 */
class _ConditionalCache {
  /**
   * Determine cache strategy based on user authentication
   */
  static forUser(
    isAuthenticated: boolean,
    isAdmin: boolean = false
  ): CacheOptions {
    if (isAdmin) {
      return CachePresets.ADMIN_DASHBOARD;
    }

    if (isAuthenticated) {
      return CachePresets.USER_PROFILE;
    }

    return CachePresets.ARTICLES;
  }

  /**
   * Determine cache strategy based on content type
   */
  static forContentType(
    type:
      | 'articles'
      | 'search'
      | 'popular'
      | 'static'
      | 'analytics'
      | 'realtime'
  ): CacheOptions {
    switch (type) {
      case 'articles':
        return CachePresets.ARTICLES;
      case 'search':
        return CachePresets.SEARCH;
      case 'popular':
        return CachePresets.POPULAR;
      case 'static':
        return CachePresets.STATIC_CONFIG;
      case 'analytics':
        return CachePresets.ANALYTICS;
      case 'realtime':
        return CachePresets.REALTIME;
      default:
        return CachePresets.ARTICLES;
    }
  }

  /**
   * Determine cache strategy based on data freshness requirements
   */
  static forFreshness(level: 'high' | 'medium' | 'low'): CacheOptions {
    switch (level) {
      case 'high':
        return { maxAge: 30, mustRevalidate: true };
      case 'medium':
        return { maxAge: 300, staleWhileRevalidate: 600 };
      case 'low':
        return { maxAge: 3600, staleWhileRevalidate: 7200 };
      default:
        return CachePresets.ARTICLES;
    }
  }
}

/**
 * Cache invalidation helpers
 */
class _CacheInvalidation {
  /**
   * Generate cache tags for content-based invalidation
   */
  static generateTags(content: {
    type?: string;
    id?: string;
    userId?: string;
    tags?: string[];
  }): string[] {
    const cacheTags: string[] = [];

    if (content.type) {
      cacheTags.push(`type:${content.type}`);
    }

    if (content.id) {
      cacheTags.push(`id:${content.id}`);
    }

    if (content.userId) {
      cacheTags.push(`user:${content.userId}`);
    }

    if (content.tags) {
      content.tags.forEach((tag) => cacheTags.push(`tag:${tag}`));
    }

    return cacheTags;
  }

  /**
   * Headers for cache invalidation
   */
  static invalidationHeaders(tags: string[]): Record<string, string> {
    return {
      'Cache-Tags': tags.join(','),
      'Surrogate-Key': tags.join(' '),
    };
  }
}
