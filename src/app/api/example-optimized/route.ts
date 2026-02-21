/**
 * Example Optimized API Route
 * Demonstrates the usage of all API optimization features
 */

import { NextRequest } from 'next/server';
import { ApiHandlers } from '@/lib/api/handlers';
import {
  ApiResponse,
  ResponseSerializer,
} from '@/lib/api/response-optimization';
import { RateLimitConfigs } from '@/lib/api/rate-limiting';
import { CachePresets } from '@/lib/api/cache';
import { CommonSchemas } from '@/lib/api/validation';
import {
  withPerformanceMonitoring,
  CustomMetrics,
} from '@/lib/api/performance-monitoring';
import { z } from 'zod';

// Example validation schema
const ExampleQuerySchema = z.object({
  page: CommonSchemas.page,
  limit: CommonSchemas.limit,
  search: CommonSchemas.search,
  category: z.enum(['tech', 'science', 'business']).optional(),
  featured: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// Example response data generator
async function generateExampleData(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  featured?: boolean;
}) {
  // Simulate database query
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

  // Record custom metrics
  CustomMetrics.increment('example_api.requests', {
    category: params.category || 'all',
    has_search: params.search ? 'true' : 'false',
  });

  // Generate mock data
  const totalItems = 150;
  const items = Array.from({ length: params.limit }, (_, i) => ({
    id: `item_${params.page}_${i + 1}`,
    title: `Example Item ${(params.page - 1) * params.limit + i + 1}`,
    description: params.search
      ? `This item matches your search for "${params.search}"`
      : 'This is an example item description',
    category: params.category || 'tech',
    featured: params.featured || false,
    createdAt: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    metadata: {
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
    },
  }));

  return {
    items,
    total: totalItems,
  };
}

/**
 * GET /api/example-optimized
 * Example of optimized GET endpoint with caching
 */
export const GET = ApiHandlers.GET(
  async (requestId: string, request: Request) => {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = ExampleQuerySchema.parse(queryParams);

    // Get data
    const { items, total } = await generateExampleData(validatedQuery);

    // Serialize response data
    const serializedItems = items.map((item) => ({
      ...item,
      // Remove sensitive data, optimize response size
      description: item.description.substring(0, 100) + '...',
    }));

    // Return paginated response
    return ApiResponse.paginated(
      serializedItems,
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
      },
      {
        message: `Found ${total} items`,
        cacheOptions: CachePresets.ARTICLES, // 5 min cache
        meta: {
          requestId,
          category: validatedQuery.category,
          hasSearch: !!validatedQuery.search,
        },
      }
    );
  },
  {
    // Cache for 5 minutes for public data
    cache: CachePresets.ARTICLES,
    // Use public rate limit (more permissive)
    rateLimit: RateLimitConfigs.PUBLIC,
    // Validate query parameters
    validation: {
      query: ExampleQuerySchema,
    },
  }
);

/**
 * POST /api/example-optimized
 * Example of optimized POST endpoint with validation
 */
const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(['tech', 'science', 'business']),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string()).max(10).optional(),
});

export const POST = ApiHandlers.POST(
  async (requestId: string, request: Request, body: any) => {
    // Record custom metrics
    CustomMetrics.increment('example_api.creates', {
      category: body.category,
    });

    // Simulate creation process
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200));

    // Record timing
    CustomMetrics.timing(
      'example_api.create_duration',
      Date.now() - startTime,
      {
        category: body.category,
      }
    );

    // Create new item (mock)
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        views: 0,
        likes: 0,
      },
    };

    return ApiResponse.success(
      ResponseSerializer.removeSensitiveData(newItem),
      {
        message: 'Item created successfully',
        meta: {
          requestId,
          category: body.category,
        },
      }
    );
  },
  {
    bodySchema: CreateItemSchema,
    rateLimit: RateLimitConfigs.DEFAULT, // Standard rate limiting for creates
  }
);

/**
 * PATCH /api/example-optimized
 * Example of optimized PATCH endpoint
 */
const UpdateItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  category: z.enum(['tech', 'science', 'business']).optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const PATCH = ApiHandlers.PATCH(
  async (requestId: string, request: Request, body: any) => {
    // Record metrics
    CustomMetrics.increment('example_api.updates', {
      category: body.category || 'unknown',
    });

    // Simulate update process
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 150));

    // Mock updated item
    const updatedItem = {
      ...body,
      updatedAt: new Date().toISOString(),
      metadata: {
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
      },
    };

    return ApiResponse.success(
      ResponseSerializer.removeSensitiveData(updatedItem),
      {
        message: 'Item updated successfully',
        meta: {
          requestId,
          itemId: body.id,
        },
      }
    );
  },
  {
    bodySchema: UpdateItemSchema,
    rateLimit: RateLimitConfigs.DEFAULT,
  }
);

/**
 * DELETE /api/example-optimized
 * Example of optimized DELETE endpoint
 */
export const DELETE = ApiHandlers.DELETE(
  async (requestId: string, request: Request) => {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('id');

    if (!itemId) {
      return ApiResponse.validationError('Item ID is required', [
        { path: 'id', message: 'ID parameter is required' },
      ]);
    }

    // Record metrics
    CustomMetrics.increment('example_api.deletes');

    // Simulate deletion
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    return ApiResponse.success(
      { deleted: true, id: itemId },
      {
        message: 'Item deleted successfully',
        meta: {
          requestId,
          itemId,
        },
      }
    );
  },
  {
    rateLimit: RateLimitConfigs.DEFAULT,
  }
);

/**
 * Example of a manually optimized endpoint with all features
 */
export const OPTIONS = withPerformanceMonitoring(
  async (_request: NextRequest) => {
    // Record that someone is checking our API options
    CustomMetrics.increment('example_api.options_requests');

    const allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': allowedMethods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400', // 24 hours
    };

    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        Allow: allowedMethods.join(', '),
        'X-API-Version': '1.0',
        'X-Optimization-Features': [
          'caching',
          'rate-limiting',
          'validation',
          'error-handling',
          'performance-monitoring',
          'response-optimization',
        ].join(', '),
      },
    });
  },
  {
    trackCustomMetrics: true,
    enableTracing: true,
  }
);
