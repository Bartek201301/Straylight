/**
 * Sitemap Utilities and Validation
 * Tools for testing and validating sitemap generation
 */

import { DEFAULT_METADATA } from './metadata';

export interface SitemapValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalUrls: number;
    staticPages: number;
    dynamicPages: number;
    uniqueUrls: number;
    averagePriority: number;
  };
}

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: number;
}

/**
 * Validate sitemap entries for SEO best practices
 */
export function validateSitemap(
  entries: SitemapEntry[]
): SitemapValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const baseUrl = DEFAULT_METADATA.baseUrl;

  // Check for basic issues
  if (entries.length === 0) {
    errors.push('Sitemap is empty');
    return {
      isValid: false,
      errors,
      warnings,
      stats: {
        totalUrls: 0,
        staticPages: 0,
        dynamicPages: 0,
        uniqueUrls: 0,
        averagePriority: 0,
      },
    };
  }

  // Track URLs for duplicate detection
  const urlSet = new Set<string>();
  const duplicateUrls: string[] = [];

  // Track priorities for analysis
  const priorities: number[] = [];

  // Categories for stats
  let staticPages = 0;
  let dynamicPages = 0;

  entries.forEach((entry, index) => {
    const { url, lastModified, changeFrequency, priority } = entry;

    // URL validation
    if (!url || typeof url !== 'string') {
      errors.push(`Entry ${index}: Invalid URL`);
      return;
    }

    if (!url.startsWith(baseUrl)) {
      errors.push(
        `Entry ${index}: URL "${url}" does not match base URL "${baseUrl}"`
      );
    }

    // Check for duplicates
    if (urlSet.has(url)) {
      duplicateUrls.push(url);
      errors.push(`Duplicate URL found: ${url}`);
    } else {
      urlSet.add(url);
    }

    // Priority validation
    if (typeof priority !== 'number' || priority < 0 || priority > 1) {
      errors.push(
        `Entry ${index}: Invalid priority "${priority}". Must be between 0 and 1`
      );
    } else {
      priorities.push(priority);
    }

    // Change frequency validation
    const validFrequencies = [
      'always',
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'never',
    ];
    if (!validFrequencies.includes(changeFrequency)) {
      errors.push(
        `Entry ${index}: Invalid changeFrequency "${changeFrequency}"`
      );
    }

    // Last modified validation
    if (!(lastModified instanceof Date) || isNaN(lastModified.getTime())) {
      errors.push(`Entry ${index}: Invalid lastModified date`);
    }

    // Categorize pages
    if (url.includes('/articles/') && url !== `${baseUrl}/articles`) {
      dynamicPages++;
    } else {
      staticPages++;
    }

    // SEO warnings
    if (priority > 0.9 && !url.endsWith('/') && url !== baseUrl) {
      warnings.push(`High priority (${priority}) for non-homepage URL: ${url}`);
    }

    if (changeFrequency === 'always') {
      warnings.push(
        `"always" change frequency should be used sparingly: ${url}`
      );
    }

    // Check URL length (Google recommends under 2048 characters)
    if (url.length > 2048) {
      warnings.push(
        `URL too long (${url.length} chars): ${url.substring(0, 100)}...`
      );
    }
  });

  // Overall sitemap validation
  if (entries.length > 50000) {
    errors.push(
      `Sitemap too large (${entries.length} URLs). Consider splitting into multiple sitemaps.`
    );
  }

  if (entries.length > 10000) {
    warnings.push(
      `Large sitemap (${entries.length} URLs). Consider splitting for better performance.`
    );
  }

  // Check for homepage
  const hasHomepage = entries.some(
    (entry) => entry.url === baseUrl || entry.url === `${baseUrl}/`
  );
  if (!hasHomepage) {
    errors.push('Homepage not found in sitemap');
  }

  // Priority distribution warnings
  const highPriorityPages = entries.filter(
    (entry) => entry.priority >= 0.8
  ).length;
  if (highPriorityPages > entries.length * 0.2) {
    warnings.push(
      `Too many high-priority pages (${highPriorityPages}/${entries.length}). Consider reducing priorities.`
    );
  }

  const averagePriority =
    priorities.length > 0
      ? priorities.reduce((sum, p) => sum + p, 0) / priorities.length
      : 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalUrls: entries.length,
      staticPages,
      dynamicPages,
      uniqueUrls: urlSet.size,
      averagePriority: Math.round(averagePriority * 100) / 100,
    },
  };
}

/**
 * Generate sitemap index for large sites (future use)
 */
function _generateSitemapIndex(sitemapUrls: string[]): string {
  const _baseUrl = DEFAULT_METADATA.baseUrl;
  const lastModified = new Date().toISOString();

  const sitemapEntries = sitemapUrls
    .map(
      (url) => `
    <sitemap>
      <loc>${url}</loc>
      <lastmod>${lastModified}</lastmod>
    </sitemap>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapEntries}
</sitemapindex>`;
}

/**
 * Check if a URL should be included in sitemap
 */
function _shouldIncludeInSitemap(url: string): boolean {
  const excludePatterns = [
    /\/api\//,
    /\/admin\//,
    /\/auth\//,
    /\/dashboard\//,
    /\/test-/,
    /\/editor-/,
    /\/access-denied/,
    /\/_next\//,
    /\/favicon\.ico/,
    /\?/, // URLs with query parameters
    /\/draft/,
    /\/preview/,
  ];

  return !excludePatterns.some((pattern) => pattern.test(url));
}

/**
 * SEO priority calculation helper
 */
function _calculateSEOPriority({
  isHomepage = false,
  isMainCategory = false,
  daysSinceUpdate = 0,
  isPopularContent = false,
  contentType = 'page',
}: {
  isHomepage?: boolean;
  isMainCategory?: boolean;
  daysSinceUpdate?: number;
  isPopularContent?: boolean;
  contentType?: 'page' | 'article' | 'category';
}): number {
  if (isHomepage) return 1.0;
  if (isMainCategory) return 0.9;

  let basePriority = 0.7;

  switch (contentType) {
    case 'article':
      basePriority = 0.8;
      break;
    case 'category':
      basePriority = 0.7;
      break;
    default:
      basePriority = 0.6;
  }

  // Adjust for content freshness
  if (daysSinceUpdate <= 7) basePriority += 0.1;
  else if (daysSinceUpdate <= 30) basePriority += 0.05;
  else if (daysSinceUpdate > 365) basePriority -= 0.1;

  // Adjust for popularity
  if (isPopularContent) basePriority += 0.1;

  // Ensure within valid range
  return Math.max(0.1, Math.min(1.0, basePriority));
}

/**
 * Format sitemap entry for debugging
 */
function _formatSitemapEntry(entry: SitemapEntry): string {
  return `URL: ${entry.url}
  Priority: ${entry.priority}
  Change Frequency: ${entry.changeFrequency}
  Last Modified: ${entry.lastModified.toISOString()}`;
}

/**
 * Get sitemap statistics
 */
export function getSitemapStats(entries: SitemapEntry[]) {
  const stats = {
    total: entries.length,
    byPriority: {
      high: entries.filter((e) => e.priority >= 0.8).length,
      medium: entries.filter((e) => e.priority >= 0.5 && e.priority < 0.8)
        .length,
      low: entries.filter((e) => e.priority < 0.5).length,
    },
    byFrequency: {
      daily: entries.filter((e) => e.changeFrequency === 'daily').length,
      weekly: entries.filter((e) => e.changeFrequency === 'weekly').length,
      monthly: entries.filter((e) => e.changeFrequency === 'monthly').length,
      other: entries.filter(
        (e) => !['daily', 'weekly', 'monthly'].includes(e.changeFrequency)
      ).length,
    },
  };

  return stats;
}
