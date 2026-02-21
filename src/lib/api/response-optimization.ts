/**
 * API Response Optimization
 * Data serialization, compression, and response formatting utilities
 */

import { ApiCache, type CacheOptions } from './cache';

/**
 * Optimized serialization for different data types
 */
export class ResponseSerializer {
  /**
   * Serialize article data for API responses
   */
  static article(article: any, includeContent: boolean = false) {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt
        ? article.excerpt.length > 300
          ? article.excerpt.substring(0, 300) + '...'
          : article.excerpt
        : null,
      coverImage: article.cover_image_url,
      tags: article.tags?.slice(0, 8) || [], // Limit tags for performance
      viewCount: article.view_count || 0,
      publishedAt: article.published_at,
      updatedAt: article.updated_at,
      status: article.status,
      isFeatured: article.is_featured || false,

      // Include content only when requested (e.g., single article view)
      ...(includeContent && article.content && { content: article.content }),

      // Author data (denormalized for performance)
      author: article.users
        ? {
            handle: article.users.handle,
            displayName: article.users.display_name,
            avatar: article.users.avatar_url,
          }
        : null,

      // Vote/rating data if available
      ...(article.vote_count !== undefined && {
        votes: {
          total: article.vote_count || 0,
          score: article.vote_score || 0,
        },
      }),

      // User-specific data if available
      ...(article.user_vote && { userVote: article.user_vote }),
    };
  }

  /**
   * Serialize user profile data
   */
  static userProfile(user: any, includeStats: boolean = false) {
    const profile = {
      id: user.id,
      handle: user.handle,
      displayName: user.display_name,
      bio: user.bio,
      avatar: user.avatar_url,
      role: user.role,
      joinedAt: user.created_at,

      // Social links
      ...(user.website_url && { website: user.website_url }),
      ...(user.twitter_handle && { twitter: user.twitter_handle }),
      ...(user.linkedin_url && { linkedin: user.linkedin_url }),
    };

    if (includeStats && user.stats) {
      profile.stats = {
        articleCount: user.stats.article_count || 0,
        totalViews: user.stats.total_views || 0,
        totalVotes: user.stats.total_votes || 0,
        averageRating: user.stats.average_rating || 0,
        xp: user.xp || 0,
        level: user.level || 1,
        badges: user.badges || [],
      };
    }

    return profile;
  }

  /**
   * Serialize affiliate library item
   */
  static affiliateItem(item: any) {
    return {
      id: item.id,
      title: item.title,
      description: item.description
        ? item.description.length > 200
          ? item.description.substring(0, 200) + '...'
          : item.description
        : null,
      type: item.type,
      url: item.url,
      affiliateUrl: item.affiliate_url,
      imageUrl: item.image_url,
      price: item.price,
      originalPrice: item.original_price,
      discount: item.discount_percentage,
      rating: item.rating,
      reviewCount: item.review_count,
      tags: item.tags?.slice(0, 5) || [],
      isFeatured: item.is_featured || false,
      isActive: item.is_active !== false,

      // Additional metadata for books
      ...(item.type === 'book' && {
        author: item.author,
        isbn: item.isbn,
        pages: item.page_count,
      }),

      // Additional metadata for tools
      ...(item.type === 'tool' && {
        category: item.category,
        platforms: item.supported_platforms,
      }),
    };
  }

  /**
   * Serialize search results
   */
  static searchResult(result: any) {
    const baseResult = {
      id: result.id,
      title: result.title,
      type: result.content_type || 'article',
      slug: result.slug,
      excerpt: result.excerpt ? result.excerpt.substring(0, 200) + '...' : null,
      relevanceScore: result.relevance_score || 0,

      // Highlight matched terms if available
      ...(result.highlighted_title && {
        highlightedTitle: result.highlighted_title,
      }),
      ...(result.highlighted_excerpt && {
        highlightedExcerpt: result.highlighted_excerpt,
      }),
    };

    // Add type-specific fields
    switch (result.content_type) {
      case 'article':
        return {
          ...baseResult,
          coverImage: result.cover_image_url,
          tags: result.tags?.slice(0, 5) || [],
          viewCount: result.view_count || 0,
          publishedAt: result.published_at,
          author: result.users
            ? {
                handle: result.users.handle,
                displayName: result.users.display_name,
              }
            : null,
        };

      case 'library_item':
        return {
          ...baseResult,
          itemType: result.type,
          url: result.url,
          rating: result.rating,
          price: result.price,
        };

      default:
        return baseResult;
    }
  }

  /**
   * Serialize dashboard statistics
   */
  static dashboardStats(stats: any) {
    return {
      overview: {
        totalArticles: stats.total_articles || 0,
        publishedArticles: stats.published_articles || 0,
        pendingArticles: stats.pending_articles || 0,
        totalUsers: stats.total_users || 0,
        totalViews: stats.total_views || 0,
        totalVotes: stats.total_votes || 0,
      },

      recent: {
        newUsersToday: stats.new_users_today || 0,
        newArticlesToday: stats.new_articles_today || 0,
        viewsToday: stats.views_today || 0,
        votesToday: stats.votes_today || 0,
      },

      trends: {
        userGrowthRate: stats.user_growth_rate || 0,
        articleGrowthRate: stats.article_growth_rate || 0,
        engagementRate: stats.engagement_rate || 0,
      },

      // Performance metrics
      performance: {
        averageResponseTime: stats.avg_response_time || 0,
        cacheHitRate: stats.cache_hit_rate || 0,
        errorRate: stats.error_rate || 0,
      },
    };
  }

  /**
   * Remove sensitive data from any object
   */
  static removeSensitiveData<T extends Record<string, any>>(data: T): T {
    const sensitiveFields = [
      'password',
      'password_hash',
      'email_verification_token',
      'reset_token',
      'private_key',
      'secret',
      'access_token',
      'refresh_token',
      'session_token',
      'ip_address',
      'user_agent',
      'internal_id',
    ];

    const cleaned = { ...data };

    sensitiveFields.forEach((field) => {
      delete cleaned[field];
    });

    // Recursively clean nested objects
    Object.keys(cleaned).forEach((key) => {
      if (
        cleaned[key] &&
        typeof cleaned[key] === 'object' &&
        !Array.isArray(cleaned[key])
      ) {
        (cleaned as any)[key] = this.removeSensitiveData(cleaned[key]);
      }
    });

    return cleaned;
  }
}

/**
 * Pagination utilities
 */
class PaginationHelper {
  /**
   * Create standardized pagination metadata
   */
  static createMetadata(
    page: number,
    limit: number,
    total: number,
    url?: string
  ) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,

      // Calculate offset for database queries
      offset: (page - 1) * limit,

      // Helper properties
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
      itemsOnPage: Math.min(limit, total - (page - 1) * limit),

      // Navigation URLs (to be populated if base URL provided)
      prevUrl: undefined as string | undefined,
      nextUrl: undefined as string | undefined,
      firstUrl: undefined as string | undefined,
      lastUrl: undefined as string | undefined,
    };

    // Add navigation URLs if base URL provided
    if (url) {
      const urlObj = new URL(url);

      if (hasPrev) {
        urlObj.searchParams.set('page', String(page - 1));
        pagination.prevUrl = urlObj.toString();
      }

      if (hasNext) {
        urlObj.searchParams.set('page', String(page + 1));
        pagination.nextUrl = urlObj.toString();
      }

      // First and last page URLs
      if (page > 2) {
        urlObj.searchParams.set('page', '1');
        pagination.firstUrl = urlObj.toString();
      }

      if (page < totalPages - 1) {
        urlObj.searchParams.set('page', String(totalPages));
        pagination.lastUrl = urlObj.toString();
      }
    }

    return pagination;
  }

  /**
   * Validate and normalize pagination parameters
   */
  static normalize(page: number, limit: number, maxLimit: number = 100) {
    const normalizedPage = Math.max(1, Math.floor(page));
    const normalizedLimit = Math.min(maxLimit, Math.max(1, Math.floor(limit)));

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      offset: (normalizedPage - 1) * normalizedLimit,
    };
  }
}

/**
 * Response compression utilities
 */
class _ResponseCompression {
  /**
   * Check if response should be compressed
   */
  static shouldCompress(data: any, minSize: number = 1024): boolean {
    const size = JSON.stringify(data).length;
    return size >= minSize;
  }

  /**
   * Get compression level based on data size
   */
  static getCompressionLevel(size: number): number {
    if (size < 10000) return 1; // Light compression for small data
    if (size < 100000) return 6; // Default compression
    return 9; // Maximum compression for large data
  }

  /**
   * Compress response if beneficial
   */
  static async compressIfNeeded(data: any): Promise<{
    data: any;
    headers: Record<string, string>;
    compressed: boolean;
  }> {
    const jsonString = JSON.stringify(data);
    const originalSize = jsonString.length;

    // Don't compress small responses
    if (!this.shouldCompress(data)) {
      return {
        data,
        headers: {
          'Content-Length': String(originalSize),
        },
        compressed: false,
      };
    }

    try {
      // Use built-in compression via Next.js middleware or edge functions
      // For now, just return uncompressed with appropriate headers
      return {
        data,
        headers: {
          'Content-Length': String(originalSize),
          'X-Uncompressed-Size': String(originalSize),
        },
        compressed: false,
      };
    } catch (error) {
      console.warn('Compression failed:', error);
      return {
        data,
        headers: {},
        compressed: false,
      };
    }
  }
}

/**
 * Standardized API response creator
 */
export class ApiResponse {
  /**
   * Create success response with data
   */
  static success<T extends Record<string, any>>(
    data: T,
    options: {
      message?: string;
      pagination?: any;
      meta?: Record<string, any>;
      cacheOptions?: CacheOptions;
      serialize?: boolean;
    } = {}
  ): Response {
    const {
      message,
      pagination,
      meta,
      cacheOptions,
      serialize = true,
    } = options;

    // Clean sensitive data if serialization is enabled
    const responseData = serialize
      ? ResponseSerializer.removeSensitiveData(data)
      : data;

    const response = {
      success: true,
      data: responseData,
      ...(message && { message }),
      ...(pagination && { pagination }),
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    };

    return ApiCache.createResponse(response, cacheOptions);
  }

  /**
   * Create paginated success response
   */
  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    options: {
      message?: string;
      meta?: Record<string, any>;
      cacheOptions?: CacheOptions;
      url?: string;
    } = {}
  ): Response {
    const paginationMeta = PaginationHelper.createMetadata(
      pagination.page,
      pagination.limit,
      pagination.total,
      options.url
    );

    return this.success(data, {
      ...options,
      pagination: paginationMeta,
    });
  }

  /**
   * Create error response
   */
  static error(message: string, status: number = 500, details?: any): Response {
    const response = {
      success: false,
      error: {
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
      },
    };

    return Response.json(response, {
      status,
      headers: ApiCache.noCache(), // Never cache error responses
    });
  }

  /**
   * Create not found response
   */
  static notFound(resource: string = 'Resource'): Response {
    return this.error(`${resource} not found`, 404);
  }

  /**
   * Create validation error response
   */
  static validationError(message: string, errors: any[]): Response {
    return this.error(message, 422, { validationErrors: errors });
  }

  /**
   * Create unauthorized response
   */
  static unauthorized(message: string = 'Authentication required'): Response {
    return this.error(message, 401);
  }

  /**
   * Create forbidden response
   */
  static forbidden(message: string = 'Insufficient permissions'): Response {
    return this.error(message, 403);
  }

  /**
   * Create rate limited response
   */
  static rateLimited(message: string = 'Rate limit exceeded'): Response {
    return Response.json(
      {
        success: false,
        error: {
          message,
          code: 'RATE_LIMITED',
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          ...ApiCache.noCache(),
          'Retry-After': '60', // Suggest retry after 60 seconds
        },
      }
    );
  }
}

/**
 * Response transformation utilities
 */
class _ResponseTransformer {
  /**
   * Transform article list response
   */
  static articleList(articles: any[], includeContent: boolean = false) {
    return articles.map((article) =>
      ResponseSerializer.article(article, includeContent)
    );
  }

  /**
   * Transform search results response
   */
  static searchResults(results: any[]) {
    return results.map((result) => ResponseSerializer.searchResult(result));
  }

  /**
   * Transform user list response
   */
  static userList(users: any[], includeStats: boolean = false) {
    return users.map((user) =>
      ResponseSerializer.userProfile(user, includeStats)
    );
  }

  /**
   * Transform affiliate library response
   */
  static affiliateLibrary(items: any[]) {
    return items.map((item) => ResponseSerializer.affiliateItem(item));
  }
}

/**
 * Response optimization middleware
 */
export function withResponseOptimization<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const start = Date.now();

    try {
      const response = await handler(...args);
      const duration = Date.now() - start;

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);

      // Add optimization headers
      if (duration < 100) {
        response.headers.set('X-Performance', 'fast');
      } else if (duration < 500) {
        response.headers.set('X-Performance', 'normal');
      } else {
        response.headers.set('X-Performance', 'slow');
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Response optimization error after ${duration}ms:`, error);
      throw error;
    }
  };
}
