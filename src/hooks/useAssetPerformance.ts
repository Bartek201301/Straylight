'use client';

import { useEffect, useCallback } from 'react';

interface AssetPerformanceMetrics {
  name: string;
  type: 'image' | 'video' | 'font' | 'script' | 'stylesheet';
  size: number;
  loadTime: number;
  renderTime?: number;
  url: string;
}

interface UseAssetPerformanceOptions {
  trackImages?: boolean;
  trackVideos?: boolean;
  trackFonts?: boolean;
  trackScripts?: boolean;
  trackStylesheets?: boolean;
  onMetricsCollected?: (metrics: AssetPerformanceMetrics[]) => void;
  enableConsoleLogging?: boolean;
}

export const useAssetPerformance = ({
  trackImages = true,
  trackVideos = true,
  trackFonts = true,
  trackScripts = true,
  trackStylesheets = true,
  onMetricsCollected,
  enableConsoleLogging = false,
}: UseAssetPerformanceOptions = {}) => {
  const logMetric = useCallback(
    (_metric: AssetPerformanceMetrics) => {
      // if (enableConsoleLogging) {
      //   console.log(`Asset Performance: ${metric.name}`, {
      //     type: metric.type,
      //     size: `${(metric.size / 1024).toFixed(2)}KB`,
      //     loadTime: `${metric.loadTime.toFixed(2)}ms`,
      //     renderTime: metric.renderTime
      //       ? `${metric.renderTime.toFixed(2)}ms`
      //       : 'N/A',
      //   });
      // }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enableConsoleLogging]
  );

  const sendToAnalytics = useCallback((metric: AssetPerformanceMetrics) => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'asset_loaded', {
        event_category: 'performance',
        event_label: metric.type,
        custom_map: {
          asset_name: metric.name,
          asset_size: metric.size,
          load_time: metric.loadTime,
        },
      });
    }
  }, []);

  const collectMetrics = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const metrics: AssetPerformanceMetrics[] = [];
    const typeMapping: Record<string, AssetPerformanceMetrics['type']> = {
      img: 'image',
      video: 'video',
      script: 'script',
      link: 'stylesheet',
      xmlhttprequest: 'script',
    };

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          const initiatorType = resourceEntry.initiatorType;
          const mappedType = typeMapping[initiatorType];

          // Filter based on tracking preferences
          if (
            (mappedType === 'image' && !trackImages) ||
            (mappedType === 'video' && !trackVideos) ||
            (mappedType === 'script' && !trackScripts) ||
            (mappedType === 'stylesheet' && !trackStylesheets)
          ) {
            continue;
          }

          // Special handling for font resources
          if (
            resourceEntry.name.match(/\.(woff2?|ttf|otf|eot)$/i) &&
            trackFonts
          ) {
            const metric: AssetPerformanceMetrics = {
              name: resourceEntry.name.split('/').pop() || resourceEntry.name,
              type: 'font',
              size: resourceEntry.transferSize || 0,
              loadTime: resourceEntry.responseEnd - resourceEntry.requestStart,
              url: resourceEntry.name,
            };

            metrics.push(metric);
            logMetric(metric);
            sendToAnalytics(metric);
          }

          // Handle other resource types
          if (mappedType) {
            const metric: AssetPerformanceMetrics = {
              name: resourceEntry.name.split('/').pop() || resourceEntry.name,
              type: mappedType,
              size: resourceEntry.transferSize || 0,
              loadTime: resourceEntry.responseEnd - resourceEntry.requestStart,
              url: resourceEntry.name,
            };

            metrics.push(metric);
            logMetric(metric);
            sendToAnalytics(metric);
          }
        }

        if (metrics.length > 0 && onMetricsCollected) {
          onMetricsCollected(metrics);
        }
      });

      observer.observe({ entryTypes: ['resource'] });

      // Also observe paint entries for render timing
      if (trackImages || trackVideos) {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'element') {
              const elementEntry = entry as any;
              if (elementEntry.identifier && elementEntry.renderTime) {
                // Find corresponding metric and update render time
                const existingMetric = metrics.find((m) =>
                  m.url.includes(elementEntry.identifier)
                );
                if (existingMetric) {
                  existingMetric.renderTime = elementEntry.renderTime;
                }
              }
            }
          }
        });

        try {
          paintObserver.observe({ entryTypes: ['element'] });
        } catch (e) {
          // Element timing not supported
        }
      }

      // Cleanup function
      return () => {
        observer.disconnect();
      };
    } catch (error) {
      console.warn('Asset performance monitoring not supported:', error);
    }
  }, [
    trackImages,
    trackVideos,
    trackFonts,
    trackScripts,
    trackStylesheets,
    onMetricsCollected,
    logMetric,
    sendToAnalytics,
  ]);

  useEffect(() => {
    const cleanup = collectMetrics();
    return cleanup;
  }, [collectMetrics]);
};

// Hook specifically for image performance tracking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useImagePerformance = (
  options: {
    onImageLoad?: (metrics: AssetPerformanceMetrics) => void;
    enableLogging?: boolean;
  } = {}
) => {
  return useAssetPerformance({
    trackImages: true,
    trackVideos: false,
    trackFonts: false,
    trackScripts: false,
    trackStylesheets: false,
    onMetricsCollected: (metrics) => {
      const imageMetrics = metrics.filter((m) => m.type === 'image');
      imageMetrics.forEach((metric) => options.onImageLoad?.(metric));
    },
    enableConsoleLogging: options.enableLogging,
  });
};
