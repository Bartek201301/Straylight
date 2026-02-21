/**
 * Affiliate Integration Utilities
 *
 * Provides integration functions for automatically processing affiliate URLs
 * in API responses and database operations.
 */

import {
  injectAffiliateId,
  detectPlatform,
  validateAffiliateConfig,
} from './affiliate';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';

// Configuration for automatic affiliate processing
const AFFILIATE_INTEGRATION_CONFIG = {
  // Whether to automatically inject affiliate IDs in API responses
  AUTO_INJECT_IN_RESPONSES:
    process.env.NEXT_PUBLIC_AUTO_INJECT_AFFILIATES !== 'false',

  // Whether to force replace existing affiliate parameters
  FORCE_REPLACE_EXISTING: process.env.AFFILIATE_FORCE_REPLACE === 'true',

  // Whether to log affiliate injection activities (useful for debugging)
  LOG_AFFILIATE_ACTIVITIES: process.env.NODE_ENV === 'development',
} as const;

/**
 * Process a single affiliate library item to inject affiliate IDs
 */
function processAffiliateLibraryItem(
  item: AffiliateLibraryRow,
  options: {
    forceReplace?: boolean;
    includeMetadata?: boolean;
  } = {}
): AffiliateLibraryRow & {
  affiliate_metadata?: {
    platform: string | null;
    original_url: string;
    injected: boolean;
  };
} {
  const { forceReplace = AFFILIATE_INTEGRATION_CONFIG.FORCE_REPLACE_EXISTING } =
    options;

  // Process the affiliate URL
  const originalUrl = item.affiliate_url;
  const processedUrl = injectAffiliateId(originalUrl, { forceReplace });
  const platform = detectPlatform(originalUrl);

  // Log activity if enabled
  if (AFFILIATE_INTEGRATION_CONFIG.LOG_AFFILIATE_ACTIVITIES) {
    if (originalUrl !== processedUrl) {
      console.log(
        `Affiliate injection: ${platform?.name || 'Unknown'} - ${originalUrl} -> ${processedUrl}`
      );
    }
  }

  // Create processed item
  const processedItem: AffiliateLibraryRow = {
    ...item,
    affiliate_url: processedUrl,
  };

  // Add metadata if requested
  if (options.includeMetadata) {
    return {
      ...processedItem,
      affiliate_metadata: {
        platform: platform?.name || null,
        original_url: originalUrl,
        injected: originalUrl !== processedUrl,
      },
    };
  }

  return processedItem;
}

/**
 * Process multiple affiliate library items
 */
export function processAffiliateLibraryItems(
  items: AffiliateLibraryRow[],
  options: {
    forceReplace?: boolean;
    includeMetadata?: boolean;
  } = {}
): (AffiliateLibraryRow & {
  affiliate_metadata?: {
    platform: string | null;
    original_url: string;
    injected: boolean;
  };
})[] {
  return items.map((item) => processAffiliateLibraryItem(item, options));
}

/**
 * Middleware function for API responses to automatically process affiliate URLs
 */
function _withAffiliateInjection<T extends { affiliate_url?: string }>(
  data: T | T[],
  options: {
    enabled?: boolean;
    forceReplace?: boolean;
    includeMetadata?: boolean;
  } = {}
): T | T[] {
  // Check if auto-injection is enabled
  if (
    !options.enabled &&
    !AFFILIATE_INTEGRATION_CONFIG.AUTO_INJECT_IN_RESPONSES
  ) {
    return data;
  }

  // Process single item
  if (!Array.isArray(data)) {
    if (data.affiliate_url) {
      const originalUrl = data.affiliate_url;
      const processedUrl = injectAffiliateId(originalUrl, {
        forceReplace:
          options.forceReplace ||
          AFFILIATE_INTEGRATION_CONFIG.FORCE_REPLACE_EXISTING,
      });

      return {
        ...data,
        affiliate_url: processedUrl,
      };
    }
    return data;
  }

  // Process array of items
  return data.map((item) => {
    if (item.affiliate_url) {
      const originalUrl = item.affiliate_url;
      const processedUrl = injectAffiliateId(originalUrl, {
        forceReplace:
          options.forceReplace ||
          AFFILIATE_INTEGRATION_CONFIG.FORCE_REPLACE_EXISTING,
      });

      return {
        ...item,
        affiliate_url: processedUrl,
      };
    }
    return item;
  });
}

/**
 * Validate URLs before storing in database
 */
export function validateAffiliateUrl(url: string): {
  isValid: boolean;
  platform: string | null;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic URL validation
  try {
    new URL(url);
  } catch (error) {
    errors.push('Invalid URL format');
    return {
      isValid: false,
      platform: null,
      errors,
      warnings,
    };
  }

  // Detect platform
  const platform = detectPlatform(url);

  // Check if platform is supported
  if (!platform) {
    warnings.push(
      'URL platform not recognized for automatic affiliate injection'
    );
  }

  // Check if URL already has affiliate parameters
  const urlObj = new URL(url);
  if (platform && urlObj.searchParams.has(platform.parameterKey)) {
    warnings.push(
      `URL already contains affiliate parameter: ${platform.parameterKey}`
    );
  }

  // Validate affiliate configuration for this platform
  if (platform) {
    const config = validateAffiliateConfig();
    if (!config.availablePlatforms.includes(platform.name)) {
      warnings.push(`No affiliate ID configured for ${platform.name}`);
    }
  }

  return {
    isValid: errors.length === 0,
    platform: platform?.name || null,
    errors,
    warnings,
  };
}

/**
 * Bulk URL validation for batch operations
 */
function _validateAffiliateUrls(urls: string[]): {
  valid: string[];
  invalid: { url: string; errors: string[] }[];
  warnings: { url: string; warnings: string[] }[];
} {
  const valid: string[] = [];
  const invalid: { url: string; errors: string[] }[] = [];
  const warnings: { url: string; warnings: string[] }[] = [];

  urls.forEach((url) => {
    const validation = validateAffiliateUrl(url);

    if (validation.isValid) {
      valid.push(url);
      if (validation.warnings.length > 0) {
        warnings.push({ url, warnings: validation.warnings });
      }
    } else {
      invalid.push({ url, errors: validation.errors });
    }
  });

  return { valid, invalid, warnings };
}

/**
 * Analytics helper to track affiliate link performance
 */
function _createAffiliateAnalytics(items: AffiliateLibraryRow[]): {
  total_items: number;
  platforms: Record<
    string,
    {
      count: number;
      total_clicks: number;
      avg_rating: number;
    }
  >;
  top_performers: Array<{
    id: string;
    title: string;
    clicks: number;
    platform: string | null;
  }>;
} {
  const platforms: Record<
    string,
    {
      count: number;
      total_clicks: number;
      avg_rating: number;
      ratings: number[];
    }
  > = {};

  // Process each item
  items.forEach((item) => {
    const platform = detectPlatform(item.affiliate_url);
    const platformName = platform?.name || 'Unknown';

    if (!platforms[platformName]) {
      platforms[platformName] = {
        count: 0,
        total_clicks: 0,
        avg_rating: 0,
        ratings: [],
      };
    }

    platforms[platformName].count++;
    platforms[platformName].total_clicks += item.click_count;

    if (item.rating) {
      platforms[platformName].ratings.push(item.rating);
    }
  });

  // Calculate average ratings
  Object.keys(platforms).forEach((platformName) => {
    const platform = platforms[platformName];
    if (platform.ratings.length > 0) {
      platform.avg_rating =
        platform.ratings.reduce((sum, rating) => sum + rating, 0) /
        platform.ratings.length;
    }
    delete (platform as any).ratings; // Remove temporary ratings array
  });

  // Get top performers
  const topPerformers = items
    .sort((a, b) => b.click_count - a.click_count)
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      title: item.title,
      clicks: item.click_count,
      platform: detectPlatform(item.affiliate_url)?.name || null,
    }));

  return {
    total_items: items.length,
    platforms: platforms as Record<
      string,
      { count: number; total_clicks: number; avg_rating: number }
    >,
    top_performers: topPerformers,
  };
}

/**
 * Configuration status for affiliate integration
 */
function _getAffiliateIntegrationStatus(): {
  auto_injection_enabled: boolean;
  force_replace_enabled: boolean;
  logging_enabled: boolean;
  supported_platforms: string[];
  configured_platforms: string[];
  missing_platforms: string[];
} {
  const config = validateAffiliateConfig();

  return {
    auto_injection_enabled:
      AFFILIATE_INTEGRATION_CONFIG.AUTO_INJECT_IN_RESPONSES,
    force_replace_enabled: AFFILIATE_INTEGRATION_CONFIG.FORCE_REPLACE_EXISTING,
    logging_enabled: AFFILIATE_INTEGRATION_CONFIG.LOG_AFFILIATE_ACTIVITIES,
    supported_platforms: [
      'Amazon',
      'Barnes & Noble',
      'Gumroad',
      'Paddle',
      'Lemon Squeezy',
    ],
    configured_platforms: config.availablePlatforms,
    missing_platforms: config.missingIds,
  };
}
