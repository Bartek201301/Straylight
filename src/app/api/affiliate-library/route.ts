import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import { withAdminAPIAuth } from '@/lib/auth/api-middleware';
import {
  validateQueryParams,
  validateRequestBody,
  getSecurityHeaders,
  sanitizeUserInput,
} from '@/lib/middleware/validation';
import {
  AffiliateLibraryQuerySchema,
  CreateAffiliateLibraryItemSchema,
  UpdateAffiliateLibraryItemSchema,
} from '@/lib/validation/affiliate-library';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  NotFoundError,
  DatabaseError,
  AuthorizationError,
} from '@/lib/errors/api-errors';
import {
  AffiliateLibraryInsert,
  AffiliateLibraryUpdate,
} from '@/lib/types/affiliate-library';
import {
  processAffiliateLibraryItems,
  validateAffiliateUrl,
} from '@/lib/affiliate/affiliate-integration';

/**
 * GET /api/affiliate-library
 * Retrieve affiliate library items with filtering, sorting, and pagination
 *
 * Query Parameters:
 * - type: 'book' | 'tool'
 * - rating_min: number (1.0-5.0)
 * - rating_max: number (1.0-5.0)
 * - tags: string[] (comma-separated)
 * - search: string (searches title, description, author)
 * - is_active: boolean
 * - limit: number (1-100, default: 20)
 * - offset: number (default: 0)
 * - sort_by: 'rating' | 'created_at' | 'title' | 'click_count' (default: 'rating')
 * - sort_order: 'asc' | 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters using Zod schema
    const {
      type,
      rating_min,
      rating_max,
      tags,
      search,
      limit = 20,
      offset = 0,
      sort_by = 'rating',
      sort_order = 'desc',
    } = validateQueryParams(searchParams, AffiliateLibraryQuerySchema);

    // Handle is_active separately since it's not in the schema
    const is_active =
      searchParams.get('is_active') === 'true' ? true : undefined;

    // Build base query - use regular client since RLS policies handle access control
    let query = supabase
      .from('affiliate_library')
      .select(
        `
        id,
        title,
        description,
        type,
        author,
        rating,
        affiliate_url,
        image_url,
        tags,
        isbn,
        publisher,
        publication_year,
        price_range,
        click_count,
        is_active,
        created_at,
        updated_at
      `
      )
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // Add filters
    if (type) {
      query = query.eq('type', type);
    }

    if (rating_min !== undefined) {
      query = query.gte('rating', rating_min);
    }

    if (rating_max !== undefined) {
      query = query.lte('rating', rating_max);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    }

    if (tags && tags.length > 0) {
      // Search for items that contain any of the specified tags
      query = query.contains('tags', tags);
    }

    if (search) {
      // Full-text search across title, description, and author
      const searchTerm = search.replace(/'/g, "''"); // Escape single quotes
      query = query.or(
        `title.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, author.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch affiliate library items', error);
    }

    // Handle empty results gracefully
    const items = data || [];

    // Get total count for pagination info
    let countQuery = supabase
      .from('affiliate_library')
      .select('*', { count: 'exact', head: true });

    // Apply the same filters for count
    if (type) countQuery = countQuery.eq('type', type);
    if (rating_min !== undefined)
      countQuery = countQuery.gte('rating', rating_min);
    if (rating_max !== undefined)
      countQuery = countQuery.lte('rating', rating_max);
    if (is_active !== undefined)
      countQuery = countQuery.eq('is_active', is_active);
    if (tags && tags.length > 0) countQuery = countQuery.contains('tags', tags);
    if (search) {
      const searchTerm = search.replace(/'/g, "''");
      countQuery = countQuery.or(
        `title.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, author.ilike.%${searchTerm}%`
      );
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw new DatabaseError(
        'Failed to get affiliate library count',
        countError
      );
    }

    // Process affiliate URLs for automatic injection
    const processedItems = processAffiliateLibraryItems(items, {
      includeMetadata: searchParams.get('include_metadata') === 'true',
    });

    // Format response with pagination metadata
    const responseData = {
      items: processedItems,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        count: items.length,
        hasMore: offset + limit < (totalCount || 0),
      },
      filters: {
        type,
        rating_min,
        rating_max,
        tags,
        search,
        is_active,
        sort_by,
        sort_order,
      },
    };

    return createSuccessResponse(
      responseData,
      'Affiliate library items retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

/**
 * POST /api/affiliate-library
 * Create a new affiliate library item
 * Requires admin role for authentication
 */
const createLibraryItemHandler = async (
  request: NextRequest,
  _context: {
    user: NonNullable<
      import('@/lib/auth/api-middleware').APIAuthResult['user']
    >;
  }
) => {
  const requestId = generateRequestId();

  try {
    // User is authenticated via middleware, context.user contains the admin user

    // Validate and sanitize request body using enhanced security validation
    const itemData = await validateRequestBody(
      request,
      CreateAffiliateLibraryItemSchema,
      {
        strictMode: true,
        preserveRichText: false,
        removeEmptyFields: true,
        enableRateLimit: true,
        maxAttempts: 10, // Stricter rate limiting for creation
        windowMs: 60000,
      }
    );

    // Validate affiliate URL with enhanced security checks
    const urlValidation = validateAffiliateUrl(itemData.affiliate_url);
    if (!urlValidation.isValid) {
      throw new Error(
        `Invalid affiliate URL: ${urlValidation.errors.join(', ')}`
      );
    }

    // Log warnings if any
    if (urlValidation.warnings.length > 0) {
      console.warn('Affiliate URL warnings:', urlValidation.warnings);
    }

    // Additional security sanitization for sensitive fields
    const sanitizedTitle = sanitizeUserInput(itemData.title, 'text');
    const sanitizedDescription = sanitizeUserInput(
      itemData.description,
      'text'
    );

    // Prepare data for insertion with sanitized values
    const insertData: AffiliateLibraryInsert = {
      title: sanitizedTitle,
      description: sanitizedDescription || null,
      type: itemData.type,
      author: null, // Not required in simplified form
      rating: itemData.rating || null,
      affiliate_url: itemData.affiliate_url, // Already validated by validateAffiliateUrl
      image_url: itemData.image_url || null,
      tags: itemData.tags || [], // Already sanitized by the schema
      isbn: null, // Not required in simplified form
      publisher: null, // Not required in simplified form
      publication_year: null, // Not required in simplified form
      price_range: null, // Not required in simplified form
      is_active: true, // Default to active for new items
    };

    // Insert item into database using admin client to bypass RLS for creation
    const { data, error } = await getSupabaseAdmin()
      .from('affiliate_library')
      .insert(insertData)
      .select(
        `
        id,
        title,
        description,
        type,
        author,
        rating,
        affiliate_url,
        image_url,
        tags,
        isbn,
        publisher,
        publication_year,
        price_range,
        click_count,
        is_active,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      throw new DatabaseError('Failed to create affiliate library item', error);
    }

    // Create response with security headers
    const response = createSuccessResponse(
      data,
      'Affiliate library item created successfully',
      requestId,
      201
    );

    // Add security headers to the response
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return handleAPIError(error, requestId);
  }
};

export const POST = withAdminAPIAuth(createLibraryItemHandler);

/**
 * PUT /api/affiliate-library
 * Update an existing affiliate library item
 * Requires admin or moderator role
 * Expects item ID in request body
 */
export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Get current user from Supabase auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if user has admin or moderator role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      profileError ||
      !userProfile ||
      !['admin', 'moderator'].includes(userProfile.role)
    ) {
      throw new AuthorizationError(
        'Admin or moderator role required to update affiliate library items'
      );
    }

    // Get request body
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      throw new Error('Item ID is required for updates');
    }

    // Validate update data using Zod schema
    const validatedData = UpdateAffiliateLibraryItemSchema.parse(updateData);

    // Check if item exists
    const { data: existingItem, error: findError } = await getSupabaseAdmin()
      .from('affiliate_library')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existingItem) {
      throw new NotFoundError('Affiliate library item not found');
    }

    // Prepare update data
    const updateFields: AffiliateLibraryUpdate = {};

    if (validatedData.title !== undefined) {
      updateFields.title = validatedData.title.trim();
    }
    if (validatedData.description !== undefined) {
      updateFields.description = validatedData.description?.trim() || null;
    }
    if (validatedData.type !== undefined) {
      updateFields.type = validatedData.type;
    }
    if (validatedData.author !== undefined) {
      updateFields.author = validatedData.author?.trim() || null;
    }
    if (validatedData.rating !== undefined) {
      updateFields.rating = validatedData.rating;
    }
    if (validatedData.affiliate_url !== undefined) {
      updateFields.affiliate_url = validatedData.affiliate_url;
    }
    if (validatedData.image_url !== undefined) {
      updateFields.image_url = validatedData.image_url;
    }
    if (validatedData.tags !== undefined) {
      updateFields.tags = validatedData.tags;
    }
    if (validatedData.isbn !== undefined) {
      updateFields.isbn = validatedData.isbn?.trim() || null;
    }
    if (validatedData.publisher !== undefined) {
      updateFields.publisher = validatedData.publisher?.trim() || null;
    }
    if (validatedData.publication_year !== undefined) {
      updateFields.publication_year = validatedData.publication_year;
    }
    if (validatedData.price_range !== undefined) {
      updateFields.price_range = validatedData.price_range;
    }
    // is_active field can be updated via request body but not in the schema
    if (body.is_active !== undefined) {
      updateFields.is_active = Boolean(body.is_active);
    }
    if (validatedData.click_count !== undefined) {
      updateFields.click_count = validatedData.click_count;
    }

    // Update item in database
    const { data, error } = await getSupabaseAdmin()
      .from('affiliate_library')
      .update(updateFields)
      .eq('id', id)
      .select(
        `
        id,
        title,
        description,
        type,
        author,
        rating,
        affiliate_url,
        image_url,
        tags,
        isbn,
        publisher,
        publication_year,
        price_range,
        click_count,
        is_active,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      throw new DatabaseError('Failed to update affiliate library item', error);
    }

    return createSuccessResponse(
      data,
      'Affiliate library item updated successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

/**
 * DELETE /api/affiliate-library
 * Delete an affiliate library item
 * Requires admin role
 * Expects item ID in request body
 */
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Get current user from Supabase auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if user has admin role (only admins can delete)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      throw new AuthorizationError(
        'Admin role required to delete affiliate library items'
      );
    }

    // Get item ID from request body
    const { id } = await request.json();

    if (!id) {
      throw new Error('Item ID is required for deletion');
    }

    // Check if item exists
    const { data: existingItem, error: findError } = await getSupabaseAdmin()
      .from('affiliate_library')
      .select('id, title')
      .eq('id', id)
      .single();

    if (findError || !existingItem) {
      throw new NotFoundError('Affiliate library item not found');
    }

    // Delete item from database
    const { error } = await getSupabaseAdmin()
      .from('affiliate_library')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete affiliate library item', error);
    }

    return createSuccessResponse(
      { id, title: existingItem.title },
      'Affiliate library item deleted successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
