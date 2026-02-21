/**
 * Performance monitoring utilities for bundle loading and component metrics
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'bundle' | 'component' | 'navigation' | 'api';
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalMetrics: number;
  averageLoadTime: number;
  slowestOperations: PerformanceMetric[];
  fastestOperations: PerformanceMetric[];
  bundleMetrics: {
    totalBundles: number;
    averageBundleLoadTime: number;
    largestBundle: PerformanceMetric | null;
    mostFrequentBundle: string;
  };
  componentMetrics: {
    totalComponents: number;
    averageComponentLoadTime: number;
    slowestComponent: PerformanceMetric | null;
    componentFrequency: Record<string, number>;
  };
  navigationMetrics: {
    totalNavigations: number;
    averageNavigationTime: number;
    slowestNavigation: PerformanceMetric | null;
  };
  trends: {
    performanceOverTime: Array<{ timestamp: number; averageTime: number }>;
    hourlyDistribution: Record<string, number>;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Prevent memory leaks
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // Monitor navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.track(
              'page-load',
              navEntry.loadEventEnd - navEntry.fetchStart,
              'navigation',
              {
                domContentLoaded:
                  navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                firstPaint: this.getFirstPaint(),
                transferSize: navEntry.transferSize,
              }
            );
          }
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('navigation')) {
        navObserver.observe({ type: 'navigation', buffered: true });
        this.observers.push(navObserver);
      }

      // Monitor resource loading (for bundles)
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Only track JS bundles and chunks
          if (
            resourceEntry.name.includes('.js') &&
            !resourceEntry.name.includes('hot-update')
          ) {
            const isChunk =
              resourceEntry.name.includes('chunk') ||
              resourceEntry.name.includes('vendors');

            this.track(
              this.getResourceName(resourceEntry.name),
              resourceEntry.responseEnd - resourceEntry.fetchStart,
              'bundle',
              {
                size: resourceEntry.transferSize,
                cached: resourceEntry.transferSize === 0,
                isChunk,
                url: resourceEntry.name,
              }
            );
          }
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('resource')) {
        resourceObserver.observe({ type: 'resource', buffered: true });
        this.observers.push(resourceObserver);
      }

      // Monitor user timing (custom measurements)
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.track(entry.name, entry.duration, 'component', {
            startTime: entry.startTime,
            detail: (entry as any).detail,
          });
        }
      });

      if (PerformanceObserver.supportedEntryTypes.includes('measure')) {
        measureObserver.observe({ type: 'measure', buffered: true });
        this.observers.push(measureObserver);
      }
    } catch (error) {
      console.warn(
        '[PerformanceMonitor] Failed to initialize observers:',
        error
      );
    }
  }

  private getResourceName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];

    if (filename.includes('chunk')) {
      const match = filename.match(/([^.]+)\.chunk\./);
      return match ? `chunk-${match[1]}` : 'unknown-chunk';
    }

    return filename.replace(/\?.*$/, '').replace(/\.[^.]*$/, '');
  }

  private getFirstPaint(): number {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(
        (entry) => entry.name === 'first-paint'
      );
      return firstPaint ? firstPaint.startTime : 0;
    } catch {
      return 0;
    }
  }

  track(
    name: string,
    duration: number,
    type: PerformanceMetric['type'],
    metadata?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      type,
      metadata,
    };

    this.metrics.push(metric);

    // Maintain metrics size limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log significant performance events
    if (duration > 1000 || type === 'bundle') {
      console.log(
        `[Performance] ${type}:${name} - ${duration.toFixed(2)}ms`,
        metadata
      );
    }

    // Report to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        metric_type: type,
        duration: Math.round(duration),
        custom_map: metadata,
      });
    }

    return metric;
  }

  getMetrics(type?: PerformanceMetric['type']): PerformanceMetric[] {
    if (!type) return [...this.metrics];
    return this.metrics.filter((m) => m.type === type);
  }

  generateReport(): PerformanceReport {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const recentMetrics = this.metrics.filter((m) => m.timestamp > last24h);

    const bundleMetrics = recentMetrics.filter((m) => m.type === 'bundle');
    const componentMetrics = recentMetrics.filter(
      (m) => m.type === 'component'
    );
    const navigationMetrics = recentMetrics.filter(
      (m) => m.type === 'navigation'
    );

    // Calculate component frequency
    const componentFrequency: Record<string, number> = {};
    componentMetrics.forEach((m) => {
      componentFrequency[m.name] = (componentFrequency[m.name] || 0) + 1;
    });

    // Calculate hourly distribution
    const hourlyDistribution: Record<string, number> = {};
    recentMetrics.forEach((m) => {
      const hour = new Date(m.timestamp).getHours().toString();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Calculate performance trends
    const performanceOverTime: Array<{
      timestamp: number;
      averageTime: number;
    }> = [];
    const hourIntervals = 6; // 4-hour intervals
    const intervalMs = 4 * 60 * 60 * 1000;

    for (let i = 0; i < hourIntervals; i++) {
      const intervalStart = now - (i + 1) * intervalMs;
      const intervalEnd = now - i * intervalMs;
      const intervalMetrics = recentMetrics.filter(
        (m) => m.timestamp >= intervalStart && m.timestamp < intervalEnd
      );

      if (intervalMetrics.length > 0) {
        const avgTime =
          intervalMetrics.reduce((sum, m) => sum + m.duration, 0) /
          intervalMetrics.length;
        performanceOverTime.unshift({
          timestamp: intervalStart,
          averageTime: avgTime,
        });
      }
    }

    const sortedMetrics = [...recentMetrics].sort(
      (a, b) => b.duration - a.duration
    );
    const mostFrequentBundle =
      Object.entries(
        bundleMetrics.reduce(
          (acc, m) => {
            acc[m.name] = (acc[m.name] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    return {
      totalMetrics: recentMetrics.length,
      averageLoadTime:
        recentMetrics.length > 0
          ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
            recentMetrics.length
          : 0,
      slowestOperations: sortedMetrics.slice(0, 10),
      fastestOperations: sortedMetrics.slice(-10).reverse(),
      bundleMetrics: {
        totalBundles: bundleMetrics.length,
        averageBundleLoadTime:
          bundleMetrics.length > 0
            ? bundleMetrics.reduce((sum, m) => sum + m.duration, 0) /
              bundleMetrics.length
            : 0,
        largestBundle:
          bundleMetrics.sort((a, b) => b.duration - a.duration)[0] || null,
        mostFrequentBundle,
      },
      componentMetrics: {
        totalComponents: componentMetrics.length,
        averageComponentLoadTime:
          componentMetrics.length > 0
            ? componentMetrics.reduce((sum, m) => sum + m.duration, 0) /
              componentMetrics.length
            : 0,
        slowestComponent:
          componentMetrics.sort((a, b) => b.duration - a.duration)[0] || null,
        componentFrequency,
      },
      navigationMetrics: {
        totalNavigations: navigationMetrics.length,
        averageNavigationTime:
          navigationMetrics.length > 0
            ? navigationMetrics.reduce((sum, m) => sum + m.duration, 0) /
              navigationMetrics.length
            : 0,
        slowestNavigation:
          navigationMetrics.sort((a, b) => b.duration - a.duration)[0] || null,
      },
      trends: {
        performanceOverTime,
        hourlyDistribution,
      },
    };
  }

  exportReport(): void {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  // Custom timing utilities
  startTiming(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.track(name, duration, 'component');
    };
  }

  measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    return asyncFn().finally(() => {
      const duration = performance.now() - startTime;
      this.track(name, duration, 'component');
    });
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
const _measureComponentLoad = (componentName: string) => {
  return performanceMonitor.startTiming(`component-${componentName}`);
};

const _measureAsyncOperation = <T>(
  name: string,
  operation: () => Promise<T>
) => {
  return performanceMonitor.measureAsync(name, operation);
};

// Performance debugging utilities (development only)
export const logPerformanceReport = () => {
  if (process.env.NODE_ENV === 'development') {
    const _report = performanceMonitor.generateReport();
    // console.group('📊 Performance Report');
    // console.log('Total metrics collected:', report.totalMetrics);
    // console.log('Average load time:', `${report.averageLoadTime.toFixed(2)}ms`);
    // console.log('Bundle metrics:', report.bundleMetrics);
    // console.log('Component metrics:', report.componentMetrics);
    // console.log('Navigation metrics:', report.navigationMetrics);
    // console.groupEnd();
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Log performance report every 5 minutes in development
  // if (process.env.NODE_ENV === 'development') {
  //   setInterval(logPerformanceReport, 5 * 60 * 1000);
  // }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}
