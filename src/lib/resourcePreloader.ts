/**
 * Resource preloader for critical assets
 * Intelligently preloads resources based on user behavior and page requirements
 */

interface PreloadOptions {
  as: 'script' | 'style' | 'image' | 'font' | 'video' | 'audio' | 'document';
  crossorigin?: 'anonymous' | 'use-credentials';
  type?: string;
  priority?: 'high' | 'low';
  fetchpriority?: 'high' | 'low' | 'auto';
}

interface ResourcePreloadConfig {
  critical: string[];
  onDemand: Record<string, string[]>;
  fonts: string[];
  images: string[];
}

class ResourcePreloader {
  private preloadedResources: Set<string> = new Set();
  private intersectionObserver?: IntersectionObserver;
  private prefetchObserver?: IntersectionObserver;
  private config: ResourcePreloadConfig;

  constructor(config: ResourcePreloadConfig) {
    this.config = config;
    this.initializeObservers();
  }

  /**
   * Initialize intersection observers for smart preloading
   */
  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Observer for immediate preloading (when element enters viewport)
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const preloadUrls = element.dataset.preload?.split(',') || [];
            preloadUrls.forEach((url) => this.preloadResource(url.trim()));
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observer for prefetching (when element is close to viewport)
    this.prefetchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const prefetchUrls = element.dataset.prefetch?.split(',') || [];
            prefetchUrls.forEach((url) => this.prefetchResource(url.trim()));
          }
        });
      },
      { rootMargin: '200px' }
    );
  }

  /**
   * Preload critical resources immediately
   */
  preloadCritical(): void {
    this.config.critical.forEach((url) => {
      this.preloadResource(url, { priority: 'high', fetchpriority: 'high' });
    });
  }

  /**
   * Preload resources for a specific route
   */
  preloadRoute(route: string): void {
    const routeResources = this.config.onDemand[route];
    if (routeResources) {
      routeResources.forEach((url) => {
        this.preloadResource(url, { priority: 'high' });
      });
    }
  }

  /**
   * Preload fonts with optimal settings
   */
  preloadFonts(): void {
    this.config.fonts.forEach((url) => {
      this.preloadResource(url, {
        as: 'font',
        crossorigin: 'anonymous',
        priority: 'high',
      });
    });
  }

  /**
   * Preload images with smart prioritization
   */
  preloadImages(urls: string[], priority: 'high' | 'low' = 'low'): void {
    urls.forEach((url) => {
      this.preloadResource(url, {
        as: 'image',
        priority,
        fetchpriority: priority === 'high' ? 'high' : 'auto',
      });
    });
  }

  /**
   * Core preload function
   */
  private preloadResource(
    url: string,
    options: Partial<PreloadOptions> = {}
  ): void {
    if (this.preloadedResources.has(url) || typeof window === 'undefined') {
      return;
    }

    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;

      // Set resource type based on URL or explicit option
      if (options.as) {
        link.as = options.as;
      } else {
        link.as = this.detectResourceType(url);
      }

      // Set additional attributes
      if (options.crossorigin) {
        link.crossOrigin = options.crossorigin;
      }

      if (options.type) {
        link.type = options.type;
      }

      if (options.fetchpriority) {
        (link as any).fetchPriority = options.fetchpriority;
      }

      // Add to document head
      document.head.appendChild(link);
      this.preloadedResources.add(url);

      console.log(`🚀 Preloaded: ${url}`);

      // Clean up after load or error
      link.onload = link.onerror = () => {
        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        }, 1000);
      };
    } catch (error) {
      console.warn(`Failed to preload resource: ${url}`, error);
    }
  }

  /**
   * Prefetch resources for future navigation
   */
  private prefetchResource(url: string): void {
    if (
      this.preloadedResources.has(`prefetch:${url}`) ||
      typeof window === 'undefined'
    ) {
      return;
    }

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;

      document.head.appendChild(link);
      this.preloadedResources.add(`prefetch:${url}`);

      console.log(`📦 Prefetched: ${url}`);
    } catch (error) {
      console.warn(`Failed to prefetch resource: ${url}`, error);
    }
  }

  /**
   * Detect resource type from URL
   */
  private detectResourceType(url: string): PreloadOptions['as'] {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js':
      case 'mjs':
        return 'script';
      case 'css':
        return 'style';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'avif':
      case 'svg':
        return 'image';
      case 'mp4':
      case 'webm':
      case 'ogg':
        return 'video';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      default:
        return 'document';
    }
  }

  /**
   * Observe element for smart preloading
   */
  observe(element: Element, type: 'preload' | 'prefetch' = 'preload'): void {
    const observer =
      type === 'preload' ? this.intersectionObserver : this.prefetchObserver;
    observer?.observe(element);
  }

  /**
   * Stop observing element
   */
  unobserve(element: Element): void {
    this.intersectionObserver?.unobserve(element);
    this.prefetchObserver?.unobserve(element);
  }

  /**
   * Preload route-based resources
   */
  preloadRouteAssets(currentRoute: string, nextRoute?: string): void {
    // Preload current route resources
    this.preloadRoute(currentRoute);

    // Prefetch next route if provided
    if (nextRoute) {
      setTimeout(() => {
        this.preloadRoute(nextRoute);
      }, 100);
    }
  }

  /**
   * Smart preloading based on user behavior
   */
  enableSmartPreloading(): void {
    if (typeof window === 'undefined') return;

    // Preload on mouse hover (desktop)
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && link.hostname === window.location.hostname) {
        const route = link.pathname;
        setTimeout(() => this.preloadRoute(route), 100);
      }
    });

    // Preload on touch start (mobile)
    document.addEventListener('touchstart', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && link.hostname === window.location.hostname) {
        const route = link.pathname;
        this.preloadRoute(route);
      }
    });

    // Preload visible images
    this.observeImages();
  }

  /**
   * Observe images for progressive loading
   */
  private observeImages(): void {
    if (!this.intersectionObserver) return;

    document.querySelectorAll('img[data-src]').forEach((img) => {
      this.intersectionObserver?.observe(img);
    });
  }

  /**
   * Get preloading statistics
   */
  getStats(): { preloaded: number; resources: string[] } {
    return {
      preloaded: this.preloadedResources.size,
      resources: Array.from(this.preloadedResources),
    };
  }

  /**
   * Clear preloaded resources tracking
   */
  clear(): void {
    this.preloadedResources.clear();
  }

  /**
   * Destroy observers and clean up
   */
  destroy(): void {
    this.intersectionObserver?.disconnect();
    this.prefetchObserver?.disconnect();
    this.clear();
  }
}

// Default configuration
const defaultConfig: ResourcePreloadConfig = {
  // Let Next.js manage critical bundle preloads; only include stable asset URLs here
  critical: [],
  onDemand: {
    '/dashboard': ['/api/dashboard/overview'],
    '/articles': ['/api/articles/featured'],
    '/library': ['/api/library/featured'],
  },
  fonts: ['/fonts/sora-variable.woff2', '/fonts/inter-variable.woff2'],
  images: ['/images/hero-bg.webp', '/images/logo.svg'],
};

// Create singleton instance
export const resourcePreloader = new ResourcePreloader(defaultConfig);

// Utility hook for React components
function _useResourcePreloader() {
  return resourcePreloader;
}
