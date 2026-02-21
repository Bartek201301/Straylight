/**
 * Optimized imports for heavy libraries
 * This file provides tree-shakable imports for better bundle splitting
 */

// Utility function to dynamically import heavy components with preloading
const importComponent = <T>(
  importFn: () => Promise<{ default: T }>,
  preload = false
) => {
  if (preload && typeof window !== 'undefined') {
    // Preload the component on idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => importFn());
    } else {
      setTimeout(() => importFn(), 100);
    }
  }
  return importFn;
};

// Component-specific dynamic imports
const importHeavyComponents = {
  // Editor components
  ArticleEditor: () => {
    return import(
      /* webpackChunkName: "editor-article" */ '@/components/editor/ArticleEditor'
    );
  },

  // 3D effect components
  Orb: () => {
    return import(
      /* webpackChunkName: "effects-orb" */ '@/components/effects/Orb/Orb'
    );
  },

  CobeGlobe: () => {
    return import(
      /* webpackChunkName: "effects-globe" */ '@/components/effects/CobeGlobe'
    );
  },

  // Chart components
  GrowthChart: () => {
    return import(
      /* webpackChunkName: "charts-growth" */ '@/components/ui/growth-chart'
    );
  },

  // Admin components
  PendingArticlesList: () => {
    return import(
      /* webpackChunkName: "admin-articles" */ '@/app/(admin)/admin/_components/articles/PendingArticlesList'
    );
  },

  FeaturedToolsManager: () => {
    return import(
      /* webpackChunkName: "admin-tools" */ '@/app/(admin)/admin/_components/FeaturedToolsManager'
    );
  },

  FeaturedArticlesManager: () => {
    return import(
      /* webpackChunkName: "admin-featured" */ '@/app/(admin)/admin/_components/FeaturedArticlesManager'
    );
  },
};

// Preload utilities for critical path optimization
export const preloadCriticalComponents = () => {
  if (typeof window === 'undefined') return;

  const criticalComponents = ['ArticleEditor', 'Orb', 'GrowthChart'] as const;

  criticalComponents.forEach((componentName) => {
    if (componentName in importHeavyComponents) {
      importComponent((importHeavyComponents as any)[componentName], true);
    }
  });
};
