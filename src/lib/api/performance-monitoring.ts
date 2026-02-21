/**
 * API Performance Monitoring and Metrics
 * Comprehensive performance tracking, metrics collection, and monitoring utilities
 */

import { NextRequest } from 'next/server';

/**
 * Performance metric data structure
 */
interface PerformanceMetric {
  requestId: string;
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: number;
  success: boolean;
  userAgent?: string;
  ip?: string;
  userId?: string;
  cacheHit?: boolean;
  rateLimited?: boolean;
  errorType?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  customMetrics?: Record<string, any>;
}

/**
 * Aggregated metrics for reporting
 */
interface AggregatedMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  cacheHitRate: number;
  rateLimitHitRate: number;
  errorRate: number;

  // By endpoint
  endpointStats: Record<
    string,
    {
      requests: number;
      averageTime: number;
      errorRate: number;
    }
  >;

  // By status code
  statusCodeDistribution: Record<number, number>;

  // Error types
  errorTypes: Record<string, number>;

  // Time period
  timeWindow: {
    start: Date;
    end: Date;
  };
}

/**
 * Performance monitoring configuration
 */
interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  sampleRate: number; // 0.0 to 1.0
  maxMetricsInMemory: number;
  metricsFlushInterval: number; // milliseconds
  slowRequestThreshold: number; // milliseconds
  enableMemoryTracking: boolean;
  enableCustomMetrics: boolean;
  endpoints: {
    include?: string[]; // patterns to include
    exclude?: string[]; // patterns to exclude
  };
}

/**
 * Default monitoring configuration
 */
const DEFAULT_CONFIG: MonitoringConfig = {
  enableMetrics: process.env.NODE_ENV === 'production',
  enableTracing: true,
  sampleRate: 1.0, // Track all requests in development
  maxMetricsInMemory: 10000,
  metricsFlushInterval: 60000, // 1 minute
  slowRequestThreshold: 1000, // 1 second
  enableMemoryTracking: true,
  enableCustomMetrics: true,
  endpoints: {
    exclude: ['/health', '/favicon.ico', '/_next/'],
  },
};

/**
 * In-memory metrics storage
 */
class MetricsStore {
  private metrics: PerformanceMetric[] = [];
  private config: MonitoringConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: MonitoringConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startFlushTimer();
  }

  /**
   * Add a metric to the store
   */
  addMetric(metric: PerformanceMetric) {
    if (!this.shouldTrackEndpoint(metric.endpoint)) {
      return;
    }

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.metrics.push(metric);

    // Prevent memory overflow
    if (this.metrics.length > this.config.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsInMemory / 2);
    }

    // Log slow requests immediately
    if (metric.duration && metric.duration > this.config.slowRequestThreshold) {
      console.warn(
        `Slow API request: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`,
        {
          requestId: metric.requestId,
          duration: metric.duration,
          status: metric.status,
        }
      );
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific time window
   */
  getMetricsInWindow(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(
      (m) => m.startTime >= startTime && m.startTime <= endTime
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Check if endpoint should be tracked
   */
  private shouldTrackEndpoint(endpoint: string): boolean {
    // Check exclusions
    if (
      this.config.endpoints.exclude?.some((pattern) =>
        endpoint.includes(pattern)
      )
    ) {
      return false;
    }

    // Check inclusions (if specified)
    if (this.config.endpoints.include?.length) {
      return this.config.endpoints.include.some((pattern) =>
        endpoint.includes(pattern)
      );
    }

    return true;
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.config.metricsFlushInterval);
  }

  /**
   * Flush metrics (override in production for external systems)
   */
  private flushMetrics() {
    if (this.metrics.length === 0) return;

    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(this.metrics);
    } else {
      // In development, just log aggregated stats
      const stats = this.calculateAggregatedMetrics();
      console.log('API Performance Stats:', {
        totalRequests: stats.totalRequests,
        averageResponseTime: Math.round(stats.averageResponseTime),
        errorRate: Math.round(stats.errorRate * 100),
        cacheHitRate: Math.round(stats.cacheHitRate * 100),
        topEndpoints: Object.entries(stats.endpointStats)
          .sort(([, a], [, b]) => b.requests - a.requests)
          .slice(0, 5),
      });
    }

    // Keep only recent metrics
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.metrics = this.metrics.filter((m) => m.startTime > cutoff);
  }

  /**
   * Send metrics to external monitoring service
   */
  private async sendToMonitoringService(metrics: PerformanceMetric[]) {
    // Implement integration with monitoring services like DataDog, New Relic, etc.
    // For now, just log critical metrics
    const errors = metrics.filter((m) => !m.success);
    if (errors.length > 0) {
      console.error(
        `API errors in the last ${this.config.metricsFlushInterval}ms:`,
        {
          count: errors.length,
          endpoints: [...new Set(errors.map((e) => e.endpoint))],
        }
      );
    }
  }

  /**
   * Calculate aggregated metrics
   */
  calculateAggregatedMetrics(
    windowMs: number = 60 * 60 * 1000
  ): AggregatedMetrics {
    const now = Date.now();
    const windowStart = now - windowMs;
    const windowMetrics = this.getMetricsInWindow(windowStart, now);

    if (windowMetrics.length === 0) {
      return this.getEmptyMetrics(new Date(windowStart), new Date(now));
    }

    const durations = windowMetrics
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration!)
      .sort((a, b) => a - b);

    const successfulRequests = windowMetrics.filter((m) => m.success).length;
    const cacheHits = windowMetrics.filter((m) => m.cacheHit).length;
    const rateLimited = windowMetrics.filter((m) => m.rateLimited).length;

    // Calculate percentiles
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
    const p90 = durations[Math.floor(durations.length * 0.9)] || 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0;

    // Group by endpoint
    const endpointStats: Record<string, any> = {};
    windowMetrics.forEach((metric) => {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = {
          requests: 0,
          totalTime: 0,
          errors: 0,
        };
      }

      const stats = endpointStats[metric.endpoint];
      stats.requests++;
      if (metric.duration) stats.totalTime += metric.duration;
      if (!metric.success) stats.errors++;
    });

    // Calculate endpoint averages
    Object.keys(endpointStats).forEach((endpoint) => {
      const stats = endpointStats[endpoint];
      stats.averageTime =
        stats.requests > 0 ? stats.totalTime / stats.requests : 0;
      stats.errorRate = stats.requests > 0 ? stats.errors / stats.requests : 0;
      delete stats.totalTime;
      delete stats.errors;
    });

    // Group by status code
    const statusCodeDistribution: Record<number, number> = {};
    windowMetrics.forEach((metric) => {
      statusCodeDistribution[metric.status] =
        (statusCodeDistribution[metric.status] || 0) + 1;
    });

    // Group by error type
    const errorTypes: Record<string, number> = {};
    windowMetrics.forEach((metric) => {
      if (metric.errorType) {
        errorTypes[metric.errorType] = (errorTypes[metric.errorType] || 0) + 1;
      }
    });

    return {
      totalRequests: windowMetrics.length,
      successfulRequests,
      errorRequests: windowMetrics.length - successfulRequests,
      averageResponseTime:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      p50ResponseTime: p50,
      p90ResponseTime: p90,
      p99ResponseTime: p99,
      minResponseTime: durations[0] || 0,
      maxResponseTime: durations[durations.length - 1] || 0,
      requestsPerSecond: windowMetrics.length / (windowMs / 1000),
      cacheHitRate:
        windowMetrics.length > 0 ? cacheHits / windowMetrics.length : 0,
      rateLimitHitRate:
        windowMetrics.length > 0 ? rateLimited / windowMetrics.length : 0,
      errorRate:
        windowMetrics.length > 0
          ? (windowMetrics.length - successfulRequests) / windowMetrics.length
          : 0,
      endpointStats,
      statusCodeDistribution,
      errorTypes,
      timeWindow: {
        start: new Date(windowStart),
        end: new Date(now),
      },
    };
  }

  private getEmptyMetrics(start: Date, end: Date): AggregatedMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p90ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      requestsPerSecond: 0,
      cacheHitRate: 0,
      rateLimitHitRate: 0,
      errorRate: 0,
      endpointStats: {},
      statusCodeDistribution: {},
      errorTypes: {},
      timeWindow: { start, end },
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushMetrics(); // Final flush
  }
}

// Global metrics store
const metricsStore = new MetricsStore();

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring a request
   */
  startRequest(request: NextRequest, requestId: string): PerformanceMetric {
    const url = new URL(request.url);

    const metric: PerformanceMetric = {
      requestId,
      endpoint: url.pathname,
      method: request.method,
      startTime: Date.now(),
      status: 0,
      success: false,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: this.extractIP(request),
      memoryUsage: DEFAULT_CONFIG.enableMemoryTracking
        ? process.memoryUsage()
        : undefined,
    };

    return metric;
  }

  /**
   * Finish monitoring a request
   */
  finishRequest(
    metric: PerformanceMetric,
    response: Response,
    additionalData?: {
      cacheHit?: boolean;
      rateLimited?: boolean;
      errorType?: string;
      customMetrics?: Record<string, any>;
    }
  ) {
    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.status = response.status;
    metric.success = response.status < 400;

    if (additionalData) {
      metric.cacheHit = additionalData.cacheHit;
      metric.rateLimited = additionalData.rateLimited;
      metric.errorType = additionalData.errorType;
      metric.customMetrics = additionalData.customMetrics;
    }

    metricsStore.addMetric(metric);
  }

  /**
   * Record an error
   */
  recordError(metric: PerformanceMetric, error: Error, status: number = 500) {
    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.status = status;
    metric.success = false;
    metric.errorType = error.constructor.name;

    metricsStore.addMetric(metric);
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetric[] {
    return metricsStore.getMetrics();
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(windowMs?: number): AggregatedMetrics {
    return metricsStore.calculateAggregatedMetrics(windowMs);
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    metricsStore.clearMetrics();
  }

  /**
   * Extract IP address from request
   */
  private extractIP(request: NextRequest): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    return forwarded?.split(',')[0] || realIP || undefined;
  }
}

/**
 * Performance monitoring middleware
 */
export function withPerformanceMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  _options: {
    trackCustomMetrics?: boolean;
    enableTracing?: boolean;
  } = {}
) {
  const monitor = PerformanceMonitor.getInstance();

  return async (...args: T): Promise<Response> => {
    const request = args[0] as NextRequest;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metric = monitor.startRequest(request, requestId);

    try {
      const response = await handler(...args);

      // Check for cache hit header
      const cacheHit = response.headers.get('x-cache-hit') === 'true';
      const rateLimited = response.status === 429;

      monitor.finishRequest(metric, response, {
        cacheHit,
        rateLimited,
      });

      // Add monitoring headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${metric.duration}ms`);

      return response;
    } catch (error) {
      monitor.recordError(
        metric,
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };
}

/**
 * Health check utilities
 */
class _HealthMonitor {
  /**
   * Get system health status
   */
  static getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    metrics: AggregatedMetrics;
    checks: Record<string, boolean>;
  } {
    const monitor = PerformanceMonitor.getInstance();
    const metrics = monitor.getAggregatedMetrics(5 * 60 * 1000); // Last 5 minutes

    // Perform health checks
    const checks = {
      memoryUsage: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // 500MB
      errorRate: metrics.errorRate < 0.05, // Less than 5% error rate
      responseTime: metrics.p90ResponseTime < 2000, // P90 under 2 seconds
      requestVolume: metrics.requestsPerSecond < 100, // Not overloaded
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics,
      checks,
    };
  }

  /**
   * Check if system is ready
   */
  static isReady(): boolean {
    const health = this.getHealthStatus();
    return health.status !== 'unhealthy';
  }
}

/**
 * Custom metrics collection
 */
export class CustomMetrics {
  private static metrics = new Map<string, any>();

  /**
   * Record a custom metric
   */
  static record(name: string, value: any, tags?: Record<string, string>) {
    const key = `${name}${tags ? ':' + JSON.stringify(tags) : ''}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push({
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Increment a counter
   */
  static increment(name: string, tags?: Record<string, string>) {
    this.record(name, 1, tags);
  }

  /**
   * Record timing
   */
  static timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(`${name}.duration`, duration, tags);
  }

  /**
   * Get all custom metrics
   */
  static getAll(): Map<string, any> {
    return new Map(this.metrics);
  }

  /**
   * Clear all custom metrics
   */
  static clear() {
    this.metrics.clear();
  }
}

/**
 * Cleanup function for graceful shutdown
 */
function _cleanup() {
  metricsStore.destroy();
  CustomMetrics.clear();
}
