import { NextRequest } from 'next/server';
import { ZodSchema } from 'zod';
import { ValidationError as APIValidationError } from '@/lib/errors/api-errors';
import {
  validateAndSanitizeData,
  sanitizeSearchQuery,
  checkValidationRateLimit,
  type ValidationResult,
  type SanitizeOptions,
} from '@/lib/validation/sanitization';

/**
 * Enhanced validation middleware with comprehensive sanitization
 */

// Get client IP address from request
function getClientIP(request: NextRequest): string {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default IP for development
  return '127.0.0.1';
}

/**
 * Validate and sanitize request body with comprehensive security checks
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  options: SanitizeOptions & {
    enableRateLimit?: boolean;
    maxAttempts?: number;
    windowMs?: number;
  } = {}
): Promise<T> {
  const {
    enableRateLimit = true,
    maxAttempts = 50,
    windowMs = 60000,
    ...sanitizeOptions
  } = options;

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Rate limiting check
    if (
      enableRateLimit &&
      !checkValidationRateLimit(clientIP, maxAttempts, windowMs)
    ) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Parse request body
    const body = await request.json();

    // Comprehensive validation and sanitization
    const result: ValidationResult = validateAndSanitizeData(body, schema, {
      ...sanitizeOptions,
      clientIP,
    });

    if (!result.isValid) {
      const errorMessage =
        result.errors.length > 0 ? result.errors[0] : 'Invalid request data';
      throw new APIValidationError(errorMessage);
    }

    // Log warnings if data was sanitized
    if (result.warnings.length > 0) {
      console.warn('Data sanitization warnings:', result.warnings);
    }

    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new APIValidationError('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Validate URL parameter using Zod schema
 */
export function validateUrlParam<T>(
  param: string,
  schema: ZodSchema<T>,
  paramName: string = 'parameter'
): T {
  const result = schema.safeParse(param);

  if (!result.success) {
    const errorMessage = result.error.issues
      .map((err: any) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new ValidationError(`Invalid ${paramName}: ${errorMessage}`);
  }

  return result.data;
}

/**
 * Validate and sanitize query parameters with enhanced security
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
  options: {
    enableRateLimit?: boolean;
    clientIP?: string;
  } = {}
): T {
  const { enableRateLimit = true, clientIP = '127.0.0.1' } = options;

  try {
    // Rate limiting check
    if (enableRateLimit && !checkValidationRateLimit(clientIP, 100, 60000)) {
      throw new Error('Rate limit exceeded for query validation');
    }

    // Convert URLSearchParams to object
    const params: Record<string, any> = {};

    searchParams.forEach((value, key) => {
      // Handle arrays (multiple values for same key)
      if (params[key] !== undefined) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });

    // Sanitize search-related parameters
    if (params.search) {
      params.search = sanitizeSearchQuery(params.search);
    }

    if (params.tags && typeof params.tags === 'string') {
      params.tags = params.tags
        .split(',')
        .map((tag: string) => sanitizeSearchQuery(tag))
        .filter(Boolean);
    }

    // Convert numeric parameters
    const numericFields = [
      'limit',
      'offset',
      'rating_min',
      'rating_max',
      'publication_year',
    ];
    numericFields.forEach((field) => {
      if (params[field] !== undefined) {
        const num = Number(params[field]);
        if (!isNaN(num) && isFinite(num)) {
          params[field] = num;
        } else {
          delete params[field];
        }
      }
    });

    // Convert boolean parameters
    const booleanFields = ['is_active', 'include_metadata'];
    booleanFields.forEach((field) => {
      if (params[field] !== undefined) {
        params[field] = params[field] === 'true';
      }
    });

    const result = schema.safeParse(params);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      throw new Error(`Query parameter validation failed: ${errorMessage}`);
    }

    return result.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Enhanced validation error with security context
 */
class ValidationError extends Error {
  public readonly statusCode: number;
  public readonly details: string[];
  public readonly sanitized: boolean;

  constructor(
    message: string,
    details: string[] = [],
    statusCode: number = 400,
    sanitized: boolean = false
  ) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.details = details;
    this.sanitized = sanitized;
  }
}

/**
 * Middleware wrapper for API route validation
 */
function _withValidation<T>(
  schema: ZodSchema<T>,
  options: SanitizeOptions = {}
) {
  return async (request: NextRequest): Promise<T> => {
    try {
      return await validateRequestBody(request, schema, options);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw new ValidationError('Validation failed');
    }
  };
}

/**
 * Sanitize and validate file upload data
 */
interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

function _validateFileUpload(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  } = options;

  const result: ValidationResult = {
    isValid: false,
    data: null,
    errors: [],
    warnings: [],
    sanitized: false,
  };

  // Check file size
  if (file.size > maxSize) {
    result.errors.push(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    result.errors.push(
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    result.errors.push(
      `File extension ${extension} is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
    );
  }

  // Check for dangerous file names
  const dangerousPatterns = [
    /\.(exe|bat|cmd|scr|pif|msi|dll)$/i,
    /^\./,
    /\.\./,
    /[<>:"|?*]/,
  ];

  if (dangerousPatterns.some((pattern) => pattern.test(file.name))) {
    result.errors.push('File name contains dangerous characters or patterns');
  }

  result.isValid = result.errors.length === 0;

  if (result.isValid) {
    result.data = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  }

  return result;
}

/**
 * Comprehensive input sanitization for user-generated content
 */
export function sanitizeUserInput(
  input: any,
  context: 'search' | 'text' | 'richText' | 'url' | 'tags' = 'text'
): any {
  if (typeof input === 'string') {
    switch (context) {
      case 'search':
        return sanitizeSearchQuery(input);
      case 'text':
        return require('@/lib/validation/sanitization').sanitizeText(input);
      case 'richText':
        return require('@/lib/validation/sanitization').sanitizeRichText(input);
      case 'url':
        return require('@/lib/validation/sanitization').sanitizeUrl(input);
      case 'tags':
        return (
          require('@/lib/validation/sanitization').sanitizeTags([input])[0] ||
          null
        );
      default:
        return require('@/lib/validation/sanitization').sanitizeText(input);
    }
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeUserInput(item, context));
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value, context);
    }
    return sanitized;
  }

  return input;
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'",
  };
}
