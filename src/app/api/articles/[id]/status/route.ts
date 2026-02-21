import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
  ValidationError,
  AuthenticationError,
} from '@/lib/errors/api-errors';

// PATCH /api/articles/[id]/status - Update article status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();

  try {
    const { id } = params;
    const body = await request.json();

    const { status, author_id } = body;

    if (!id) {
      throw new ValidationError('Article ID is required');
    }

    if (!status || !author_id) {
      throw new ValidationError('Missing required fields: status, author_id');
    }

    // Validate status value
    const validStatuses = ['draft', 'pending', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    // Get existing article to verify ownership
    const { data: existingArticle, error: fetchError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('id, status, author_id, title')
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
      throw new AuthenticationError('You cannot modify this article');
    }

    // Validate status transitions based on current status
    const allowedTransitions: Record<string, string[]> = {
      draft: ['pending', 'archived'],
      rejected: ['draft', 'pending', 'archived'],
      pending: ['draft'], // Only allow withdrawal to draft
      published: [], // Published articles cannot change status (admin only)
      archived: ['draft'], // Allow unarchiving
    };

    if (!allowedTransitions[existingArticle.status]?.includes(status)) {
      throw new ValidationError(
        `Cannot change status from ${existingArticle.status} to ${status}. Allowed transitions: ${allowedTransitions[existingArticle.status]?.join(', ') || 'none'}`
      );
    }

    // Update article status
    const now = new Date().toISOString();
    const updateData: any = {
      status,
      updated_at: now,
    };

    // Set published_at when publishing (shouldn't happen through user action, but for completeness)
    if (status === 'published' && existingArticle.status !== 'published') {
      updateData.published_at = now;
    } else if (
      status !== 'published' &&
      existingArticle.status === 'published'
    ) {
      // If unpublishing, clear published_at
      updateData.published_at = null;
    }

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
      console.error('Database error details:', error);
      throw new DatabaseError('Failed to update article status', error);
    }

    // Return appropriate message based on status change
    let message = `Article status updated to ${status}`;
    if (status === 'pending') {
      message = 'Article submitted for review';
    } else if (status === 'draft') {
      message =
        existingArticle.status === 'pending'
          ? 'Article withdrawn from review'
          : 'Article moved to drafts';
    } else if (status === 'archived') {
      message = 'Article archived';
    }

    return createSuccessResponse(data, message, requestId);
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// Only allow PATCH method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'PATCH' } }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'PATCH' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'PATCH' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'PATCH' } }
  );
}
