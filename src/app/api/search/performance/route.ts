// ============================================================================
// SEARCH PERFORMANCE MONITORING API ENDPOINT
// ============================================================================
// Provides real-time performance metrics, alerts, and optimization
// recommendations for search functionality monitoring and debugging.
// ============================================================================

import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
} from '@/lib/errors/api-errors';
import {
  getPerformanceMetrics,
  generatePerformanceAlerts,
  analyzeQueryPatterns,
  getPerformanceDashboard,
  exportPerformanceData,
} from '@/lib/services/search-performance';
import {
  getCacheStats,
  clearCache,
  invalidateCachePattern,
} from '@/lib/services/search-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'dashboard';

    switch (action) {
      case 'metrics':
        return await handleMetricsRequest(requestId);

      case 'alerts':
        return await handleAlertsRequest(requestId);

      case 'patterns':
        return await handlePatternsRequest(requestId);

      case 'cache':
        return await handleCacheStatsRequest(requestId);

      case 'export':
        return await handleExportRequest(requestId);

      case 'dashboard':
      default:
        return await handleDashboardRequest(requestId);
    }
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_cache':
        return await handleClearCacheRequest(body, requestId);

      case 'invalidate_cache':
        return await handleInvalidateCacheRequest(body, requestId);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// ============================================================================
// REQUEST HANDLERS
// ============================================================================

/**
 * Handles dashboard overview request
 */
async function handleDashboardRequest(requestId: string) {
  const dashboard = await getPerformanceDashboard();

  return createSuccessResponse(
    {
      dashboard,
      timestamp: Date.now(),
    },
    'Performance dashboard retrieved',
    requestId
  );
}

/**
 * Handles detailed metrics request
 */
async function handleMetricsRequest(requestId: string) {
  const metrics = await getPerformanceMetrics();

  return createSuccessResponse(
    {
      metrics,
      timestamp: Date.now(),
    },
    'Performance metrics retrieved',
    requestId
  );
}

/**
 * Handles performance alerts request
 */
async function handleAlertsRequest(requestId: string) {
  const alerts = generatePerformanceAlerts();

  return createSuccessResponse(
    {
      alerts,
      count: alerts.length,
      severity: {
        error: alerts.filter((a) => a.type === 'error').length,
        warning: alerts.filter((a) => a.type === 'warning').length,
        info: alerts.filter((a) => a.type === 'info').length,
      },
      timestamp: Date.now(),
    },
    'Performance alerts retrieved',
    requestId
  );
}

/**
 * Handles query patterns analysis request
 */
async function handlePatternsRequest(requestId: string) {
  const patterns = analyzeQueryPatterns();

  return createSuccessResponse(
    {
      patterns: patterns.patterns,
      insights: patterns.insights,
      timestamp: Date.now(),
    },
    'Query patterns analyzed',
    requestId
  );
}

/**
 * Handles cache statistics request
 */
async function handleCacheStatsRequest(requestId: string) {
  const cacheStats = getCacheStats();

  return createSuccessResponse(
    {
      cache: cacheStats,
      recommendations: generateCacheRecommendations(cacheStats),
      timestamp: Date.now(),
    },
    'Cache statistics retrieved',
    requestId
  );
}

/**
 * Handles performance data export request
 */
async function handleExportRequest(requestId: string) {
  const exportData = exportPerformanceData();

  return createSuccessResponse(
    exportData,
    'Performance data exported',
    requestId
  );
}

/**
 * Handles cache clearing request
 */
async function handleClearCacheRequest(body: any, requestId: string) {
  clearCache();

  return createSuccessResponse(
    {
      action: 'clear_cache',
      success: true,
      timestamp: Date.now(),
    },
    'Cache cleared successfully',
    requestId
  );
}

/**
 * Handles cache pattern invalidation request
 */
async function handleInvalidateCacheRequest(body: any, requestId: string) {
  const { pattern } = body;

  if (!pattern) {
    throw new Error('Pattern is required for cache invalidation');
  }

  const deletedCount = invalidateCachePattern(pattern);

  return createSuccessResponse(
    {
      action: 'invalidate_cache',
      pattern,
      deletedCount,
      timestamp: Date.now(),
    },
    `Invalidated ${deletedCount} cache entries matching pattern`,
    requestId
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates cache-specific recommendations
 */
function generateCacheRecommendations(
  cacheStats: ReturnType<typeof getCacheStats>
): string[] {
  const recommendations: string[] = [];

  if (cacheStats.hitRate < 50) {
    recommendations.push(
      'Cache hit rate is very low - review caching strategy'
    );
  } else if (cacheStats.hitRate < 70) {
    recommendations.push(
      'Cache hit rate could be improved - consider longer TTL for stable queries'
    );
  } else if (cacheStats.hitRate > 90) {
    recommendations.push(
      'Excellent cache performance - current strategy is working well'
    );
  }

  if (cacheStats.cacheSize > cacheStats.maxCacheSize * 0.9) {
    recommendations.push(
      'Cache is nearly full - consider increasing cache size limit'
    );
  }

  if (cacheStats.totalRequests > 0 && cacheStats.cacheHits === 0) {
    recommendations.push('No cache hits detected - verify caching is enabled');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is within normal parameters');
  }

  return recommendations;
}
