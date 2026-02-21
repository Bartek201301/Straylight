/**
 * Font Performance Monitoring Utilities
 * Tracks font loading performance and provides analytics
 */

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, parameters?: any) => void;
  }
}

/**
 * Monitors font loading performance and CLS impact
 */
export const initializeFontPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Monitor font loading completion
  if ('fonts' in document) {
    const startTime = performance.now();

    document.fonts.ready.then(() => {
      const loadTime = performance.now() - startTime;

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fonts loaded in ${Math.round(loadTime)}ms`);
      }

      // Send to analytics in production
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'font_loaded', {
          event_category: 'performance',
          event_label: 'all_fonts_loaded',
          value: Math.round(loadTime),
        });
      }
    });
  }

  // Monitor layout shifts that could be font-related
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            entry.entryType === 'layout-shift' &&
            !(entry as any).hadRecentInput
          ) {
            const shiftValue = (entry as any).value;

            if (process.env.NODE_ENV === 'development') {
              console.log(`Layout shift detected: ${shiftValue}`);
            }

            // Track significant layout shifts
            if (shiftValue > 0.1 && typeof window.gtag !== 'undefined') {
              window.gtag('event', 'layout_shift', {
                event_category: 'performance',
                event_label: 'significant_cls',
                value: Math.round(shiftValue * 1000), // Convert to milliseconds
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Layout shift observation not supported
      console.warn('Layout shift observation not supported');
    }
  }
};

/**
 * Preloads critical fonts if not already loaded by Next.js
 */
const _preloadCriticalFonts = () => {
  if (typeof window === 'undefined') return;

  // Check if fonts are already loaded via Next.js optimization
  const hasNextFonts = document.querySelector('[data-next-font]');

  if (!hasNextFonts) {
    // Fallback: manually preload critical fonts
    const criticalFonts = [
      { family: 'Sora', weight: '400' },
      { family: 'Sora', weight: '600' },
    ];

    criticalFonts.forEach(({ family, weight }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = `https://fonts.gstatic.com/s/${family.toLowerCase()}/v${weight}/font.woff2`;

      // Avoid duplicates
      if (!document.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
    });
  }
};

/**
 * Gets font loading metrics for analytics
 */
const _getFontLoadingMetrics = (): Promise<{
  loadTime: number;
  fontsLoaded: number;
}> => {
  return new Promise((resolve) => {
    if (!('fonts' in document)) {
      resolve({ loadTime: 0, fontsLoaded: 0 });
      return;
    }

    const startTime = performance.now();

    document.fonts.ready.then(() => {
      const loadTime = performance.now() - startTime;
      const fontsLoaded = document.fonts.size;

      resolve({ loadTime, fontsLoaded });
    });
  });
};

/**
 * Checks if font is available and loaded
 */
const _isFontLoaded = (fontFamily: string): boolean => {
  if (!('fonts' in document)) return false;

  try {
    return document.fonts.check(`1em ${fontFamily}`);
  } catch {
    return false;
  }
};
