/**
 * API Rate Limiting System
 * In-memory and Redis-based rate limiting with multiple strategies
 */

import { NextRequest } from 'next/server';
import { RateLimitError } from './error-handling';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * In-memory rate limiter (for development and single-instance deployments)
 */
class MemoryRateLimiter {
  private store = new Map<
    string,
    { count: number; resetTime: number; requests: number[] }
  >();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const resetTime = now + config.windowMs;

    let record = this.store.get(key);

    if (!record) {
      record = { count: 0, resetTime, requests: [] };
      this.store.set(key, record);
    }

    // Check if window has expired
    if (now >= record.resetTime) {
      record.count = 0;
      record.resetTime = resetTime;
      record.requests = [];
    }

    // For sliding window, remove old requests
    const cutoff = now - config.windowMs;
    record.requests = record.requests.filter((time) => time > cutoff);
    record.count = record.requests.length;

    const allowed = record.count < config.maxRequests;

    if (allowed) {
      record.count++;
      record.requests.push(now);
      this.store.set(key, record);
    }

    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - record.count),
      resetTime: record.resetTime,
      retryAfter: allowed
        ? undefined
        : Math.ceil((record.resetTime - now) / 1000),
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

/**
 * Redis-based rate limiter (for production with multiple instances)
 */
class RedisRateLimiter {
  private redis: any = null;

  constructor() {
    // Initialize Redis connection if available
    if (process.env.REDIS_URL) {
      try {
        // Lazy load Redis to avoid import errors if not available
        const Redis = require('ioredis');
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        });
      } catch (error) {
        console.warn(
          'Redis not available, falling back to memory store:',
          error
        );
      }
    }
  }

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      // Fallback to memory limiter if Redis unavailable
      return memoryLimiter.checkLimit(key, config);
    }

    const now = Date.now();
    const window = Math.floor(now / config.windowMs);
    const redisKey = `rate_limit:${key}:${window}`;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));

      const results = await pipeline.exec();
      const count = results[0][1];

      const allowed = count <= config.maxRequests;
      const resetTime = (window + 1) * config.windowMs;

      return {
        allowed,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetTime,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
      };
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      // Fallback to allowing the request on Redis errors
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }
  }
}

// Global rate limiter instances
const memoryLimiter = new MemoryRateLimiter();
const redisLimiter = new RedisRateLimiter();

/**
 * Main rate limiter class
 */
class RateLimiter {
  private limiter: MemoryRateLimiter | RedisRateLimiter;

  constructor() {
    // Use Redis limiter if available, otherwise memory limiter
    this.limiter = process.env.REDIS_URL ? redisLimiter : memoryLimiter;
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    return this.limiter.checkLimit(key, config);
  }

  /**
   * Generate rate limit key from request
   */
  static generateKey(request: NextRequest, identifier?: string): string {
    if (identifier) {
      return identifier;
    }

    // Try to get user ID from auth context if available
    // For now, use IP-based rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIP || 'unknown';

    // Include endpoint for per-endpoint rate limiting
    const url = new URL(request.url);
    const endpoint = url.pathname;

    return `${ip}:${endpoint}`;
  }

  /**
   * Extract client identifier for rate limiting
   */
  static getClientId(request: NextRequest): string {
    // Priority order: authenticated user > API key > IP address

    // Try to get user ID from authorization header or session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // In a real implementation, decode the JWT token
      // For now, use the token itself as identifier
      return `user:${authHeader.substring(7)}`;
    }

    // Check for API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIP || 'unknown';

    return `ip:${ip}`;
  }
}

/**
 * Pre-configured rate limit configurations
 */
export const RateLimitConfigs = {
  // General API endpoints
  DEFAULT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many requests, please try again later',
  },

  // Strict rate limiting for expensive operations
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: 'Rate limit exceeded for this operation',
  },

  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts',
  },

  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    message: 'Search rate limit exceeded',
  },

  // Image upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    message: 'Upload rate limit exceeded',
  },

  // Admin endpoints
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // Higher limit for admin users
    message: 'Admin rate limit exceeded',
  },

  // Public content endpoints (more permissive)
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
    message: 'Public API rate limit exceeded',
  },

  // Real-time features (chat, notifications)
  REALTIME: {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 20, // 20 requests per 10 seconds
    message: 'Real-time rate limit exceeded',
  },
};

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  config: RateLimitConfig = RateLimitConfigs.DEFAULT,
  options: {
    keyGenerator?: (request: NextRequest) => string;
    skipOnError?: boolean;
    onLimitReached?: (request: NextRequest, result: RateLimitResult) => void;
  } = {}
) {
  const limiter = new RateLimiter();

  return function <T extends any[]>(
    handler: (...args: T) => Promise<Response>
  ) {
    return async (...args: T): Promise<Response> => {
      const request = args[0] as NextRequest;

      try {
        // Generate rate limit key
        const key = options.keyGenerator
          ? options.keyGenerator(request)
          : config.keyGenerator
            ? config.keyGenerator(request)
            : RateLimiter.generateKey(request);

        // Check rate limit
        const result = await limiter.checkLimit(key, config);

        if (!result.allowed) {
          // Call custom handler if provided
          if (options.onLimitReached) {
            options.onLimitReached(request, result);
          }

          // Create rate limit error
          const error = new RateLimitError(
            config.message || 'Rate limit exceeded'
          );

          // Create rate limit response with headers
          return Response.json(error.toJSON(), {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.resetTime),
              'Retry-After': String(result.retryAfter || 60),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
        }

        // Execute the handler
        const response = await handler(...args);

        // Add rate limit headers to successful responses
        response.headers.set('X-RateLimit-Limit', String(result.limit));
        response.headers.set('X-RateLimit-Remaining', String(result.remaining));
        response.headers.set('X-RateLimit-Reset', String(result.resetTime));

        return response;
      } catch (error) {
        if (options.skipOnError) {
          console.warn('Rate limiting error, allowing request:', error);
          return handler(...args);
        }
        throw error;
      }
    };
  };
}

/**
 * Conditional rate limiting based on user role or conditions
 */
export function withConditionalRateLimit(
  getConfig: (request: NextRequest) => RateLimitConfig | null,
  options: {
    skipOnError?: boolean;
  } = {}
) {
  return function <T extends any[]>(
    handler: (...args: T) => Promise<Response>
  ) {
    return async (...args: T): Promise<Response> => {
      const request = args[0] as NextRequest;

      try {
        const config = getConfig(request);

        // Skip rate limiting if no config returned
        if (!config) {
          return handler(...args);
        }

        // Apply rate limiting with the determined config
        return withRateLimit(config, options)(handler)(...args);
      } catch (error) {
        if (options.skipOnError) {
          console.warn(
            'Conditional rate limiting error, allowing request:',
            error
          );
          return handler(...args);
        }
        throw error;
      }
    };
  };
}

/**
 * Rate limiting utilities
 */
const _RateLimitUtils = {
  /**
   * Get rate limit config based on user role
   */
  getConfigByRole(userRole?: string): RateLimitConfig {
    switch (userRole) {
      case 'admin':
        return RateLimitConfigs.ADMIN;
      case 'moderator':
        return RateLimitConfigs.PUBLIC; // Slightly more permissive
      default:
        return RateLimitConfigs.DEFAULT;
    }
  },

  /**
   * Get rate limit config based on endpoint
   */
  getConfigByEndpoint(endpoint: string): RateLimitConfig {
    if (endpoint.includes('/auth/')) {
      return RateLimitConfigs.AUTH;
    }
    if (endpoint.includes('/search')) {
      return RateLimitConfigs.SEARCH;
    }
    if (endpoint.includes('/upload')) {
      return RateLimitConfigs.UPLOAD;
    }
    if (endpoint.includes('/admin/')) {
      return RateLimitConfigs.ADMIN;
    }
    if (endpoint.includes('/chat') || endpoint.includes('/notifications')) {
      return RateLimitConfigs.REALTIME;
    }

    // Public content endpoints
    if (endpoint.includes('/articles') || endpoint.includes('/library')) {
      return RateLimitConfigs.PUBLIC;
    }

    return RateLimitConfigs.DEFAULT;
  },

  /**
   * Check if IP is in whitelist
   */
  isWhitelisted(request: NextRequest): boolean {
    const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];

    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIP;

    return ip ? whitelist.includes(ip.trim()) : false;
  },

  /**
   * Get user info for rate limiting context
   */
  async getUserInfo(_request: NextRequest): Promise<{
    userId?: string;
    role?: string;
    tier?: string;
  }> {
    // In a real implementation, decode JWT token or check session
    // For now, return empty object
    return {};
  },
};

/**
 * Cleanup function for graceful shutdown
 */
function _cleanup() {
  if (memoryLimiter) {
    memoryLimiter.destroy();
  }
}
