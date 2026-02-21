import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    // Get total published articles count
    const { count: totalArticles, error: countError } = await admin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (countError) {
      console.error('Error fetching articles count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch article statistics' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Get ALL published articles to calculate accurate cumulative counts
    const { data: articlesData, error: articlesError } = await admin
      .from('articles')
      .select('published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: true });

    if (articlesError) {
      console.error('Error fetching articles growth data:', articlesError);
      return NextResponse.json(
        { error: 'Failed to fetch article growth data' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Group articles by day to create smooth growth chart data
    const growthData = [];

    // Create daily buckets for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const dayEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      // Calculate cumulative articles up to this day
      const cumulativeArticles =
        articlesData?.filter((article) => {
          const publishDate = new Date(
            article.published_at || article.created_at
          );
          return publishDate <= dayEnd;
        }).length || 0;

      growthData.push({
        date: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
        value: cumulativeArticles,
      });
    }

    return NextResponse.json(
      {
        totalArticles: totalArticles || 0,
        growthData,
        growthPercentage: null,
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
    console.error('Error in articles stats API:', error);
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
