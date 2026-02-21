'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { resourcePreloader } from '@/lib/resourcePreloader';

interface ResourcePreloadProviderProps {
  children: React.ReactNode;
  enableSmartPreloading?: boolean;
  preloadFonts?: boolean;
  enableRoutePreloading?: boolean;
}

/**
 * Provider for intelligent resource preloading
 */
export const ResourcePreloadProvider: React.FC<
  ResourcePreloadProviderProps
> = ({
  children,
  enableSmartPreloading = true,
  preloadFonts = true,
  enableRoutePreloading = true,
}) => {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize preloader on mount
    if (typeof window !== 'undefined') {
      console.log('🚀 Initializing resource preloader...');

      // Preload critical resources immediately
      resourcePreloader.preloadCritical();

      // Preload fonts
      if (preloadFonts) {
        resourcePreloader.preloadFonts();
      }

      // Enable smart preloading based on user interactions
      if (enableSmartPreloading) {
        resourcePreloader.enableSmartPreloading();
      }

      // Initial route preloading
      if (enableRoutePreloading && pathname) {
        resourcePreloader.preloadRoute(pathname);
      }
    }

    // Cleanup on unmount
    return () => {
      resourcePreloader.destroy();
    };
  }, [enableSmartPreloading, preloadFonts, enableRoutePreloading, pathname]);

  // Preload route-specific resources when pathname changes
  useEffect(() => {
    if (enableRoutePreloading && pathname) {
      resourcePreloader.preloadRoute(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, enableRoutePreloading]);

  return <>{children}</>;
};
