import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ALLOWED_TAG_SLUGS } from '@/lib/constants/tags';
import {
  validateQueryParams,
  validateRequestBody,
} from '@/lib/middleware/validation';
import {
  getArticlesQuerySchema,
  createArticleSchema,
  updateArticleSchema,
} from '@/lib/validation/articles';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
  ValidationError,
} from '@/lib/errors/api-errors';
import {
  queryCache,
  CacheKeys,
  CacheTags,
  CacheTTL,
} from '@/lib/cache/query-cache';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters using Zod schema (throws ValidationError if invalid)
    const { status, author_id, search, limit, offset, sort_order } =
      validateQueryParams(searchParams, getArticlesQuerySchema);

    // Create cache key based on parameters
    const cacheKey = CacheKeys.articles({
      status,
      author_id,
      search,
      limit,
      offset,
      sort_order,
    });

    // Use cached query with optimized database function
    const responseData = await queryCache.get(
      cacheKey,
      async () => {
        // Build the base query for articles with user information
        let query = getSupabaseAdmin()
          .from('articles')
          .select(
            `
            *,
            users!inner(handle, display_name, avatar_url)
          `,
            { count: 'exact' }
          );

        // Apply status filter if specified
        if (status) {
          query = query.eq('status', status);
        }

        // Apply author filter if specified
        if (author_id) {
          query = query.eq('author_id', author_id);
        }

        // Apply search filter if specified
        if (search) {
          query = query.or(
            `title.ilike.%${search}%, excerpt.ilike.%${search}%`
          );
        }

        // Apply ordering
        if (sort_order === 'asc') {
          query = query
            .order('published_at', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });
        } else {
          // Default descending order with featured articles first
          query = query
            .order('is_featured', { ascending: false })
            .order('featured_order', { ascending: true, nullsFirst: false })
            .order('published_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: articles, error, count: totalCount } = await query;

        if (error) {
          throw new DatabaseError('Failed to fetch articles', error);
        }

        return {
          articles: articles || [],
          pagination: {
            limit: limit,
            offset: offset,
            total: totalCount || 0,
            count: (articles || []).length,
            hasMore: offset + limit < (totalCount || 0),
          },
          filters: { status, author_id, search, sort_order },
        };
      },
      {
        ttl: CacheTTL.MEDIUM,
        tags: [CacheTags.ARTICLES],
      }
    );

    return createSuccessResponse(
      responseData,
      'Articles retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to generate excerpt from body
function generateExcerpt(body: string, maxLength: number = 150): string {
  // Remove markdown formatting for excerpt
  const plainText = body
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Cut at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (
    (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...'
  );
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    console.log(
      '🚀 [API] POST /api/articles - Request received, ID:',
      requestId
    );

    const rawBody = await request.text();
    console.log('📝 [API] Raw body length:', rawBody.length);

    // Validate request body using Zod schema (throws ValidationError if invalid)
    const {
      title,
      body_md,
      author_id,
      status,
      tags,
      excerpt,
      cover_image_url,
    } = await validateRequestBody(
      new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: rawBody,
      }),
      createArticleSchema
    );

    // Enforce DB-only tags: gather allowed tags from published articles
    if (tags && Array.isArray(tags)) {
      const invalid = (tags as string[])
        .map((t) => t.trim().toLowerCase())
        .filter((t) => !ALLOWED_TAG_SLUGS.has(t));
      if (invalid.length > 0) {
        throw new ValidationError(
          `Invalid tags: ${invalid.join(', ')}. Only predefined categories are allowed.`
        );
      }
    }

    console.log('✅ [API] Validation successful:', {
      title: title ? `"${title.substring(0, 50)}..."` : 'undefined',
      author_id: author_id,
      status: status,
      body_md_length: body_md ? body_md.length : 0,
      tags_count: tags ? tags.length : 0,
    });

    // Generate slug from title (Zod validation already completed)
    const slug = generateSlug(title.trim());

    // Check if slug already exists
    const { data: existingArticle, error: slugCheckError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single();

    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we want
      throw new DatabaseError(
        'Failed to check slug uniqueness',
        slugCheckError
      );
    }

    let finalSlug = slug;
    if (existingArticle) {
      // If slug exists, append timestamp to make it unique
      finalSlug = `${slug}-${Date.now()}`;
    }

    // Generate excerpt if not provided
    const finalExcerpt =
      excerpt && excerpt.trim() ? excerpt.trim() : generateExcerpt(body_md);

    // Prepare article data
    const now = new Date().toISOString();
    const articleData = {
      title: title.trim(),
      slug: finalSlug,
      body_md: body_md.trim(),
      author_id: author_id.trim(),
      status: status || 'draft',
      tags: (tags || []).map((t: string) => t.trim().toLowerCase()),
      excerpt: finalExcerpt,
      cover_image_url: cover_image_url || null,
      view_count: 0,
      created_at: now,
      updated_at: now,
      published_at: status === 'published' ? now : null,
    };

    // Insert article into database
    console.log('Attempting to insert article with data:', {
      title: articleData.title,
      author_id: articleData.author_id,
      status: articleData.status,
      slug: articleData.slug,
    });

    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .insert(articleData)
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        status,
        tags,
        view_count,
        created_at,
        updated_at,
        published_at,
        author_id
      `
      )
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        articleData: articleData,
      });
      throw new DatabaseError('Failed to create article', error);
    }

    console.log('Article created successfully:', {
      id: data?.id,
      title: data?.title,
      status: data?.status,
    });

    // Invalidate articles cache to ensure fresh data on subsequent requests
    queryCache.invalidateByTag(CacheTags.ARTICLES);

    return createSuccessResponse(
      data,
      'Article created successfully',
      requestId,
      201
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const rawBody = await request.text();

    // Validate request body using Zod schema
    const { title, body_md, status, tags, excerpt, cover_image_url } =
      await validateRequestBody(
        new NextRequest(request.url, {
          method: 'PUT',
          headers: request.headers,
          body: rawBody,
        }),
        updateArticleSchema.extend({
          id: z.string().uuid('Article ID must be valid UUID'),
          author_id: z.string().uuid('Author ID must be valid UUID'),
        })
      );

    const body = JSON.parse(rawBody);
    const { id, author_id } = body;

    // Validate required fields for PUT
    if (!id || !author_id) {
      throw new ValidationError('Missing required fields: id, author_id');
    }

    // Get existing article to verify ownership and current status
    const { data: existingArticle, error: fetchError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('id, title, slug, status, author_id')
        .eq('id', id)
        .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new ValidationError('Article not found');
      }
      throw new DatabaseError('Failed to fetch article', fetchError);
    }

    // Verify ownership
    if (existingArticle.author_id !== author_id) {
      throw new ValidationError('Unauthorized: You cannot edit this article');
    }

    // Only allow editing of drafts or rejected articles
    if (!['draft', 'rejected'].includes(existingArticle.status)) {
      throw new ValidationError(
        'Cannot edit articles that are pending or published'
      );
    }

    // Generate new slug if title changed
    let finalSlug = existingArticle.slug;
    if (title && title.trim() !== existingArticle.title) {
      const newSlug = generateSlug(title.trim());

      // Check if new slug already exists (excluding current article)
      const { data: slugExists, error: slugError } = await getSupabaseAdmin()
        .from('articles')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (slugError && slugError.code !== 'PGRST116') {
        throw new DatabaseError('Failed to check slug uniqueness', slugError);
      }

      if (slugExists) {
        finalSlug = `${newSlug}-${Date.now()}`;
      } else {
        finalSlug = newSlug;
      }
    }

    // Generate excerpt if not provided (use existing if no new body_md)
    const finalExcerpt =
      excerpt && excerpt.trim()
        ? excerpt.trim()
        : body_md
          ? generateExcerpt(body_md)
          : undefined;

    // Update article
    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
    };

    // Only include fields that have values
    if (title !== undefined) updateData.title = title.trim();
    if (finalSlug !== existingArticle.slug) updateData.slug = finalSlug;
    if (body_md !== undefined) updateData.body_md = body_md.trim();
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (finalExcerpt !== undefined) updateData.excerpt = finalExcerpt;
    if (cover_image_url !== undefined)
      updateData.cover_image_url = cover_image_url;

    console.log('Attempting to update article:', {
      id: id,
      title: updateData.title,
      status: updateData.status,
      slug: updateData.slug,
      existingStatus: existingArticle.status,
    });

    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        status,
        tags,
        view_count,
        created_at,
        updated_at,
        published_at,
        author_id
      `
      )
      .single();

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        updateData: updateData,
        articleId: id,
      });
      throw new DatabaseError('Failed to update article', error);
    }

    console.log('Article updated successfully:', {
      id: data?.id,
      title: data?.title,
      status: data?.status,
      updated_at: data?.updated_at,
    });

    // Invalidate articles cache to ensure fresh data on subsequent requests
    queryCache.invalidateByTag(CacheTags.ARTICLES);

    return createSuccessResponse(
      data,
      'Article updated successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
