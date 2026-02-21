// ============================================================================
// SEARCH ANALYTICS API ENDPOINT
// ============================================================================
// Provides analytics and insights about search behavior, popular queries,
// performance metrics, and search trends for optimization purposes.
// ============================================================================

import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
} from '@/lib/errors/api-errors';
import { validateAnalyticsQuery } from '@/lib/validation/search';
import { getPopularSearchQueries } from '@/lib/services/search-service';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const { period, top_queries_limit } = validateAnalyticsQuery(searchParams);

    // Calculate date range based on period
    const now = new Date();
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(now.getTime() - periodMs[period]);

    // Fetch analytics data in parallel
    const [
      searchStats,
      popularQueries,
      queryTrends,
      performanceMetrics,
      contentMetrics,
    ] = await Promise.all([
      getSearchStatistics(startDate, now),
      getPopularSearchQueries(top_queries_limit),
      getQueryTrends(period, startDate, now),
      getPerformanceMetrics(startDate, now),
      getContentMetrics(),
    ]);

    const analytics = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      overview: {
        totalSearches: searchStats.totalSearches,
        uniqueQueries: searchStats.uniqueQueries,
        avgResponseTime: searchStats.avgResponseTime,
        avgResultCount: searchStats.avgResultCount,
        successRate: searchStats.successRate,
      },
      popularQueries,
      trends: queryTrends,
      performance: performanceMetrics,
      content: contentMetrics,
      insights: generateInsights(
        searchStats,
        popularQueries,
        performanceMetrics
      ),
    };

    return createSuccessResponse(
      analytics,
      'Search analytics retrieved',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Gets basic search statistics for the given period
 */
async function getSearchStatistics(startDate: Date, endDate: Date) {
  try {
    const { data: searchStats, error } = await supabase
      .from('search_statistics')
      .select('query, result_count, response_time_ms, search_timestamp')
      .gte('search_timestamp', startDate.toISOString())
      .lte('search_timestamp', endDate.toISOString())
      .order('search_timestamp', { ascending: false });

    if (error) throw error;

    const stats = searchStats || [];
    const totalSearches = stats.length;
    const uniqueQueries = new Set(stats.map((s) => s.query.toLowerCase())).size;

    const totalResponseTime = stats.reduce(
      (sum, s) => sum + (s.response_time_ms || 0),
      0
    );
    const avgResponseTime =
      totalSearches > 0 ? Math.round(totalResponseTime / totalSearches) : 0;

    const totalResults = stats.reduce(
      (sum, s) => sum + (s.result_count || 0),
      0
    );
    const avgResultCount =
      totalSearches > 0
        ? Math.round((totalResults / totalSearches) * 10) / 10
        : 0;

    const successfulSearches = stats.filter(
      (s) => (s.result_count || 0) > 0
    ).length;
    const successRate =
      totalSearches > 0
        ? Math.round((successfulSearches / totalSearches) * 100)
        : 0;

    return {
      totalSearches,
      uniqueQueries,
      avgResponseTime,
      avgResultCount,
      successRate,
      rawStats: stats,
    };
  } catch (error) {
    console.error('Error getting search statistics:', error);
    return {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResponseTime: 0,
      avgResultCount: 0,
      successRate: 0,
      rawStats: [],
    };
  }
}

/**
 * Gets search query trends over time
 */
async function getQueryTrends(period: string, startDate: Date, endDate: Date) {
  try {
    const { data: searchStats, error } = await supabase
      .from('search_statistics')
      .select('query, search_timestamp, result_count')
      .gte('search_timestamp', startDate.toISOString())
      .lte('search_timestamp', endDate.toISOString())
      .order('search_timestamp', { ascending: true });

    if (error) throw error;

    // Group by time intervals based on period
    const intervalMs = {
      day: 60 * 60 * 1000, // 1 hour intervals
      week: 24 * 60 * 60 * 1000, // 1 day intervals
      month: 7 * 24 * 60 * 60 * 1000, // 1 week intervals
      year: 30 * 24 * 60 * 60 * 1000, // 1 month intervals
    };

    const interval = intervalMs[period as keyof typeof intervalMs];
    const trends = new Map<number, { searches: number; avgResults: number }>();

    (searchStats || []).forEach((stat) => {
      const timestamp = new Date(stat.search_timestamp).getTime();
      const intervalKey = Math.floor(timestamp / interval) * interval;

      const existing = trends.get(intervalKey) || {
        searches: 0,
        avgResults: 0,
      };
      existing.searches += 1;
      existing.avgResults =
        (existing.avgResults * (existing.searches - 1) +
          (stat.result_count || 0)) /
        existing.searches;
      trends.set(intervalKey, existing);
    });

    // Convert to array format
    return Array.from(trends.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp).toISOString(),
        searches: data.searches,
        avgResults: Math.round(data.avgResults * 10) / 10,
      }));
  } catch (error) {
    console.error('Error getting query trends:', error);
    return [];
  }
}

/**
 * Gets performance metrics breakdown
 */
async function getPerformanceMetrics(startDate: Date, endDate: Date) {
  try {
    const { data: searchStats, error } = await supabase
      .from('search_statistics')
      .select('response_time_ms, result_count')
      .gte('search_timestamp', startDate.toISOString())
      .lte('search_timestamp', endDate.toISOString());

    if (error) throw error;

    const stats = searchStats || [];
    const responseTimes = stats
      .map((s) => s.response_time_ms || 0)
      .filter((t) => t > 0);

    if (responseTimes.length === 0) {
      return {
        responseTime: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        resultCounts: { min: 0, max: 0, avg: 0, median: 0 },
        distribution: { fast: 0, medium: 0, slow: 0 },
      };
    }

    responseTimes.sort((a, b) => a - b);
    const resultCounts = stats
      .map((s) => s.result_count || 0)
      .sort((a, b) => a - b);

    const responseTimeMetrics = {
      min: responseTimes[0],
      max: responseTimes[responseTimes.length - 1],
      avg: Math.round(
        responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      ),
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
    };

    const resultCountMetrics = {
      min: resultCounts[0],
      max: resultCounts[resultCounts.length - 1],
      avg:
        Math.round(
          (resultCounts.reduce((sum, c) => sum + c, 0) / resultCounts.length) *
            10
        ) / 10,
      median: resultCounts[Math.floor(resultCounts.length / 2)],
    };

    // Categorize response times
    const distribution = {
      fast: responseTimes.filter((t) => t < 200).length,
      medium: responseTimes.filter((t) => t >= 200 && t < 1000).length,
      slow: responseTimes.filter((t) => t >= 1000).length,
    };

    return {
      responseTime: responseTimeMetrics,
      resultCounts: resultCountMetrics,
      distribution,
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      responseTime: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
      resultCounts: { min: 0, max: 0, avg: 0, median: 0 },
      distribution: { fast: 0, medium: 0, slow: 0 },
    };
  }
}

/**
 * Gets content-related search metrics
 */
async function getContentMetrics() {
  try {
    // Get content counts
    const [
      { count: articleCount },
      { count: libraryItemCount },
      { count: researchPaperCount },
    ] = await Promise.all([
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('library_items')
        .select('*', { count: 'exact', head: true })
        .eq('submission_status', 'approved'),
      supabase
        .from('library_items')
        .select('*', { count: 'exact', head: true })
        .eq('submission_status', 'approved')
        .eq('item_type', 'paper'),
    ]);

    // Get popular tags
    const { data: articles } = await supabase
      .from('articles')
      .select('tags')
      .eq('status', 'published');

    const { data: libraryItems } = await supabase
      .from('library_items')
      .select('tags')
      .eq('submission_status', 'approved');

    // Count tag frequencies
    const tagCounts = new Map<string, number>();
    [...(articles || []), ...(libraryItems || [])].forEach((item) => {
      item.tags?.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const popularTags = Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      contentCounts: {
        articles: articleCount || 0,
        libraryItems: libraryItemCount || 0,
        researchPapers: researchPaperCount || 0,
        total: (articleCount || 0) + (libraryItemCount || 0),
      },
      popularTags,
      tagCount: tagCounts.size,
    };
  } catch (error) {
    console.error('Error getting content metrics:', error);
    return {
      contentCounts: {
        articles: 0,
        libraryItems: 0,
        researchPapers: 0,
        total: 0,
      },
      popularTags: [],
      tagCount: 0,
    };
  }
}

/**
 * Generates insights based on analytics data
 */
function generateInsights(
  searchStats: any,
  popularQueries: any[],
  performanceMetrics: any
): string[] {
  const insights: string[] = [];

  // Search volume insights
  if (searchStats.totalSearches > 100) {
    insights.push(
      `High search activity with ${searchStats.totalSearches} searches performed`
    );
  } else if (searchStats.totalSearches < 10) {
    insights.push(
      'Low search activity - consider promoting search features to users'
    );
  }

  // Success rate insights
  if (searchStats.successRate < 70) {
    insights.push(
      'Search success rate is below 70% - consider improving search indexes or query processing'
    );
  } else if (searchStats.successRate > 90) {
    insights.push(
      'Excellent search success rate - users are finding relevant content'
    );
  }

  // Performance insights
  if (performanceMetrics.responseTime.avg > 1000) {
    insights.push(
      'Average response time is over 1 second - consider search optimization'
    );
  } else if (performanceMetrics.responseTime.avg < 200) {
    insights.push('Excellent search performance with fast response times');
  }

  // Query diversity insights
  const diversityRatio =
    searchStats.uniqueQueries / Math.max(1, searchStats.totalSearches);
  if (diversityRatio > 0.8) {
    insights.push('High query diversity - users are exploring varied topics');
  } else if (diversityRatio < 0.3) {
    insights.push(
      'Low query diversity - users tend to search for similar topics'
    );
  }

  // Popular query insights
  if (popularQueries.length > 0) {
    const topQuery = popularQueries[0];
    insights.push(
      `Most popular search: "${topQuery.query}" (${topQuery.count} times)`
    );
  }

  return insights;
}
