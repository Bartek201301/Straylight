import { NextRequest, NextResponse } from 'next/server';
import { withAdminAPIAuth } from '@/lib/auth/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

interface ContentAnalytics {
  totalArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  draftArticles: number;
  archivedArticles: number;
  totalViews: number;
  averageViews: number;
  publishingTrend: {
    date: string;
    published: number;
    submitted: number;
  }[];
  topPerformingArticles: {
    id: string;
    title: string;
    slug: string;
    author_handle: string;
    view_count: number;
    published_at: string;
    tags: string[];
  }[];
  contentByTag: {
    tag: string;
    count: number;
    totalViews: number;
  }[];
  authorPerformance: {
    author_id: string;
    author_handle: string;
    article_count: number;
    total_views: number;
    average_views: number;
  }[];
}

/**
 * Content Analytics API Endpoint
 * GET /api/admin/analytics/content
 *
 * Provides comprehensive content performance analytics
 */
async function getContentAnalytics(
  request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  try {
    console.log('📝 Content analytics requested by:', context.user.email);
    const supabase = getSupabaseAdmin();

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(`📊 Analyzing content for ${days} days`);

    // Get article counts by status
    const [
      { count: totalArticles },
      { count: publishedArticles },
      { count: pendingArticles },
      { count: draftArticles },
      { count: archivedArticles },
    ] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'archived'),
    ]);

    // Get total views
    const { data: viewData, error: viewError } = await supabase
      .from('articles')
      .select('view_count')
      .eq('status', 'published');

    if (viewError) {
      console.error('❌ Failed to get view data:', viewError);
      throw new Error(`Failed to get view data: ${viewError.message}`);
    }

    const totalViews =
      viewData?.reduce((sum, article) => sum + (article.view_count || 0), 0) ||
      0;
    const averageViews =
      publishedArticles && publishedArticles > 0
        ? Math.round(totalViews / publishedArticles)
        : 0;

    // Get publishing trend for the specified period
    const { data: trendData, error: trendError } = await supabase
      .from('articles')
      .select('created_at, updated_at, status, published_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (trendError) {
      console.error('❌ Failed to get publishing trend:', trendError);
      throw new Error(`Failed to get publishing trend: ${trendError.message}`);
    }

    // Process publishing trend data
    const trendMap = new Map<
      string,
      { published: number; submitted: number }
    >();

    trendData?.forEach((article) => {
      const createdDate = article.created_at.split('T')[0];
      const publishedDate = article.published_at
        ? article.published_at.split('T')[0]
        : null;

      // Count submissions
      if (!trendMap.has(createdDate)) {
        trendMap.set(createdDate, { published: 0, submitted: 0 });
      }
      trendMap.get(createdDate)!.submitted += 1;

      // Count publications
      if (publishedDate && article.status === 'published') {
        if (!trendMap.has(publishedDate)) {
          trendMap.set(publishedDate, { published: 0, submitted: 0 });
        }
        trendMap.get(publishedDate)!.published += 1;
      }
    });

    const publishingTrend: {
      date: string;
      published: number;
      submitted: number;
    }[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const trend = trendMap.get(dateStr) || { published: 0, submitted: 0 };
      publishingTrend.push({
        date: dateStr,
        published: trend.published,
        submitted: trend.submitted,
      });
    }

    // Get top performing articles
    const { data: topArticles, error: topError } = await supabase
      .from('articles')
      .select(
        `
        id,
        title,
        slug,
        view_count,
        published_at,
        tags,
        author_id,
        users!articles_author_id_fkey(handle)
      `
      )
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10);

    if (topError) {
      console.error('❌ Failed to get top articles:', topError);
      throw new Error(`Failed to get top articles: ${topError.message}`);
    }

    const topPerformingArticles = (topArticles || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      author_handle: article.users?.handle || 'Unknown',
      view_count: article.view_count || 0,
      published_at: article.published_at,
      tags: article.tags || [],
    }));

    // Get content by tag analysis
    const { data: tagData, error: tagError } = await supabase
      .from('articles')
      .select('tags, view_count')
      .eq('status', 'published');

    if (tagError) {
      console.error('❌ Failed to get tag data:', tagError);
      throw new Error(`Failed to get tag data: ${tagError.message}`);
    }

    const tagMap = new Map<string, { count: number; totalViews: number }>();
    tagData?.forEach((article) => {
      const tags = article.tags || [];
      const views = article.view_count || 0;

      tags.forEach((tag: string) => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, { count: 0, totalViews: 0 });
        }
        const current = tagMap.get(tag)!;
        current.count += 1;
        current.totalViews += views;
      });
    });

    const contentByTag = Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        totalViews: data.totalViews,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Get author performance
    const { data: authorData, error: authorError } = await supabase
      .from('articles')
      .select(
        `
        author_id,
        view_count,
        users!articles_author_id_fkey(handle)
      `
      )
      .eq('status', 'published');

    if (authorError) {
      console.error('❌ Failed to get author data:', authorError);
      throw new Error(`Failed to get author data: ${authorError.message}`);
    }

    const authorMap = new Map<
      string,
      { handle: string; count: number; totalViews: number }
    >();
    authorData?.forEach((article: any) => {
      const authorId = article.author_id;
      const views = article.view_count || 0;
      const handle = article.users?.handle || 'Unknown';

      if (!authorMap.has(authorId)) {
        authorMap.set(authorId, { handle, count: 0, totalViews: 0 });
      }
      const current = authorMap.get(authorId)!;
      current.count += 1;
      current.totalViews += views;
    });

    const authorPerformance = Array.from(authorMap.entries())
      .map(([author_id, data]) => ({
        author_id,
        author_handle: data.handle,
        article_count: data.count,
        total_views: data.totalViews,
        average_views:
          data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
      }))
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 10);

    const analytics: ContentAnalytics = {
      totalArticles: totalArticles || 0,
      publishedArticles: publishedArticles || 0,
      pendingArticles: pendingArticles || 0,
      draftArticles: draftArticles || 0,
      archivedArticles: archivedArticles || 0,
      totalViews,
      averageViews,
      publishingTrend,
      topPerformingArticles,
      contentByTag,
      authorPerformance,
    };

    console.log('✅ Content analytics compiled successfully:', {
      totalArticles: analytics.totalArticles,
      totalViews: analytics.totalViews,
      topArticlesCount: analytics.topPerformingArticles.length,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Content analytics endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch content analytics',
        code: 'CONTENT_ANALYTICS_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply admin authentication middleware
export const GET = withAdminAPIAuth(getContentAnalytics);

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
