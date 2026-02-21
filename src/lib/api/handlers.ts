/**
 * API Handler Factories
 * Pre-configured API handlers for common patterns
 */

import { apiHandler } from './error-handling';
import { withValidation, RequestValidator } from './validation';
import { withResponseOptimization } from './response-optimization';
import {
  withRateLimit,
  withConditionalRateLimit,
  RateLimitConfigs,
} from './rate-limiting';
import { withPerformanceMonitoring } from './performance-monitoring';
import type { CacheOptions } from './cache';
import type { RateLimitConfig } from './rate-limiting';

/**
 * Pre-configured API handlers for common patterns
 */
export const ApiHandlers = {
  /**
   * Basic GET endpoint with caching
   */
  GET: (
    handler: (requestId: string, request: Request) => Promise<Response>,
    options: {
      cache?: CacheOptions;
      rateLimit?: RateLimitConfig;
      validation?: { query?: any };
    } = {}
  ) => {
    return createOptimizedApiHandler(handler, {
      name: 'GET Handler',
      cache: options.cache,
      rateLimit: options.rateLimit || RateLimitConfigs.PUBLIC,
      validation: options.validation,
    });
  },

  /**
   * POST endpoint with validation and rate limiting
   */
  POST: (
    handler: (
      requestId: string,
      request: Request,
      body: any
    ) => Promise<Response>,
    options: {
      bodySchema: any;
      rateLimit?: RateLimitConfig;
      validation?: { query?: any };
    }
  ) => {
    return createOptimizedApiHandler(
      async (requestId: string, request: Request, validatedData: any) => {
        return handler(requestId, request, validatedData.body);
      },
      {
        name: 'POST Handler',
        rateLimit: options.rateLimit || RateLimitConfigs.DEFAULT,
        validation: {
          body: options.bodySchema,
          ...options.validation,
        },
      }
    );
  },

  /**
   * PATCH/PUT endpoint
   */
  PATCH: (
    handler: (
      requestId: string,
      request: Request,
      body: any
    ) => Promise<Response>,
    options: {
      bodySchema: any;
      rateLimit?: RateLimitConfig;
    }
  ) => {
    return createOptimizedApiHandler(
      async (requestId: string, request: Request, validatedData: any) => {
        return handler(requestId, request, validatedData.body);
      },
      {
        name: 'PATCH Handler',
        rateLimit: options.rateLimit || RateLimitConfigs.DEFAULT,
        validation: {
          body: options.bodySchema,
        },
      }
    );
  },

  /**
   * DELETE endpoint
   */
  DELETE: (
    handler: (requestId: string, request: Request) => Promise<Response>,
    options: {
      rateLimit?: RateLimitConfig;
    } = {}
  ) => {
    return createOptimizedApiHandler(handler, {
      name: 'DELETE Handler',
      rateLimit: options.rateLimit || RateLimitConfigs.DEFAULT,
    });
  },

  /**
   * Search endpoint with special optimizations
   */
  SEARCH: (
    handler: (
      requestId: string,
      request: Request,
      query: any
    ) => Promise<Response>
  ) => {
    return createOptimizedApiHandler(
      async (requestId: string, request: Request, validatedData: any) => {
        return handler(requestId, request, validatedData.query);
      },
      {
        name: 'Search Handler',
        rateLimit: RateLimitConfigs.SEARCH,
        cache: {
          maxAge: 60, // 1 minute cache for search results
          private: true, // User-specific search results
        },
        validation: {
          // Would use SearchSchemas.query from validation.ts
        },
      }
    );
  },

  /**
   * Admin endpoint with strict rate limiting
   */
  ADMIN: (
    handler: (requestId: string, request: Request) => Promise<Response>,
    options: {
      bodySchema?: any;
      querySchema?: any;
    } = {}
  ) => {
    return createOptimizedApiHandler(handler, {
      name: 'Admin Handler',
      rateLimit: RateLimitConfigs.ADMIN,
      validation: {
        body: options.bodySchema,
        query: options.querySchema,
      },
    });
  },

  /**
   * Upload endpoint with special handling
   */
  UPLOAD: (
    handler: (requestId: string, request: Request) => Promise<Response>
  ) => {
    return createOptimizedApiHandler(handler, {
      name: 'Upload Handler',
      rateLimit: RateLimitConfigs.UPLOAD,
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
      },
    });
  },
};

/**
 * Complete API route wrapper with all optimizations
 */
export function createOptimizedApiHandler<T extends any[]>(
  handler: (requestId: string, ...args: T) => Promise<Response>,
  options: {
    name?: string;
    validation?: {
      query?: any;
      body?: any;
      params?: any;
    };
    rateLimit?:
      | RateLimitConfig
      | ((request: Request) => RateLimitConfig | null);
    cache?: CacheOptions;
    monitoring?: {
      enableMetrics?: boolean;
      enableTracing?: boolean;
    };
  } = {}
) {
  const { name = 'API Handler', validation, rateLimit, monitoring } = options;

  return async (...args: T): Promise<Response> => {
    let composedHandler = handler;

    // Apply performance monitoring (outermost layer)
    if (monitoring?.enableMetrics !== false) {
      composedHandler = withPerformanceMonitoring(
        (requestId: string, ...handlerArgs: T) =>
          composedHandler(requestId, ...handlerArgs),
        monitoring
      );
    }

    // Apply response optimization
    composedHandler = withResponseOptimization(
      (requestId: string, ...handlerArgs: T) =>
        composedHandler(requestId, ...handlerArgs)
    );

    // Apply rate limiting
    if (rateLimit) {
      if (typeof rateLimit === 'function') {
        composedHandler = withConditionalRateLimit(rateLimit)(
          (requestId: string, ...handlerArgs: T) =>
            composedHandler(requestId, ...handlerArgs)
        );
      } else {
        composedHandler = withRateLimit(rateLimit)(
          (requestId: string, ...handlerArgs: T) =>
            composedHandler(requestId, ...handlerArgs)
        );
      }
    }

    // Apply validation
    if (validation) {
      const validationHandler = withValidation(
        async (request: Request, requestId?: string) => {
          const validatedData: any = {};

          if (validation.query) {
            validatedData.query = RequestValidator.validateQuery(
              validation.query,
              request as any,
              requestId
            );
          }

          if (validation.body) {
            validatedData.body = await RequestValidator.validateBody(
              validation.body,
              request as any,
              requestId
            );
          }

          if (validation.params) {
            // Extract params from URL or context
            validatedData.params = RequestValidator.validateParams(
              validation.params,
              {}, // Would need to be passed in from Next.js context
              requestId
            );
          }

          return validatedData;
        },
        async (validatedData: any, request: Request, requestId: string) => {
          return (composedHandler as any)(
            requestId,
            request,
            validatedData,
            ...args.slice(2)
          );
        }
      );
      composedHandler = validationHandler as any;
    }

    // Apply core API handler wrapper (error handling, timing, request ID)
    return apiHandler(composedHandler, { name })(...args);
  };
}
