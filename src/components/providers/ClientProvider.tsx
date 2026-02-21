'use client';

import { useEffect } from 'react';
import { preloadCriticalComponents } from '@/lib/optimized-imports';
import { performanceMonitor } from '@/lib/performance-monitor';

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize critical component preloading on client mount
    preloadCriticalComponents();

    // Initialize performance monitoring
    performanceMonitor.track(
      'app-initialization',
      performance.now(),
      'component',
      {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    );

    // console.log('[Performance] Performance monitoring initialized');

    // Initial performance report in development
    // if (process.env.NODE_ENV === 'development') {
    //   setTimeout(logPerformanceReport, 5000);
    // }
  }, []);

  return <>{children}</>;
}
