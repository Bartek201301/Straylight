// ============================================================================
// SEARCH PERFORMANCE MONITORING SERVICE
// ============================================================================
// This service provides comprehensive performance monitoring, metrics tracking,
// and optimization recommendations for search functionality.
// ============================================================================

import { getCacheStats } from './search-cache';

// ============================================================================
// PERFORMANCE TYPES AND INTERFACES
// ============================================================================

interface PerformanceMetrics {
  searchPerformance: {
    totalSearches: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowestQueries: Array<{
      query: string;
      responseTime: number;
      timestamp: number;
    }>;
  };
  cachePerformance: {
    hitRate: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    cacheSize: number;
  };
  queryAnalytics: {
    popularQueries: Array<{
      query: string;
      count: number;
      avgResponseTime: number;
    }>;
    queryPatterns: Array<{
      pattern: string;
      frequency: number;
      avgResultCount: number;
    }>;
    failedQueries: Array<{
      query: string;
      reason: string;
      timestamp: number;
    }>;
  };
  systemHealth: {
    memoryUsage: number;
    dbConnectionHealth: 'healthy' | 'degraded' | 'unhealthy';
    recommendedActions: string[];
  };
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  suggestions: string[];
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

class SearchPerformanceMonitor {
  private responseTimesBuffer: number[] = [];
  private queryExecutionTimes = new Map<string, number[]>();
  private errorCount = 0;
  private totalRequests = 0;
  private readonly maxBufferSize = 1000;

  /**
   * Records a search execution time
   */
  recordSearchTime(
    query: string,
    responseTime: number,
    success: boolean = true
  ): void {
    this.totalRequests++;

    if (!success) {
      this.errorCount++;
      return;
    }

    // Add to response times buffer
    this.responseTimesBuffer.push(responseTime);
    if (this.responseTimesBuffer.length > this.maxBufferSize) {
      this.responseTimesBuffer.shift();
    }

    // Track per-query performance
    if (!this.queryExecutionTimes.has(query)) {
      this.queryExecutionTimes.set(query, []);
    }

    const queryTimes = this.queryExecutionTimes.get(query)!;
    queryTimes.push(responseTime);

    // Keep only last 50 executions per query
    if (queryTimes.length > 50) {
      queryTimes.shift();
    }
  }

  /**
   * Gets performance statistics
   */
  getPerformanceStats(): {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    slowestQueries: Array<{
      query: string;
      avgTime: number;
      executions: number;
    }>;
  } {
    if (this.responseTimesBuffer.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        slowestQueries: [],
      };
    }

    const sorted = [...this.responseTimesBuffer].sort((a, b) => a - b);
    const avgResponseTime =
      sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
    const p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
    const p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];
    const errorRate =
      this.totalRequests > 0 ? (this.errorCount / this.totalRequests) * 100 : 0;

    // Calculate slowest queries
    const slowestQueries = Array.from(this.queryExecutionTimes.entries())
      .map(([query, times]) => ({
        query,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        executions: times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      slowestQueries,
    };
  }

  /**
   * Analyzes performance trends
   */
  analyzePerformanceTrends(): {
    trend: 'improving' | 'degrading' | 'stable';
    recommendation: string;
  } {
    if (this.responseTimesBuffer.length < 20) {
      return {
        trend: 'stable',
        recommendation: 'Insufficient data for trend analysis',
      };
    }

    // Compare recent performance with historical
    const recentTimes = this.responseTimesBuffer.slice(-10);
    const historicalTimes = this.responseTimesBuffer.slice(0, -10);

    const recentAvg =
      recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
    const historicalAvg =
      historicalTimes.reduce((sum, time) => sum + time, 0) /
      historicalTimes.length;

    const improvement = ((historicalAvg - recentAvg) / historicalAvg) * 100;

    if (improvement > 10) {
      return {
        trend: 'improving',
        recommendation:
          'Performance is improving. Current optimizations are working well.',
      };
    } else if (improvement < -10) {
      return {
        trend: 'degrading',
        recommendation:
          'Performance is degrading. Consider reviewing recent changes or scaling resources.',
      };
    } else {
      return {
        trend: 'stable',
        recommendation:
          'Performance is stable. Monitor for any significant changes.',
      };
    }
  }

  /**
   * Resets all performance data
   */
  reset(): void {
    this.responseTimesBuffer = [];
    this.queryExecutionTimes.clear();
    this.errorCount = 0;
    this.totalRequests = 0;
  }
}

// ============================================================================
// GLOBAL PERFORMANCE MONITOR
// ============================================================================

const performanceMonitor = new SearchPerformanceMonitor();

// ============================================================================
// PERFORMANCE MONITORING FUNCTIONS
// ============================================================================

/**
 * Records search performance metrics
 */
export function recordSearchPerformance(
  query: string,
  responseTime: number,
  success: boolean = true
): void {
  performanceMonitor.recordSearchTime(query, responseTime, success);
}

/**
 * Gets comprehensive performance metrics
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  const searchStats = performanceMonitor.getPerformanceStats();
  const cacheStats = getCacheStats();

  // In a real implementation, these would come from actual analytics
  const mockQueryAnalytics = {
    popularQueries: [
      { query: 'javascript', count: 150, avgResponseTime: 245 },
      { query: 'react', count: 120, avgResponseTime: 198 },
      { query: 'typescript', count: 98, avgResponseTime: 267 },
    ],
    queryPatterns: [
      { pattern: 'single_word', frequency: 45, avgResultCount: 23 },
      { pattern: 'programming_language', frequency: 30, avgResultCount: 45 },
      { pattern: 'long_phrase', frequency: 25, avgResultCount: 12 },
    ],
    failedQueries: [],
  };

  // Get system health metrics
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

  const systemHealth = {
    memoryUsage: memoryUsageMB,
    dbConnectionHealth: 'healthy' as const,
    recommendedActions: generateRecommendations(searchStats, cacheStats),
  };

  return {
    searchPerformance: {
      totalSearches: searchStats.slowestQueries.reduce(
        (sum, q) => sum + q.executions,
        0
      ),
      avgResponseTime: searchStats.avgResponseTime,
      p95ResponseTime: searchStats.p95ResponseTime,
      p99ResponseTime: searchStats.p99ResponseTime,
      slowestQueries: searchStats.slowestQueries.map((q) => ({
        query: q.query,
        responseTime: q.avgTime,
        timestamp: Date.now(),
      })),
    },
    cachePerformance: {
      hitRate: cacheStats.hitRate,
      totalRequests: cacheStats.totalRequests,
      cacheHits: cacheStats.cacheHits,
      cacheMisses: cacheStats.cacheMisses,
      cacheSize: cacheStats.cacheSize,
    },
    queryAnalytics: mockQueryAnalytics,
    systemHealth,
  };
}

/**
 * Generates performance alerts based on thresholds
 */
export function generatePerformanceAlerts(): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];
  const searchStats = performanceMonitor.getPerformanceStats();
  const cacheStats = getCacheStats();

  // Response time alerts
  if (searchStats.avgResponseTime > 1000) {
    alerts.push({
      type: 'warning',
      message: 'Average search response time is high',
      metric: 'avgResponseTime',
      threshold: 1000,
      currentValue: searchStats.avgResponseTime,
      timestamp: Date.now(),
      suggestions: [
        'Review database query optimization',
        'Consider adding more cache layers',
        'Check database connection pool settings',
      ],
    });
  }

  if (searchStats.p95ResponseTime > 2000) {
    alerts.push({
      type: 'error',
      message: 'P95 response time is critically high',
      metric: 'p95ResponseTime',
      threshold: 2000,
      currentValue: searchStats.p95ResponseTime,
      timestamp: Date.now(),
      suggestions: [
        'Immediate investigation required',
        'Check for slow queries in database logs',
        'Consider scaling database resources',
      ],
    });
  }

  // Cache performance alerts
  if (cacheStats.hitRate < 60) {
    alerts.push({
      type: 'warning',
      message: 'Cache hit rate is below optimal threshold',
      metric: 'cacheHitRate',
      threshold: 60,
      currentValue: cacheStats.hitRate,
      timestamp: Date.now(),
      suggestions: [
        'Review cache TTL settings',
        'Analyze query patterns for better caching strategy',
        'Consider increasing cache size',
      ],
    });
  }

  // Error rate alerts
  if (searchStats.errorRate > 5) {
    alerts.push({
      type: 'error',
      message: 'Search error rate is high',
      metric: 'errorRate',
      threshold: 5,
      currentValue: searchStats.errorRate,
      timestamp: Date.now(),
      suggestions: [
        'Check application logs for error patterns',
        'Verify database connectivity',
        'Review input validation',
      ],
    });
  }

  return alerts;
}

/**
 * Generates optimization recommendations
 */
function generateRecommendations(
  searchStats: ReturnType<SearchPerformanceMonitor['getPerformanceStats']>,
  cacheStats: ReturnType<typeof getCacheStats>
): string[] {
  const recommendations: string[] = [];

  // Performance recommendations
  if (searchStats.avgResponseTime > 500) {
    recommendations.push(
      'Consider optimizing database indexes for better search performance'
    );
  }

  if (searchStats.slowestQueries.length > 0) {
    recommendations.push(
      `Review slow queries: ${searchStats.slowestQueries[0].query}`
    );
  }

  // Cache recommendations
  if (cacheStats.hitRate < 70) {
    recommendations.push(
      'Improve cache hit rate by adjusting TTL or cache strategy'
    );
  }

  if (cacheStats.cacheSize > cacheStats.maxCacheSize * 0.9) {
    recommendations.push('Consider increasing cache size limit');
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      'Performance is good. Continue monitoring for any changes'
    );
  }

  return recommendations;
}

/**
 * Analyzes query performance patterns
 */
export function analyzeQueryPatterns(): {
  patterns: Array<{
    type: string;
    queries: string[];
    avgResponseTime: number;
    frequency: number;
  }>;
  insights: string[];
} {
  const searchStats = performanceMonitor.getPerformanceStats();
  const patterns: Array<{
    type: string;
    queries: string[];
    avgResponseTime: number;
    frequency: number;
  }> = [];

  const insights: string[] = [];

  // Analyze slow queries
  const slowQueries = searchStats.slowestQueries.filter(
    (q) => q.avgTime > 1000
  );
  if (slowQueries.length > 0) {
    patterns.push({
      type: 'slow_queries',
      queries: slowQueries.map((q) => q.query),
      avgResponseTime:
        slowQueries.reduce((sum, q) => sum + q.avgTime, 0) / slowQueries.length,
      frequency: slowQueries.reduce((sum, q) => sum + q.executions, 0),
    });

    insights.push(
      `${slowQueries.length} queries are performing slowly (>1s response time)`
    );
  }

  // Analyze short queries
  const shortQueries = searchStats.slowestQueries.filter(
    (q) => q.query.length <= 3
  );
  if (shortQueries.length > 0) {
    patterns.push({
      type: 'short_queries',
      queries: shortQueries.map((q) => q.query),
      avgResponseTime:
        shortQueries.reduce((sum, q) => sum + q.avgTime, 0) /
        shortQueries.length,
      frequency: shortQueries.reduce((sum, q) => sum + q.executions, 0),
    });

    insights.push(
      'Users frequently search with very short terms - consider suggesting longer queries'
    );
  }

  return { patterns, insights };
}

/**
 * Gets performance dashboard data
 */
export async function getPerformanceDashboard(): Promise<{
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  trends: ReturnType<SearchPerformanceMonitor['analyzePerformanceTrends']>;
  queryPatterns: ReturnType<typeof analyzeQueryPatterns>;
}> {
  const [metrics, alerts, trends, queryPatterns] = await Promise.all([
    getPerformanceMetrics(),
    Promise.resolve(generatePerformanceAlerts()),
    Promise.resolve(performanceMonitor.analyzePerformanceTrends()),
    Promise.resolve(analyzeQueryPatterns()),
  ]);

  return {
    metrics,
    alerts,
    trends,
    queryPatterns,
  };
}

/**
 * Exports performance data for external monitoring systems
 */
export function exportPerformanceData(): {
  timestamp: number;
  metrics: Record<string, number>;
  metadata: Record<string, any>;
} {
  const searchStats = performanceMonitor.getPerformanceStats();
  const cacheStats = getCacheStats();

  return {
    timestamp: Date.now(),
    metrics: {
      'search.response_time.avg': searchStats.avgResponseTime,
      'search.response_time.p95': searchStats.p95ResponseTime,
      'search.response_time.p99': searchStats.p99ResponseTime,
      'search.error_rate': searchStats.errorRate,
      'cache.hit_rate': cacheStats.hitRate,
      'cache.total_requests': cacheStats.totalRequests,
      'cache.size': cacheStats.cacheSize,
    },
    metadata: {
      slowest_queries: searchStats.slowestQueries.slice(0, 5),
      cache_stats: cacheStats,
    },
  };
}
