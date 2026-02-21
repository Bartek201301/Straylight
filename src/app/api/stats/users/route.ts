import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    // Get total user count
    const { count: totalUsers, error: countError } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching user count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Get ALL users to calculate accurate cumulative counts
    const { data: usersData, error: usersError } = await admin
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('Error fetching users growth data:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user growth data' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Group users by day to create smooth growth chart data
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

      // Calculate cumulative users up to this day
      const cumulativeUsers =
        usersData?.filter((user) => {
          const userDate = new Date(user.created_at);
          return userDate <= dayEnd;
        }).length || 0;

      growthData.push({
        date: `${dayStart.getDate()}/${dayStart.getMonth() + 1}`,
        value: cumulativeUsers,
      });
    }

    // Calculate growth percentage (comparing current month to previous month)
    // Get users count from 30 days ago vs 60 days ago for proper monthly comparison
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { count: previousMonthUsers } = await admin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo.toISOString());

    const currentMonthUsers = totalUsers || 0;
    const prevMonthUserCount = previousMonthUsers || 0;

    const growthPercentage =
      prevMonthUserCount > 0
        ? Math.round(
            ((currentMonthUsers - prevMonthUserCount) / prevMonthUserCount) *
              100
          )
        : currentMonthUsers > 0
          ? 100
          : 0;

    return NextResponse.json(
      {
        totalUsers: totalUsers || 0,
        growthData,
        growthPercentage,
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
    console.error('Error in users stats API:', error);
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
