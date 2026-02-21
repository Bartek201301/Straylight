import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
} from '@/lib/errors/api-errors';

// Debug endpoint to test article creation and fetching
export async function GET(_request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Get all articles to debug
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new DatabaseError('Failed to fetch articles for debug', error);
    }

    return createSuccessResponse(
      {
        articles: data || [],
        count: data?.length || 0,
        debug: {
          timestamp: new Date().toISOString(),
          supabaseAdmin: !!getSupabaseAdmin(),
        },
      },
      'Debug articles retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// Debug endpoint to create a test article
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();

    // Create test article with minimal data
    const now = new Date().toISOString();
    const testArticle = {
      title: body.title || 'Debug Test Article',
      slug: `debug-test-${Date.now()}`,
      body_md: body.body_md || '# Debug Test\n\nThis is a test article.',
      author_id: body.author_id,
      status: body.status || 'draft',
      tags: body.tags || ['debug', 'test'],
      excerpt: body.excerpt || 'Debug test article',
      view_count: 0,
      created_at: now,
      updated_at: now,
      published_at: null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .insert(testArticle)
      .select('*')
      .single();

    if (error) {
      throw new DatabaseError('Failed to create debug article', error);
    }

    return createSuccessResponse(
      {
        article: data,
        debug: {
          timestamp: now,
          originalBody: body,
          processedData: testArticle,
        },
      },
      'Debug article created successfully',
      requestId,
      201
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
