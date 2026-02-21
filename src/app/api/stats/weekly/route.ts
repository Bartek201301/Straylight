import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    // Calculate date ranges
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Get new articles in the last 7 days
    const { count: newArticles, error: articlesError } = await admin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', weekAgo.toISOString());

    if (articlesError) {
      console.error('Error fetching weekly articles:', articlesError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly article statistics' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Get new articles from previous week for comparison
    const { count: previousWeekArticles, error: prevArticlesError } =
      await admin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', twoWeeksAgo.toISOString())
        .lt('published_at', weekAgo.toISOString());

    if (prevArticlesError) {
      console.error(
        'Error fetching previous week articles:',
        prevArticlesError
      );
    }

    // Get new tools in the last 7 days
    const { count: newTools, error: toolsError } = await admin
      .from('affiliate_library')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    if (toolsError) {
      console.error('Error fetching weekly tools:', toolsError);
      return NextResponse.json(
        { error: 'Failed to fetch weekly tools statistics' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Get new tools from previous week for comparison
    const { count: previousWeekTools, error: prevToolsError } = await admin
      .from('affiliate_library')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    if (prevToolsError) {
      console.error('Error fetching previous week tools:', prevToolsError);
    }

    // Calculate trends
    const articlesTrend = calculateTrend(
      newArticles || 0,
      previousWeekArticles || 0
    );
    const toolsTrend = calculateTrend(newTools || 0, previousWeekTools || 0);

    return NextResponse.json(
      {
        newArticles: newArticles || 0,
        newTools: newTools || 0,
        articlesTrend,
        toolsTrend,
        success: true,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in weekly stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

function calculateTrend(
  current: number,
  previous: number
): {
  direction: 'up' | 'down' | 'same';
  percentage: number;
} {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'same',
      percentage: current > 0 ? 100 : 0,
    };
  }

  const change = current - previous;
  const percentage = Math.round((Math.abs(change) / previous) * 100);

  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    percentage,
  };
}
