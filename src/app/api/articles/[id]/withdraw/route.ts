import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
  ValidationError,
  AuthenticationError,
} from '@/lib/errors/api-errors';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();

  try {
    const { id } = params;

    if (!id) {
      throw new ValidationError('Article ID is required');
    }

    // Get the Authorization header to verify user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization required');
    }

    const userId = authHeader.replace('Bearer ', '');

    // First, check if the article exists and belongs to the user
    const { data: existingArticle, error: fetchError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('id, author_id, status, title')
        .eq('id', id)
        .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new ValidationError('Article not found');
      }
      throw new DatabaseError('Failed to fetch article', fetchError);
    }

    // Check if user owns the article
    if (existingArticle.author_id !== userId) {
      throw new AuthenticationError('You can only withdraw your own articles');
    }

    // Check if article is in a withdrawable state
    if (existingArticle.status !== 'pending') {
      throw new ValidationError('Only articles under review can be withdrawn');
    }

    // Update the article status to draft
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
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
      throw new DatabaseError('Failed to withdraw article', error);
    }

    return createSuccessResponse(
      data,
      'Article withdrawn successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
