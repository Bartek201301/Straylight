import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { ALLOWED_TAG_SLUGS } from '@/lib/constants/tags';
import {
  validateRequestBody,
  validateUrlParam,
} from '@/lib/middleware/validation';
import { updateArticleSchema, uuidSchema } from '@/lib/validation/articles';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  NotFoundError,
  ConflictError,
  DatabaseError,
  AuthenticationError,
  ValidationError,
} from '@/lib/errors/api-errors';
import { queryCache, CacheTags } from '@/lib/cache/query-cache';

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

// GET /api/articles/[id] - Get article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();

  try {
    const { id } = params;

    // Validate article ID using Zod schema
    validateUrlParam(id, uuidSchema, 'article ID');

    // Get article from database
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        body_md,
        excerpt,
        cover_image_url,
        status,
        tags,
        view_count,
        created_at,
        updated_at,
        published_at,
        author_id
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        throw new NotFoundError('Article');
      }
      throw new DatabaseError('Failed to fetch article', error);
    }

    if (!data) {
      throw new NotFoundError('Article');
    }

    // Update view count (non-blocking)
    try {
      void getSupabaseAdmin()
        .from('articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
      console.log(`View count increment initiated for article ${id}`);
    } catch (viewCountError) {
      console.error(`Failed to update view count: ${viewCountError}`);
      // Continue since view count is non-critical
    }

    return createSuccessResponse(
      data,
      'Article retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();

  try {
    const { id } = params;

    // Validate article ID using Zod schema (throws ValidationError if invalid)
    validateUrlParam(id, uuidSchema, 'article ID');

    // Validate request body using Zod schema (throws ValidationError if invalid)
    const updateData = await validateRequestBody(request, updateArticleSchema);

    // Get the existing article first
    const { data: existingArticle, error: fetchError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Article');
      }
      throw new DatabaseError('Failed to fetch article for update', fetchError);
    }

    if (!existingArticle) {
      throw new NotFoundError('Article');
    }

    // Extract update fields from validated body (author_id cannot be updated via this endpoint)
    const { title, body_md, status, tags, excerpt, cover_image_url } =
      updateData;

    // Note: Author ownership validation would be implemented here with proper JWT verification
    // For now, we allow updates (in production, check JWT token and permissions)

    // Prepare database update object with only changed fields
    const dbUpdateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Update title if provided (Zod validation already completed)
    if (title !== undefined) {
      dbUpdateData.title = title.trim();

      // Generate new slug if title changed
      if (title.trim() !== existingArticle.title) {
        const newSlug = generateSlug(title.trim());

        // Check if new slug already exists (by different article)
        const { data: slugCheck } = await getSupabaseAdmin()
          .from('articles')
          .select('id')
          .eq('slug', newSlug)
          .neq('id', id)
          .single();

        dbUpdateData.slug = slugCheck ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }

    // Update body_md if provided (Zod validation already completed)
    if (body_md !== undefined) {
      dbUpdateData.body_md = body_md.trim();

      // Update excerpt if body changed and no custom excerpt provided
      if (excerpt === undefined) {
        dbUpdateData.excerpt = generateExcerpt(body_md.trim());
      }
    }

    // Update status if provided (Zod validation already completed)
    if (status !== undefined) {
      dbUpdateData.status = status;

      // Update published_at when status changes to published
      if (status === 'published' && existingArticle.status !== 'published') {
        dbUpdateData.published_at = new Date().toISOString();
      } else if (
        status !== 'published' &&
        existingArticle.status === 'published'
      ) {
        // If unpublishing, clear published_at
        dbUpdateData.published_at = undefined;
      }
    }

    // Validate and update tags if provided
    if (tags !== undefined) {
      if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Tags must be an array of strings',
          },
          { status: 400 }
        );
      }

      // Enforce DB-only tags for updates: allow only tags seen in published articles
      const normalized = tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

      const invalid = normalized.filter((t) => !ALLOWED_TAG_SLUGS.has(t));
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: `Invalid tags: ${invalid.join(', ')}. Only predefined categories are allowed.`,
          },
          { status: 400 }
        );
      }

      dbUpdateData.tags = normalized;
    }

    // Update custom excerpt if provided (Zod validation already completed)
    if (excerpt !== undefined) {
      dbUpdateData.excerpt = excerpt.trim() || undefined;
    }

    if (cover_image_url !== undefined) {
      dbUpdateData.cover_image_url = cover_image_url || null;
    }

    // Perform the update
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .update(dbUpdateData)
      .eq('id', id)
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
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
      throw new DatabaseError('Failed to update article', error);
    }

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

// DELETE /api/articles/[id] - Delete article (hard delete for drafts, soft delete for others)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();

  try {
    const { id } = params;

    // Validate article ID using Zod schema (throws ValidationError if invalid)
    validateUrlParam(id, uuidSchema, 'article ID');

    // Get the Authorization header to verify user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization required');
    }

    const userId = authHeader.replace('Bearer ', '');

    // Get the existing article first
    const { data: existingArticle, error: fetchError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new NotFoundError('Article');
      }
      throw new DatabaseError(
        'Failed to fetch article for deletion',
        fetchError
      );
    }

    if (!existingArticle) {
      throw new NotFoundError('Article');
    }

    // Check if user owns the article (only allow users to delete their own articles)
    if (existingArticle.author_id !== userId) {
      throw new AuthenticationError('You can only delete your own articles');
    }

    // Check if article can be deleted
    if (existingArticle.status === 'published') {
      throw new ValidationError(
        'Published articles cannot be deleted. Please contact an administrator if you need to remove a published article.'
      );
    }

    if (existingArticle.status === 'archived') {
      throw new ConflictError('Article is already archived');
    }

    // For drafts, perform hard delete. For others, soft delete
    if (existingArticle.status === 'draft') {
      // Hard delete for drafts
      const { error: deleteError } = await getSupabaseAdmin()
        .from('articles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new DatabaseError('Failed to delete draft', deleteError);
      }

      // Invalidate articles cache after deletion
      queryCache.invalidateByTag(CacheTags.ARTICLES);

      return createSuccessResponse(
        {
          id: id,
          title: existingArticle.title,
          deleted: true,
        },
        'Draft deleted successfully',
        requestId
      );
    } else {
      // Soft delete by archiving for non-draft articles
      const { data, error } = await getSupabaseAdmin()
        .from('articles')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new DatabaseError('Failed to archive article', error);
      }

      // Invalidate articles cache after archiving
      queryCache.invalidateByTag(CacheTags.ARTICLES);

      return createSuccessResponse(
        {
          id: data.id,
          title: data.title,
          status: data.status,
          archived_at: data.updated_at,
        },
        'Article archived successfully',
        requestId
      );
    }
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
