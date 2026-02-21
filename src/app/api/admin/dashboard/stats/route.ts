import { NextRequest, NextResponse } from 'next/server';
import { withAdminAPIAuth } from '@/lib/auth/api-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  queryCache,
  CacheKeys,
  CacheTags,
  CacheTTL,
} from '@/lib/cache/query-cache';

interface DashboardStats {
  pendingArticles: number;
  publishedToday: number;
  totalUsers: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type:
    | 'article_submitted'
    | 'article_approved'
    | 'article_rejected'
    | 'user_registered';
  title: string;
  subtitle: string;
  timestamp: string;
  metadata: Record<string, any>;
}

/**
 * Dashboard Stats API Endpoint
 * GET /api/admin/dashboard/stats
 *
 * Provides aggregated statistics for the admin dashboard
 */
async function getDashboardStats(
  _request: NextRequest,
  context: { user: { id: string; email: string; role: string } }
) {
  try {
    console.log('📊 Dashboard stats requested by:', {
      userId: context.user.id,
      email: context.user.email,
      role: context.user.role,
    });

    // Use cached query with optimized database function
    const statsData = await queryCache.get(
      CacheKeys.adminStats(),
      async () => {
        console.log('🔄 Fetching fresh admin stats from database...');

        const { data, error } = await getSupabaseAdmin().rpc(
          'get_admin_dashboard_stats'
        );

        if (error) {
          console.error('❌ Failed to fetch admin dashboard stats:', {
            error: error.message,
            code: error.code,
            details: error.details,
          });
          throw new Error(
            `Failed to fetch admin dashboard stats: ${error.message}`
          );
        }

        if (!data || data.length === 0) {
          throw new Error('No stats data returned from database');
        }

        const stats = data[0];

        // Transform recent activity JSONB to ActivityItem array
        const recentActivity: ActivityItem[] = (
          stats.recent_activity || []
        ).map((activity: any) => ({
          id: activity.id,
          type: activity.activity_type,
          title: `${
            activity.activity_type === 'article_submitted'
              ? 'New article submitted'
              : activity.activity_type === 'article_approved'
                ? 'Article approved'
                : activity.activity_type === 'article_rejected'
                  ? 'Article rejected'
                  : 'Article updated'
          }: "${activity.title}"`,
          subtitle: `By ${activity.author_display_name || activity.author_handle}`,
          timestamp:
            activity.activity_type === 'article_approved'
              ? activity.published_at || activity.updated_at
              : activity.updated_at,
          metadata: {
            articleId: activity.id,
            articleTitle: activity.title,
            authorHandle: activity.author_handle,
            status: activity.status,
          },
        }));

        return {
          pendingArticles: Number(stats.pending_articles) || 0,
          publishedToday: Number(stats.published_today) || 0,
          totalUsers: Number(stats.total_users) || 0,
          totalArticles: Number(stats.total_articles) || 0,
          totalVotes: Number(stats.total_votes) || 0,
          totalViews: Number(stats.total_views) || 0,
          affiliateItems: Number(stats.affiliate_items) || 0,
          librarySubmissions: Number(stats.library_submissions) || 0,
          recentActivity,
        };
      },
      {
        ttl: CacheTTL.SHORT, // 1 minute cache for admin stats
        tags: [CacheTags.DASHBOARD, CacheTags.ARTICLES, CacheTags.USERS],
      }
    );

    // Create response with the required DashboardStats structure
    const dashboardStats: DashboardStats = {
      pendingArticles: statsData.pendingArticles,
      publishedToday: statsData.publishedToday,
      totalUsers: statsData.totalUsers,
      recentActivity: statsData.recentActivity,
    };

    // Include additional stats in metadata
    const responseData = {
      ...dashboardStats,
      metadata: {
        totalArticles: statsData.totalArticles,
        totalVotes: statsData.totalVotes,
        totalViews: statsData.totalViews,
        affiliateItems: statsData.affiliateItems,
        librarySubmissions: statsData.librarySubmissions,
        cacheHit: true, // Will be false on first request
      },
    };

    console.log('✅ Dashboard stats compiled successfully:', {
      pendingArticles: dashboardStats.pendingArticles,
      publishedToday: dashboardStats.publishedToday,
      totalUsers: dashboardStats.totalUsers,
      activityItems: dashboardStats.recentActivity.length,
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard stats endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard statistics',
        code: 'STATS_FETCH_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply admin authentication middleware
export const GET = withAdminAPIAuth(getDashboardStats);

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
