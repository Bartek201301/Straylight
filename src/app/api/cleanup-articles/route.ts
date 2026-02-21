import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
} from '@/lib/errors/api-errors';

// Cleanup endpoint to remove test articles and orphaned data
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'test'; // 'test' or 'all'

    let deletedCount = 0;

    if (mode === 'test') {
      // Remove articles with test-like titles or specific patterns
      const { data: testArticles, error: findError } = await getSupabaseAdmin()
        .from('articles')
        .select('id, title, slug')
        .or(
          'title.ilike.%test%, title.ilike.%debug%, slug.ilike.%test%, slug.ilike.%debug%, title.eq.Untitled Draft'
        );

      if (findError) {
        throw new DatabaseError('Failed to find test articles', findError);
      }

      if (testArticles && testArticles.length > 0) {
        const testIds = testArticles.map((article) => article.id);

        const { error: deleteError } = await getSupabaseAdmin()
          .from('articles')
          .delete()
          .in('id', testIds);

        if (deleteError) {
          throw new DatabaseError(
            'Failed to delete test articles',
            deleteError
          );
        }

        deletedCount = testArticles.length;
      }
    } else if (mode === 'orphaned') {
      // Remove articles where author doesn't exist in users table
      const { data: orphanedArticles, error: findError } =
        await getSupabaseAdmin()
          .from('articles')
          .select(
            `
          id, 
          title, 
          author_id,
          users!articles_author_id_fkey (id)
        `
          )
          .is('users.id', null);

      if (findError) {
        throw new DatabaseError('Failed to find orphaned articles', findError);
      }

      if (orphanedArticles && orphanedArticles.length > 0) {
        const orphanedIds = orphanedArticles.map((article) => article.id);

        const { error: deleteError } = await getSupabaseAdmin()
          .from('articles')
          .delete()
          .in('id', orphanedIds);

        if (deleteError) {
          throw new DatabaseError(
            'Failed to delete orphaned articles',
            deleteError
          );
        }

        deletedCount = orphanedArticles.length;
      }
    }

    return createSuccessResponse(
      {
        mode,
        deletedCount,
        message: `Cleaned up ${deletedCount} articles`,
      },
      'Article cleanup completed successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// Get cleanup statistics
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Get test articles count
    const { count: testCount } = await getSupabaseAdmin()
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .or(
        'title.ilike.%test%, title.ilike.%debug%, slug.ilike.%test%, slug.ilike.%debug%, title.eq.Untitled Draft'
      );

    // Get orphaned articles count
    const { count: orphanedCount } = await getSupabaseAdmin()
      .from('articles')
      .select(
        `
        id,
        users!articles_author_id_fkey (id)
      `,
        { count: 'exact', head: true }
      )
      .is('users.id', null);

    // Get total articles count
    const { count: totalCount } = await getSupabaseAdmin()
      .from('articles')
      .select('*', { count: 'exact', head: true });

    // Get articles by status
    const { data: statusBreakdown } = await getSupabaseAdmin()
      .from('articles')
      .select('status')
      .not('status', 'is', null);

    const statusCounts =
      statusBreakdown?.reduce(
        (acc, article) => {
          acc[article.status] = (acc[article.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return createSuccessResponse(
      {
        total: totalCount || 0,
        testArticles: testCount || 0,
        orphanedArticles: orphanedCount || 0,
        statusBreakdown: statusCounts,
        cleanupRecommendations: {
          shouldCleanTest: (testCount || 0) > 0,
          shouldCleanOrphaned: (orphanedCount || 0) > 0,
        },
      },
      'Cleanup statistics retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
