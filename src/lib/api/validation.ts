/**
 * API Request Validation and Sanitization
 * Zod-based validation schemas and utilities for API routes
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { ApiError, ValidationError } from './error-handling';

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  // Pagination schemas
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val)) : 1))
    .refine((val) => !isNaN(val), 'Page must be a valid number'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val))) : 10))
    .refine((val) => !isNaN(val), 'Limit must be a valid number'),

  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(0, parseInt(val)) : 0))
    .refine((val) => !isNaN(val), 'Offset must be a valid number'),

  // Search and filter schemas
  search: z
    .string()
    .optional()
    .transform((val) => val?.trim())
    .refine(
      (val) => !val || val.length >= 2,
      'Search query must be at least 2 characters'
    )
    .refine((val) => !val || val.length <= 200, 'Search query too long'),

  tag: z
    .string()
    .optional()
    .transform((val) => val?.toLowerCase().trim())
    .refine((val) => !val || /^[a-z0-9\-_]+$/.test(val), 'Invalid tag format'),

  tags: z
    .string()
    .optional()
    .transform((val) =>
      val
        ?.split(',')
        .map((t) => t.toLowerCase().trim())
        .filter(Boolean)
    )
    .refine((val) => !val || val.length <= 10, 'Too many tags'),

  // Date schemas
  dateString: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date format'),

  // ID schemas
  uuid: z.string().uuid('Invalid UUID format'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug too long')
    .refine((val) => /^[a-z0-9\-_]+$/.test(val), 'Invalid slug format'),

  // Content schemas
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title too long')
    .transform((val) => val.trim()),

  content: z
    .string()
    .min(1, 'Content is required')
    .max(100000, 'Content too long'),

  excerpt: z
    .string()
    .optional()
    .transform((val) => val?.trim())
    .refine((val) => !val || val.length <= 500, 'Excerpt too long'),

  // Enum schemas
  sortOrder: z
    .enum(['newest', 'oldest', 'popular', 'trending'])
    .optional()
    .default('newest'),

  articleStatus: z
    .enum(['draft', 'pending', 'published', 'archived', 'rejected'])
    .optional(),

  userRole: z.enum(['member', 'moderator', 'admin']).optional(),
};

/**
 * Article-related validation schemas
 */
const ArticleSchemas = {
  // GET /api/articles query parameters
  list: z.object({
    page: CommonSchemas.page,
    limit: CommonSchemas.limit,
    search: CommonSchemas.search,
    tag: CommonSchemas.tag,
    tags: CommonSchemas.tags,
    author_id: CommonSchemas.uuid.optional(),
    status: CommonSchemas.articleStatus,
    sort: CommonSchemas.sortOrder,
    date_start: CommonSchemas.dateString,
    date_end: CommonSchemas.dateString,
  }),

  // POST /api/articles body
  create: z.object({
    title: CommonSchemas.title,
    content: CommonSchemas.content,
    excerpt: CommonSchemas.excerpt,
    tags: z.array(z.string()).optional(),
    cover_image_url: z.string().url().optional(),
    is_featured: z.boolean().optional(),
  }),

  // PATCH /api/articles/[id] body
  update: z.object({
    title: CommonSchemas.title.optional(),
    content: CommonSchemas.content.optional(),
    excerpt: CommonSchemas.excerpt,
    tags: z.array(z.string()).optional(),
    cover_image_url: z.string().url().optional(),
    status: CommonSchemas.articleStatus,
    is_featured: z.boolean().optional(),
  }),

  // Article voting
  vote: z.object({
    vote_type: z.enum(['up', 'down']),
  }),
};

/**
 * Search validation schemas
 */
const SearchSchemas = {
  query: z.object({
    q: z
      .string()
      .min(1, 'Search query is required')
      .max(200, 'Search query too long')
      .transform((val) => val.trim()),

    types: z
      .string()
      .optional()
      .transform((val) => val?.split(',').filter(Boolean))
      .refine(
        (val) =>
          !val ||
          val.every((t) =>
            ['articles', 'library_items', 'research_papers'].includes(t)
          ),
        'Invalid content type'
      ),

    page: CommonSchemas.page,
    limit: CommonSchemas.limit,
    tags: CommonSchemas.tags,

    // Advanced search options
    exact_phrase: z
      .string()
      .optional()
      .transform((val) => val === 'true'),

    fuzzy_search: z
      .string()
      .optional()
      .transform((val) => val === 'true'),

    include_content: z
      .string()
      .optional()
      .transform((val) => val === 'true'),

    ranking_mode: z
      .enum(['relevance', 'date', 'popularity'])
      .optional()
      .default('relevance'),

    min_relevance: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || (val >= 0 && val <= 1),
        'Invalid relevance score'
      ),

    // Filters
    article_status: z
      .string()
      .optional()
      .transform((val) => val?.split(',').filter(Boolean))
      .refine(
        (val) =>
          !val ||
          val.every((s) =>
            ['draft', 'pending', 'published', 'archived'].includes(s)
          ),
        'Invalid article status'
      ),

    author_id: CommonSchemas.uuid.optional(),
    date_start: CommonSchemas.dateString,
    date_end: CommonSchemas.dateString,
  }),

  suggestions: z.object({
    q: z.string().optional(),
    limit: z.number().min(1).max(20).optional().default(5),
  }),

  autocomplete: z.object({
    field: z.enum(['tags', 'authors', 'titles', 'journals']),
    q: z.string().min(1, 'Query is required'),
    limit: z.number().min(1).max(50).optional().default(10),
  }),

  analytics: z.object({
    period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
    top_queries_limit: z.number().min(1).max(50).optional().default(10),
  }),
};

/**
 * User and profile validation schemas
 */
const UserSchemas = {
  profile: z.object({
    display_name: z
      .string()
      .min(1, 'Display name is required')
      .max(100, 'Display name too long')
      .optional(),

    bio: z.string().max(1000, 'Bio too long').optional(),

    website_url: z.string().url('Invalid website URL').optional(),

    twitter_handle: z
      .string()
      .regex(/^@?[a-zA-Z0-9_]{1,15}$/, 'Invalid Twitter handle')
      .optional(),

    linkedin_url: z.string().url('Invalid LinkedIn URL').optional(),
  }),

  preferences: z.object({
    email_notifications: z.boolean().optional(),
    newsletter_subscribed: z.boolean().optional(),
    theme_preference: z.enum(['light', 'dark', 'system']).optional(),
  }),
};

/**
 * Admin validation schemas
 */
const AdminSchemas = {
  articleModeration: z.object({
    action: z.enum(['approve', 'reject']),
    reason: z.string().max(500).optional(),
    feedback: z.string().max(1000).optional(),
  }),

  dashboardFilters: z.object({
    date_start: CommonSchemas.dateString,
    date_end: CommonSchemas.dateString,
    metric: z.enum(['articles', 'users', 'votes', 'views']).optional(),
  }),
};

/**
 * Newsletter validation schemas
 */
const NewsletterSchemas = {
  subscribe: z.object({
    email: z.string().email('Invalid email address'),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name too long')
      .optional(),
    source: z.string().max(50).optional(),
  }),

  unsubscribe: z.object({
    email: z.string().email('Invalid email address'),
    token: z.string().min(1, 'Token is required').optional(),
  }),
};

/**
 * Image upload validation
 */
const _ImageSchemas = {
  upload: z.object({
    file: z.object({
      name: z.string(),
      type: z
        .string()
        .refine(
          (type) =>
            ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
              type
            ),
          'Invalid file type'
        ),
      size: z.number().max(5 * 1024 * 1024, 'File too large (max 5MB)'),
    }),
    purpose: z
      .enum(['avatar', 'cover', 'content'])
      .optional()
      .default('content'),
  }),
};

/**
 * Validation utility functions
 */
export class RequestValidator {
  /**
   * Validate query parameters from URL
   */
  static validateQuery<T>(
    schema: z.ZodSchema<T>,
    request: NextRequest,
    requestId?: string
  ): T {
    try {
      const { searchParams } = new URL(request.url);
      const queryObject = Object.fromEntries(searchParams.entries());

      const result = schema.safeParse(queryObject);

      if (!result.success) {
        throw new ValidationError(
          'Invalid query parameters',
          {
            issues: result.error.issues.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
          requestId
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        'Failed to parse query parameters',
        null,
        requestId
      );
    }
  }

  /**
   * Validate JSON body from request
   */
  static async validateBody<T>(
    schema: z.ZodSchema<T>,
    request: NextRequest,
    requestId?: string
  ): Promise<T> {
    try {
      // Validate content type
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new ValidationError(
          'Content-Type must be application/json',
          { received: contentType, expected: 'application/json' },
          requestId
        );
      }

      const body = await request.json();

      const result = schema.safeParse(body);

      if (!result.success) {
        throw new ValidationError(
          'Invalid request body',
          {
            issues: result.error.issues.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
          requestId
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new ValidationError(
          'Invalid JSON in request body',
          null,
          requestId
        );
      }

      throw new ValidationError(
        'Failed to parse request body',
        null,
        requestId
      );
    }
  }

  /**
   * Validate path parameters
   */
  static validateParams<T>(
    schema: z.ZodSchema<T>,
    params: Record<string, string | string[]>,
    requestId?: string
  ): T {
    try {
      const result = schema.safeParse(params);

      if (!result.success) {
        throw new ValidationError(
          'Invalid path parameters',
          {
            issues: result.error.issues.map((issue: any) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
          },
          requestId
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        'Failed to validate path parameters',
        null,
        requestId
      );
    }
  }

  /**
   * Validate HTTP method
   */
  static validateMethod(
    request: NextRequest,
    allowedMethods: string[],
    requestId?: string
  ): void {
    if (!allowedMethods.includes(request.method)) {
      throw new ApiError(
        `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        405,
        'METHOD_NOT_ALLOWED',
        { allowedMethods },
        requestId
      );
    }
  }

  /**
   * Sanitize user input for security
   */
  static sanitizeInput<T extends Record<string, any>>(input: T): T {
    const sanitized = { ...input };

    // Recursively sanitize string values
    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];

      if (typeof value === 'string') {
        // Remove potential XSS attempts
        (sanitized as any)[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (Array.isArray(value)) {
        (sanitized as any)[key] = value.map((item) =>
          typeof item === 'string' ? this.sanitizeInput({ item }).item : item
        );
      } else if (value && typeof value === 'object') {
        (sanitized as any)[key] = this.sanitizeInput(value);
      }
    });

    return sanitized;
  }
}

/**
 * Route-specific validation helpers
 */
const _RouteValidators = {
  // GET /api/articles
  getArticles: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateQuery(ArticleSchemas.list, request, requestId),

  // POST /api/articles
  createArticle: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(ArticleSchemas.create, request, requestId),

  // PATCH /api/articles/[id]
  updateArticle: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(ArticleSchemas.update, request, requestId),

  // GET/POST /api/search
  searchQuery: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateQuery(SearchSchemas.query, request, requestId),

  searchSuggestions: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(
      SearchSchemas.suggestions,
      request,
      requestId
    ),

  searchAutocomplete: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(
      SearchSchemas.autocomplete,
      request,
      requestId
    ),

  // Newsletter routes
  newsletterSubscribe: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(
      NewsletterSchemas.subscribe,
      request,
      requestId
    ),

  // User profile routes
  updateProfile: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(UserSchemas.profile, request, requestId),

  // Admin routes
  moderateArticle: (request: NextRequest, requestId?: string) =>
    RequestValidator.validateBody(
      AdminSchemas.articleModeration,
      request,
      requestId
    ),
};

/**
 * Validation middleware for API routes
 */
export function withValidation<T>(
  validator: (request: NextRequest, requestId?: string) => T | Promise<T>,
  handler: (
    data: T,
    request: NextRequest,
    requestId: string
  ) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const validatedData = await validator(request, requestId);
      const sanitizedData = RequestValidator.sanitizeInput(
        validatedData as Record<string, any>
      ) as T;

      return await handler(sanitizedData, request, requestId);
    } catch (error) {
      const { handleApiError } = await import('./error-handling');
      const { getRequestContext } = await import('./error-handling');

      const context = getRequestContext(request);
      return handleApiError(error, requestId, context);
    }
  };
}
