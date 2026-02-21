import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ArticleWithAuthor } from '@/lib/supabase';

// GET /api/articles/newest - Get newest published articles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20); // Max 20, default 5

    // Fetch newest published articles with author information
    const { data: articles, error } = await supabase
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        excerpt,
        body_md,
        cover_image_url,
        tags,
        view_count,
        created_at,
        published_at,
        author_id,
        users!articles_author_id_fkey (
          handle,
          display_name,
          avatar_url
        )
      `
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching newest articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch newest articles' },
        { status: 500 }
      );
    }

    // Transform data to match ArticleWithAuthor interface
    const newestArticles: ArticleWithAuthor[] = (articles || []).map(
      (article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        body_md: article.body_md || '',
        excerpt: article.excerpt || '',
        cover_image_url: article.cover_image_url,
        tags: article.tags || [],
        view_count: article.view_count || 0,
        status: 'published' as const,
        author_id: article.author_id,
        created_at: article.created_at,
        updated_at: article.created_at, // Will be updated if needed
        published_at: article.published_at,
        is_featured: false, // Not relevant for newest
        featured_order: null,
        users: article.users
          ? {
              handle: article.users.handle,
              display_name: article.users.display_name,
              avatar_url: article.users.avatar_url,
            }
          : undefined,
      })
    );

    return NextResponse.json({
      articles: newestArticles,
      count: newestArticles.length,
    });
  } catch (error) {
    console.error('Newest articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
