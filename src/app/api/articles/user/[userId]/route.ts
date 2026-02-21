import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
  ValidationError,
} from '@/lib/errors/api-errors';

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();

  try {
    const { userId } = params;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Get articles for the specific user
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        body_md,
        excerpt,
        status,
        tags,
        view_count,
        created_at,
        updated_at,
        published_at,
        author_id,
        cover_image_url
      `
      )
      .eq('author_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Database error details:', error);
      throw new DatabaseError('Failed to fetch user articles', error);
    }

    // Handle empty results gracefully
    const articles = data || [];

    // Calculate statistics
    const stats = articles.reduce(
      (acc, article) => {
        acc.total++;
        switch (article.status) {
          case 'draft':
            acc.drafts++;
            break;
          case 'pending':
            acc.pending++;
            break;
          case 'published':
            acc.published++;
            break;
          case 'rejected':
            acc.rejected++;
            break;
          case 'archived':
            acc.archived++;
            break;
        }
        return acc;
      },
      {
        total: 0,
        drafts: 0,
        pending: 0,
        published: 0,
        rejected: 0,
        archived: 0,
      }
    );

    const responseData = {
      articles,
      stats,
      count: articles.length,
    };

    return createSuccessResponse(
      responseData,
      'User articles retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
