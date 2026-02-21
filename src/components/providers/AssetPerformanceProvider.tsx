'use client';

import React, { createContext, useState, useEffect } from 'react';
import { useAssetPerformance } from '@/hooks/useAssetPerformance';

interface AssetPerformanceMetrics {
  name: string;
  type: 'image' | 'video' | 'font' | 'script' | 'stylesheet';
  size: number;
  loadTime: number;
  renderTime?: number;
  url: string;
}

interface AssetPerformanceContextType {
  metrics: AssetPerformanceMetrics[];
  isTracking: boolean;
  totalAssetsLoaded: number;
  totalBytesTransferred: number;
  averageLoadTime: number;
  enableTracking: () => void;
  disableTracking: () => void;
  clearMetrics: () => void;
}

const AssetPerformanceContext = createContext<
  AssetPerformanceContextType | undefined
>(undefined);

interface AssetPerformanceProviderProps {
  children: React.ReactNode;
  enableByDefault?: boolean;
  enableConsoleLogging?: boolean;
  trackImages?: boolean;
  trackVideos?: boolean;
  trackFonts?: boolean;
  trackScripts?: boolean;
  trackStylesheets?: boolean;
}

export const AssetPerformanceProvider: React.FC<
  AssetPerformanceProviderProps
> = ({
  children,
  enableByDefault = false,
  enableConsoleLogging = false,
  trackImages = true,
  trackVideos = true,
  trackFonts = true,
  trackScripts = true,
  trackStylesheets = true,
}) => {
  const [metrics, setMetrics] = useState<AssetPerformanceMetrics[]>([]);
  const [isTracking, setIsTracking] = useState(enableByDefault);

  // Calculate derived metrics
  const totalAssetsLoaded = metrics.length;
  const totalBytesTransferred = metrics.reduce(
    (total, metric) => total + metric.size,
    0
  );
  const averageLoadTime =
    metrics.length > 0
      ? metrics.reduce((total, metric) => total + metric.loadTime, 0) /
        metrics.length
      : 0;

  const handleMetricsCollected = (newMetrics: AssetPerformanceMetrics[]) => {
    setMetrics((prevMetrics) => {
      const updatedMetrics = [...prevMetrics];

      newMetrics.forEach((newMetric) => {
        const existingIndex = updatedMetrics.findIndex(
          (metric) => metric.url === newMetric.url
        );

        if (existingIndex >= 0) {
          // Update existing metric
          updatedMetrics[existingIndex] = {
            ...updatedMetrics[existingIndex],
            ...newMetric,
          };
        } else {
          // Add new metric
          updatedMetrics.push(newMetric);
        }
      });

      return updatedMetrics;
    });
  };

  // Initialize performance tracking
  useAssetPerformance({
    trackImages: isTracking && trackImages,
    trackVideos: isTracking && trackVideos,
    trackFonts: isTracking && trackFonts,
    trackScripts: isTracking && trackScripts,
    trackStylesheets: isTracking && trackStylesheets,
    onMetricsCollected: handleMetricsCollected,
    enableConsoleLogging,
  });

  const enableTracking = () => setIsTracking(true);
  const disableTracking = () => setIsTracking(false);
  const clearMetrics = () => setMetrics([]);

  // Development mode performance summary
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      enableConsoleLogging &&
      metrics.length > 0
    ) {
      const _performanceSummary = {
        totalAssets: totalAssetsLoaded,
        totalSize: `${(totalBytesTransferred / 1024 / 1024).toFixed(2)} MB`,
        averageLoadTime: `${averageLoadTime.toFixed(2)} ms`,
        byType: metrics.reduce(
          (acc, metric) => {
            if (!acc[metric.type]) {
              acc[metric.type] = { count: 0, size: 0, avgLoadTime: 0 };
            }
            acc[metric.type].count++;
            acc[metric.type].size += metric.size;
            acc[metric.type].avgLoadTime =
              (acc[metric.type].avgLoadTime * (acc[metric.type].count - 1) +
                metric.loadTime) /
              acc[metric.type].count;
            return acc;
          },
          {} as Record<
            string,
            { count: number; size: number; avgLoadTime: number }
          >
        ),
      };

      // console.group('📊 Asset Performance Summary');
      // console.log('Total Assets:', performanceSummary.totalAssets);
      // console.log('Total Size:', performanceSummary.totalSize);
      // console.log('Average Load Time:', performanceSummary.averageLoadTime);
      // console.table(performanceSummary.byType);
      // console.groupEnd();
    }
  }, [
    metrics,
    totalAssetsLoaded,
    totalBytesTransferred,
    averageLoadTime,
    enableConsoleLogging,
  ]);

  const value: AssetPerformanceContextType = {
    metrics,
    isTracking,
    totalAssetsLoaded,
    totalBytesTransferred,
    averageLoadTime,
    enableTracking,
    disableTracking,
    clearMetrics,
  };

  return (
    <AssetPerformanceContext.Provider value={value}>
      {children}
    </AssetPerformanceContext.Provider>
  );
};
