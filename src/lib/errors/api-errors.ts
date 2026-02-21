import { NextResponse } from 'next/server';

// Base API Error class
class APIError extends Error {
  public statusCode: number;
  public errorCode: string;
  public userMessage: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    userMessage: string = 'An unexpected error occurred',
    details?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.userMessage = userMessage;
    this.details = details;
  }
}

// Specific error types
export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      'The provided data is invalid',
      details
    );
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(
      `${resource} not found`,
      404,
      'NOT_FOUND',
      `The requested ${resource.toLowerCase()} could not be found`
    );
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      409,
      'CONFLICT',
      userMessage ||
        'A conflict occurred with the current state of the resource'
    );
    this.name = 'ConflictError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(
      message,
      401,
      'AUTHENTICATION_ERROR',
      'Authentication is required to access this resource'
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(
      message,
      403,
      'AUTHORIZATION_ERROR',
      'You do not have permission to access this resource'
    );
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, originalError?: any) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      'A database error occurred',
      process.env.NODE_ENV === 'development' ? originalError : undefined
    );
    this.name = 'DatabaseError';
  }
}

// Error response interface for consistency
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Centralized error handler
export function handleAPIError(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  console.error('API Error:', error);

  // If it's already an APIError, use it directly
  if (error instanceof APIError) {
    const response: ErrorResponse = {
      success: false,
      error: error.errorCode,
      message: error.userMessage,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Supabase/PostgreSQL specific errors
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const dbError = error as {
      code: string;
      message: string;
      details?: string;
    };

    switch (dbError.code) {
      case 'PGRST116': // No rows returned (not found)
        const response404: ErrorResponse = {
          success: false,
          error: 'NOT_FOUND',
          message: 'The requested resource could not be found',
          timestamp: new Date().toISOString(),
          requestId,
        };
        return NextResponse.json(response404, { status: 404 });

      case '23505': // Unique constraint violation
        const response409: ErrorResponse = {
          success: false,
          error: 'CONFLICT',
          message: 'A resource with this identifier already exists',
          timestamp: new Date().toISOString(),
          requestId,
        };
        return NextResponse.json(response409, { status: 409 });

      case '23503': // Foreign key constraint violation
        const responseForeign: ErrorResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Referenced resource does not exist',
          timestamp: new Date().toISOString(),
          requestId,
        };
        return NextResponse.json(responseForeign, { status: 400 });

      case '22P02': // Invalid enum value
        const responseEnum: ErrorResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid value provided for enumerated field',
          timestamp: new Date().toISOString(),
          requestId,
        };
        return NextResponse.json(responseEnum, { status: 400 });

      default:
        // Generic database error
        const responseDB: ErrorResponse = {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: process.env.NODE_ENV === 'development' ? dbError : undefined,
          timestamp: new Date().toISOString(),
          requestId,
        };
        return NextResponse.json(responseDB, { status: 500 });
    }
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    const responseJSON: ErrorResponse = {
      success: false,
      error: 'INVALID_JSON',
      message: 'Request body must be valid JSON',
      timestamp: new Date().toISOString(),
      requestId,
    };
    return NextResponse.json(responseJSON, { status: 400 });
  }

  // Generic error fallback
  const genericResponse: ErrorResponse = {
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(genericResponse, { status: 500 });
}

// Helper function to generate request IDs for tracking
export function generateRequestId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Helper function to create success responses with consistent format
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(response, { status });
}
