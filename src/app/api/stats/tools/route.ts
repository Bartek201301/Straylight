import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    // Get total tools count
    const { count: totalTools, error: countError } = await admin
      .from('affiliate_library')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching tools count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch tools statistics' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Get ALL tools to calculate accurate cumulative counts
    const { data: toolsData, error: toolsError } = await admin
      .from('affiliate_library')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (toolsError) {
      console.error('Error fetching tools growth data:', toolsError);
      return NextResponse.json(
        { error: 'Failed to fetch tools growth data' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Group tools by day to create smooth growth chart data
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

      // Calculate cumulative tools up to this day
      const cumulativeTools =
        toolsData?.filter((tool) => {
          const toolDate = new Date(tool.created_at);
          return toolDate <= dayEnd;
        }).length || 0;

      growthData.push({
        date: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
        value: cumulativeTools,
      });
    }

    return NextResponse.json(
      {
        totalTools: totalTools || 0,
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
    console.error('Error in tools stats API:', error);
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
