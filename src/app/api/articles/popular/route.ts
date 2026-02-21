import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PopularArticle } from '@/lib/supabase';

// Ensure this endpoint is never statically cached so leaderboard reflects fresh likes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/articles/popular - Get popular articles for leaderboard
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20); // Max 20, default 6

    // Use the database function to get popular articles with rankings
    const { data: popularArticles, error } = await supabase.rpc(
      'get_popular_articles',
      { limit_count: limit }
    );

    if (error) {
      console.error('Error fetching popular articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch popular articles' },
        { status: 500 }
      );
    }

    // Transform data to match PopularArticle interface
    const articles: PopularArticle[] = (popularArticles || [])
      .map((article: any): PopularArticle => {
        const likeCount = Number(article.like_count ?? 0);
        const viewCount = Number(article.view_count ?? 0);
        const createdAt = article.created_at;
        const publishedAt = article.published_at ?? article.created_at;

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || '',
          body_md: article.body_md || '',
          cover_image_url: article.cover_image_url,
          tags: article.tags || [],
          view_count: viewCount,
          like_count: likeCount,
          created_at: createdAt,
          published_at: publishedAt,
          author_handle: article.author_handle,
          author_display_name: article.author_display_name,
          author_avatar_url: article.author_avatar_url,
          rank_position: Number(article.rank_position ?? 0),
        } satisfies PopularArticle;
      })
      .sort((a: PopularArticle, b: PopularArticle) => {
        if (b.like_count !== a.like_count) {
          return b.like_count - a.like_count;
        }

        const aDate = new Date(a.published_at || a.created_at).getTime();
        const bDate = new Date(b.published_at || b.created_at).getTime();
        return bDate - aDate;
      })
      .map((article: PopularArticle, index: number) => ({
        ...article,
        rank_position: index + 1,
      }));

    return NextResponse.json(
      {
        articles,
        count: articles.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Popular articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
