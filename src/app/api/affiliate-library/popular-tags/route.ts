import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  ValidationError,
} from '@/lib/errors/api-errors';

export interface PopularTag {
  tag: string;
  count: number;
  percentage: number;
}

export interface PopularTagsResponse {
  success: boolean;
  data: {
    tags: PopularTag[];
    total_items: number;
    requested_limit: number;
    cache_info: {
      cached_at: string;
      ttl_seconds: number;
    };
  };
  message: string;
  request_id: string;
}

// Cache configuration
const CACHE_TTL_SECONDS = 3600; // 1 hour
let cachedTags: PopularTag[] | null = null;
let cacheTimestamp: number = 0;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters with validation
    const limitParam = searchParams.get('limit');
    const minCountParam = searchParams.get('min_count');
    const skipCacheParam = searchParams.get('skip_cache');

    const limit = limitParam ? parseInt(limitParam, 10) : 12;
    const minCount = minCountParam ? parseInt(minCountParam, 10) : 1;
    const skipCache = skipCacheParam === 'true';

    // Validate parameters
    if (isNaN(limit) || limit < 1 || limit > 50) {
      throw new ValidationError('Limit must be a number between 1 and 50');
    }

    if (isNaN(minCount) || minCount < 1) {
      throw new ValidationError('Min count must be a positive number');
    }

    // Check cache (unless explicitly skipped)
    const now = Date.now();
    const cacheAge = (now - cacheTimestamp) / 1000;

    if (!skipCache && cachedTags && cacheAge < CACHE_TTL_SECONDS) {
      const limitedTags = cachedTags.slice(0, limit);

      return createSuccessResponse(
        {
          tags: limitedTags,
          total_items: cachedTags.length,
          requested_limit: limit,
          cache_info: {
            cached_at: new Date(cacheTimestamp).toISOString(),
            ttl_seconds: Math.round(CACHE_TTL_SECONDS - cacheAge),
          },
        },
        `Retrieved ${limitedTags.length} popular tags from cache`,
        requestId
      );
    }

    // Fetch from database
    const supabase = getSupabaseAdmin();

    const { data: popularTags, error } = await supabase.rpc(
      'get_popular_affiliate_tags',
      {
        tag_limit: 50, // Get more than requested for caching
        min_count: minCount,
      }
    );

    if (error) {
      console.error('Database error fetching popular tags:', error);
      throw new Error(`Failed to fetch popular tags: ${error.message}`);
    }

    if (!popularTags || !Array.isArray(popularTags)) {
      throw new Error('Invalid response from database function');
    }

    // Transform and validate the data
    const validatedTags: PopularTag[] = popularTags
      .map((row: any) => ({
        tag: String(row.tag || '').trim(),
        count: parseInt(row.count || 0, 10),
        percentage: parseFloat(row.percentage || 0),
      }))
      .filter((tag) => tag.tag.length > 0 && tag.count > 0);

    // Update cache
    cachedTags = validatedTags;
    cacheTimestamp = now;

    // Return requested subset
    const limitedTags = validatedTags.slice(0, limit);

    const responseData = {
      tags: limitedTags,
      total_items: validatedTags.length,
      requested_limit: limit,
      cache_info: {
        cached_at: new Date(cacheTimestamp).toISOString(),
        ttl_seconds: CACHE_TTL_SECONDS,
      },
    };

    return createSuccessResponse(
      responseData,
      `Retrieved ${limitedTags.length} popular tags`,
      requestId
    );
  } catch (error) {
    console.error('Error in popular-tags API:', error);
    return handleAPIError(error, requestId);
  }
}

// Optional: Add POST method to force cache refresh (for admin use)
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Force cache refresh by calling GET with skip_cache=true
    const url = new URL(request.url);
    url.searchParams.set('skip_cache', 'true');

    const refreshedRequest = new NextRequest(url.toString(), {
      method: 'GET',
      headers: request.headers,
    });

    return await GET(refreshedRequest);
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
