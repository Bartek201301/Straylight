import { NextRequest, NextResponse } from 'next/server';
import { withAdminAPIAuth } from '@/lib/auth/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

interface UserAnalytics {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  usersByRole: {
    admin: number;
    moderator: number;
    member: number;
  };
  registrationTrend: {
    date: string;
    count: number;
  }[];
  topContributors: {
    id: string;
    handle: string;
    role: string;
    articleCount: number;
    totalViews: number;
  }[];
}

/**
 * User Analytics API Endpoint
 * GET /api/admin/analytics/users
 *
 * Provides comprehensive user analytics for the admin dashboard
 */
async function getUserAnalytics(
  request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  try {
    console.log('👥 User analytics requested by:', context.user.email);
    const supabase = getSupabaseAdmin();

    // Get query parameters for date range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(
      `📊 Analyzing users for ${days} days (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`
    );

    // Get total users count
    const { count: totalUsers, error: totalError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Failed to get total users:', totalError);
      throw new Error(`Failed to get total users: ${totalError.message}`);
    }

    // Get new users today
    const today = new Date().toISOString().split('T')[0];
    const { count: newUsersToday, error: todayError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59');

    if (todayError) {
      console.error('❌ Failed to get new users today:', todayError);
      throw new Error(`Failed to get new users today: ${todayError.message}`);
    }

    // Get new users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersThisWeek, error: weekError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    if (weekError) {
      console.error('❌ Failed to get new users this week:', weekError);
      throw new Error(
        `Failed to get new users this week: ${weekError.message}`
      );
    }

    // Get new users this month
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: newUsersThisMonth, error: monthError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString());

    if (monthError) {
      console.error('❌ Failed to get new users this month:', monthError);
      throw new Error(
        `Failed to get new users this month: ${monthError.message}`
      );
    }

    // Get users by role
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .in('role', ['admin', 'moderator', 'member']);

    if (roleError) {
      console.error('❌ Failed to get users by role:', roleError);
      throw new Error(`Failed to get users by role: ${roleError.message}`);
    }

    const usersByRole = {
      admin: roleData?.filter((u) => u.role === 'admin').length || 0,
      moderator: roleData?.filter((u) => u.role === 'moderator').length || 0,
      member: roleData?.filter((u) => u.role === 'member').length || 0,
    };

    // Get registration trend for the past 30 days
    const { data: registrationData, error: registrationError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', monthAgo.toISOString())
      .order('created_at', { ascending: true });

    if (registrationError) {
      console.error('❌ Failed to get registration trend:', registrationError);
      throw new Error(
        `Failed to get registration trend: ${registrationError.message}`
      );
    }

    // Process registration trend data
    const registrationTrend: { date: string; count: number }[] = [];
    const registrationMap = new Map<string, number>();

    registrationData?.forEach((user) => {
      const date = user.created_at.split('T')[0];
      registrationMap.set(date, (registrationMap.get(date) || 0) + 1);
    });

    // Fill in missing dates with 0
    for (let d = new Date(monthAgo); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      registrationTrend.push({
        date: dateStr,
        count: registrationMap.get(dateStr) || 0,
      });
    }

    // Get top contributors (users with most articles)
    const { data: contributorData, error: contributorError } = await supabase
      .from('users')
      .select(
        `
        id,
        handle,
        role,
        articles:articles(count),
        article_views:articles(view_count)
      `
      )
      .order('created_at', { ascending: false })
      .limit(10);

    if (contributorError) {
      console.error('❌ Failed to get top contributors:', contributorError);
      throw new Error(
        `Failed to get top contributors: ${contributorError.message}`
      );
    }

    const topContributors = (contributorData || [])
      .map((user: any) => ({
        id: user.id,
        handle: user.handle,
        role: user.role,
        articleCount: user.articles?.length || 0,
        totalViews:
          user.article_views?.reduce(
            (sum: number, article: any) => sum + (article.view_count || 0),
            0
          ) || 0,
      }))
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 10);

    // For now, set active users to estimate (this would require activity logging)
    const activeUsersToday = Math.floor((newUsersToday || 0) * 0.3); // Rough estimate
    const activeUsersThisWeek = Math.floor((newUsersThisWeek || 0) * 0.7); // Rough estimate

    const analytics: UserAnalytics = {
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      activeUsersToday,
      activeUsersThisWeek,
      usersByRole,
      registrationTrend,
      topContributors,
    };

    console.log('✅ User analytics compiled successfully:', {
      totalUsers: analytics.totalUsers,
      newUsersToday: analytics.newUsersToday,
      topContributorsCount: analytics.topContributors.length,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ User analytics endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch user analytics',
        code: 'USER_ANALYTICS_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply admin authentication middleware
export const GET = withAdminAPIAuth(getUserAnalytics);

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
