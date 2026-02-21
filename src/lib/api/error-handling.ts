/**
 * Enhanced API Error Handling System
 * Standardized error handling and response formatting for all API routes
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { ApiCache } from './cache';

/**
 * Base API Error class with standardized properties
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
    this.requestId = requestId;

    // Maintain stack trace
    Error.captureStackTrace(this, ApiError);
  }

  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMITED';
      case 500:
        return 'INTERNAL_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        requestId: this.requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Predefined error classes for common scenarios
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 422, 'VALIDATION_ERROR', details, requestId);
  }
}

class _AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', requestId?: string) {
    super(message, 401, 'UNAUTHORIZED', null, requestId);
  }
}

class _AuthorizationError extends ApiError {
  constructor(
    message: string = 'Insufficient permissions',
    requestId?: string
  ) {
    super(message, 403, 'FORBIDDEN', null, requestId);
  }
}

class _NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', requestId?: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND', null, requestId);
  }
}

class _ConflictError extends ApiError {
  constructor(message: string, requestId?: string) {
    super(message, 409, 'CONFLICT', null, requestId);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded', requestId?: string) {
    super(message, 429, 'RATE_LIMITED', null, requestId);
  }
}

class _DatabaseError extends ApiError {
  constructor(
    message: string = 'Database operation failed',
    requestId?: string
  ) {
    super(message, 500, 'DATABASE_ERROR', null, requestId);
  }
}

class _ExternalServiceError extends ApiError {
  constructor(service: string, message?: string, requestId?: string) {
    super(
      message || `${service} service unavailable`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      { service },
      requestId
    );
  }
}

/**
 * Comprehensive error handler for API routes
 */
export function handleApiError(
  error: unknown,
  requestId?: string,
  context?: {
    method?: string;
    url?: string;
    userId?: string;
  }
): Response {
  // Log the error with context
  const logContext = {
    requestId,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Handle different error types
  if (error instanceof ApiError) {
    // Log API errors at appropriate level
    if (error.statusCode >= 500) {
      console.error('API Error (5xx):', {
        ...logContext,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          stack: error.stack,
        },
      });
    } else {
      console.warn('API Error (4xx):', {
        ...logContext,
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      });
    }

    return Response.json(error.toJSON(), {
      status: error.statusCode,
      headers: ApiCache.noCache(), // Don't cache error responses
    });
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    console.warn('Validation Error:', {
      ...logContext,
      validationErrors: error.issues,
    });

    const validationError = new ValidationError(
      'Request validation failed',
      {
        issues: error.issues.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
      requestId
    );

    return Response.json(validationError.toJSON(), {
      status: 422,
      headers: ApiCache.noCache(),
    });
  }

  // Handle native JavaScript errors
  if (error instanceof Error) {
    console.error('Unexpected Error:', {
      ...logContext,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
    });

    const internalError = new ApiError(
      'An unexpected error occurred',
      500,
      'INTERNAL_ERROR',
      null,
      requestId
    );

    return Response.json(internalError.toJSON(), {
      status: 500,
      headers: ApiCache.noCache(),
    });
  }

  // Handle unknown error types
  console.error('Unknown Error Type:', { ...logContext, error });

  const unknownError = new ApiError(
    'An unknown error occurred',
    500,
    'UNKNOWN_ERROR',
    null,
    requestId
  );

  return Response.json(unknownError.toJSON(), {
    status: 500,
    headers: ApiCache.noCache(),
  });
}

/**
 * Success response helper
 */
function _createSuccessResponse<T>(
  data: T,
  options: {
    status?: number;
    message?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    meta?: Record<string, any>;
    cacheOptions?: Parameters<typeof ApiCache.createResponse>[1];
  } = {}
): Response {
  const {
    status = 200,
    message,
    pagination,
    meta,
    cacheOptions = {},
  } = options;

  const responseData = {
    success: true,
    data,
    ...(message && { message }),
    ...(pagination && { pagination }),
    ...(meta && { meta }),
    timestamp: new Date().toISOString(),
  };

  return ApiCache.createResponse(responseData, { status, ...cacheOptions });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract request context for error handling
 */
export function getRequestContext(request: NextRequest): {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
} {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined,
    // Note: userId would need to be extracted from auth context
  };
}

/**
 * Async error boundary wrapper for API routes
 */
export function withErrorHandling<T extends any[], _R>(
  handler: (...args: T) => Promise<Response>,
  requestId?: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as NextRequest;
      const context = getRequestContext(request);
      return handleApiError(error, requestId, context);
    }
  };
}

/**
 * Performance timing wrapper
 */
export function withTiming<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  name: string = 'API Handler'
) {
  return async (...args: T): Promise<Response> => {
    const start = Date.now();

    try {
      const response = await handler(...args);
      const duration = Date.now() - start;

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Handler-Name', name);

      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow API Response: ${name} took ${duration}ms`);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`API Error in ${name} after ${duration}ms:`, error);
      throw error;
    }
  };
}

/**
 * Complete API route wrapper with error handling, timing, and request ID
 */
export function apiHandler<T extends any[]>(
  handler: (requestId: string, ...args: T) => Promise<Response>,
  options: {
    name?: string;
    requireAuth?: boolean;
    rateLimitKey?: (request: NextRequest) => string;
  } = {}
) {
  return async (...args: T): Promise<Response> => {
    const requestId = generateRequestId();
    const { name = 'API Handler' } = options;

    return withTiming(
      withErrorHandling(async (...handlerArgs: T) => {
        return handler(requestId, ...handlerArgs);
      }, requestId),
      name
    )(...args);
  };
}

/**
 * HTTP method validation
 */
function _validateMethod(request: NextRequest, allowedMethods: string[]): void {
  if (!allowedMethods.includes(request.method)) {
    throw new ApiError(
      `Method ${request.method} not allowed`,
      405,
      'METHOD_NOT_ALLOWED'
    );
  }
}

/**
 * Content-Type validation
 */
function _validateContentType(
  request: NextRequest,
  expectedType: string = 'application/json'
): void {
  const contentType = request.headers.get('content-type');

  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    (!contentType || !contentType.includes(expectedType))
  ) {
    throw new ValidationError(`Expected Content-Type: ${expectedType}`, {
      received: contentType,
      expected: expectedType,
    });
  }
}
