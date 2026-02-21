/**
 * Affiliate Link Injection Utility
 *
 * Automatically detects platforms and injects appropriate affiliate parameters
 * into product URLs for monetization purposes.
 */

// Environment variable keys for affiliate IDs
const AFFILIATE_CONFIG = {
  AMAZON_ASSOCIATE_ID:
    process.env.AMAZON_ASSOCIATE_ID ||
    process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID,
  BARNES_NOBLE_AFFILIATE_ID:
    process.env.BARNES_NOBLE_AFFILIATE_ID ||
    process.env.NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID,
  GUMROAD_AFFILIATE_ID:
    process.env.GUMROAD_AFFILIATE_ID ||
    process.env.NEXT_PUBLIC_GUMROAD_AFFILIATE_ID,
  PADDLE_AFFILIATE_ID:
    process.env.PADDLE_AFFILIATE_ID ||
    process.env.NEXT_PUBLIC_PADDLE_AFFILIATE_ID,
  LEMONSQUEEZY_AFFILIATE_ID:
    process.env.LEMONSQUEEZY_AFFILIATE_ID ||
    process.env.NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID,
} as const;

// Platform configuration for affiliate link injection
interface PlatformConfig {
  name: string;
  domains: string[];
  parameterKey: string;
  affiliateIdEnvKey: keyof typeof AFFILIATE_CONFIG;
  urlProcessor?: (url: URL, affiliateId: string) => URL;
  validator?: (url: URL) => boolean;
}

// Supported affiliate platforms
const AFFILIATE_PLATFORMS: PlatformConfig[] = [
  {
    name: 'Amazon',
    domains: [
      'amazon.com',
      'amazon.co.uk',
      'amazon.ca',
      'amazon.de',
      'amazon.fr',
      'amazon.it',
      'amazon.es',
      'amazon.co.jp',
      'amazon.com.au',
      'amazon.in',
      'amazon.com.br',
      'amazon.com.mx',
      'amazon.nl',
      'amazon.se',
      'amazon.sg',
    ],
    parameterKey: 'tag',
    affiliateIdEnvKey: 'AMAZON_ASSOCIATE_ID',
    validator: (url) => {
      // Amazon product URLs typically contain /dp/ or /gp/product/
      return (
        url.pathname.includes('/dp/') ||
        url.pathname.includes('/gp/product/') ||
        url.pathname.includes('/B0')
      );
    },
    urlProcessor: (url, affiliateId) => {
      // Amazon-specific processing
      // Remove existing affiliate parameters to avoid conflicts
      url.searchParams.delete('tag');
      url.searchParams.delete('linkCode');
      url.searchParams.delete('creative');
      url.searchParams.delete('creativeASIN');
      url.searchParams.delete('camp');

      // Add our affiliate tag
      url.searchParams.set('tag', affiliateId);

      return url;
    },
  },
  {
    name: 'Barnes & Noble',
    domains: ['barnesandnoble.com', 'bn.com'],
    parameterKey: 'affiliateId',
    affiliateIdEnvKey: 'BARNES_NOBLE_AFFILIATE_ID',
    validator: (url) => {
      return url.pathname.includes('/w/') || url.pathname.includes('/product/');
    },
  },
  {
    name: 'Gumroad',
    domains: ['gumroad.com'],
    parameterKey: 'a',
    affiliateIdEnvKey: 'GUMROAD_AFFILIATE_ID',
    validator: (url) => {
      return (
        url.pathname.includes('/l/') || url.hostname.endsWith('.gumroad.com')
      );
    },
  },
  {
    name: 'Paddle',
    domains: ['paddle.com'],
    parameterKey: 'vendor',
    affiliateIdEnvKey: 'PADDLE_AFFILIATE_ID',
    validator: (url) => {
      return (
        url.pathname.includes('/checkout/') || url.pathname.includes('/buy/')
      );
    },
  },
  {
    name: 'Lemon Squeezy',
    domains: ['lemonsqueezy.com'],
    parameterKey: 'aff',
    affiliateIdEnvKey: 'LEMONSQUEEZY_AFFILIATE_ID',
    validator: (url) => {
      return (
        url.pathname.includes('/checkout/') || url.pathname.includes('/buy/')
      );
    },
  },
];

/**
 * Detect the platform from a given URL
 */
export function detectPlatform(url: string): PlatformConfig | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Remove 'www.' prefix for matching
    const cleanHostname = hostname.replace(/^www\./, '');

    for (const platform of AFFILIATE_PLATFORMS) {
      // Check if hostname matches any of the platform domains
      const domainMatch = platform.domains.some(
        (domain) =>
          cleanHostname === domain || cleanHostname.endsWith('.' + domain)
      );

      if (domainMatch) {
        // If platform has a validator, use it for additional verification
        if (platform.validator && !platform.validator(urlObj)) {
          continue;
        }
        return platform;
      }
    }

    return null;
  } catch (error) {
    console.error('Error detecting platform for URL:', url, error);
    return null;
  }
}

/**
 * Inject affiliate ID into a URL based on platform detection
 */
export function injectAffiliateId(
  originalUrl: string,
  options: {
    forceReplace?: boolean;
    customAffiliateIds?: Partial<typeof AFFILIATE_CONFIG>;
  } = {}
): string {
  try {
    const platform = detectPlatform(originalUrl);

    if (!platform) {
      // No supported platform detected, return original URL
      return originalUrl;
    }

    // Get affiliate ID for this platform
    const customIds = options.customAffiliateIds || {};
    const affiliateId =
      customIds[platform.affiliateIdEnvKey] ||
      AFFILIATE_CONFIG[platform.affiliateIdEnvKey];

    if (!affiliateId) {
      console.warn(`No affiliate ID configured for platform: ${platform.name}`);
      return originalUrl;
    }

    const url = new URL(originalUrl);

    // Check if affiliate parameter already exists
    const existingParam = url.searchParams.get(platform.parameterKey);
    if (existingParam && !options.forceReplace) {
      // URL already has affiliate parameter and we're not forcing replacement
      return originalUrl;
    }

    // Use platform-specific processor if available, otherwise use default
    if (platform.urlProcessor) {
      const processedUrl = platform.urlProcessor(url, affiliateId);
      return processedUrl.toString();
    } else {
      // Default processing: just add/replace the parameter
      url.searchParams.set(platform.parameterKey, affiliateId);
      return url.toString();
    }
  } catch (error) {
    console.error('Error injecting affiliate ID:', error);
    return originalUrl; // Return original URL if anything goes wrong
  }
}

/**
 * Batch process multiple URLs for affiliate injection
 */
function _injectAffiliateIdsInBatch(
  urls: string[],
  options: {
    forceReplace?: boolean;
    customAffiliateIds?: Partial<typeof AFFILIATE_CONFIG>;
  } = {}
): { original: string; processed: string; platform: string | null }[] {
  return urls.map((url) => {
    const platform = detectPlatform(url);
    const processed = injectAffiliateId(url, options);

    return {
      original: url,
      processed,
      platform: platform?.name || null,
    };
  });
}

/**
 * Check if a URL already has affiliate parameters
 */
function _hasAffiliateParameters(url: string): boolean {
  try {
    const platform = detectPlatform(url);
    if (!platform) return false;

    const urlObj = new URL(url);
    return urlObj.searchParams.has(platform.parameterKey);
  } catch (error) {
    return false;
  }
}

/**
 * Remove affiliate parameters from a URL (useful for clean comparison)
 */
function removeAffiliateParameters(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove known affiliate parameters from all platforms
    AFFILIATE_PLATFORMS.forEach((platform) => {
      urlObj.searchParams.delete(platform.parameterKey);
    });

    // Remove additional Amazon affiliate parameters
    ['linkCode', 'creative', 'creativeASIN', 'camp', 'ascsubtag'].forEach(
      (param) => {
        urlObj.searchParams.delete(param);
      }
    );

    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Validate affiliate configuration
 */
export function validateAffiliateConfig(): {
  isValid: boolean;
  missingIds: string[];
  availablePlatforms: string[];
} {
  const missingIds: string[] = [];
  const availablePlatforms: string[] = [];

  AFFILIATE_PLATFORMS.forEach((platform) => {
    const affiliateId = AFFILIATE_CONFIG[platform.affiliateIdEnvKey];
    if (affiliateId) {
      availablePlatforms.push(platform.name);
    } else {
      missingIds.push(platform.name);
    }
  });

  return {
    isValid: availablePlatforms.length > 0,
    missingIds,
    availablePlatforms,
  };
}

/**
 * Get affiliate configuration status
 */
function _getAffiliateConfigStatus(): Record<
  string,
  {
    platform: string;
    configured: boolean;
    envKey: string;
  }
> {
  const status: Record<
    string,
    { platform: string; configured: boolean; envKey: string }
  > = {};

  AFFILIATE_PLATFORMS.forEach((platform) => {
    status[platform.name.toLowerCase()] = {
      platform: platform.name,
      configured: !!AFFILIATE_CONFIG[platform.affiliateIdEnvKey],
      envKey: platform.affiliateIdEnvKey,
    };
  });

  return status;
}

/**
 * Extract clean product information from affiliate URLs
 */
function _extractProductInfo(url: string): {
  platform: string | null;
  productId: string | null;
  cleanUrl: string;
} {
  const platform = detectPlatform(url);
  let productId: string | null = null;

  if (platform) {
    try {
      const urlObj = new URL(url);

      // Platform-specific product ID extraction
      switch (platform.name) {
        case 'Amazon':
          // Extract ASIN from Amazon URLs
          const asinMatch = urlObj.pathname.match(/\/([A-Z0-9]{10})(?:\/|$)/);
          productId = asinMatch ? asinMatch[1] : null;
          break;

        case 'Gumroad':
          // Extract product slug from Gumroad URLs
          const gumroadMatch = urlObj.pathname.match(/\/l\/([^/?]+)/);
          productId = gumroadMatch ? gumroadMatch[1] : null;
          break;

        default:
          // For other platforms, try to extract last path segment
          const pathSegments = urlObj.pathname.split('/').filter(Boolean);
          productId =
            pathSegments.length > 0
              ? pathSegments[pathSegments.length - 1]
              : null;
      }
    } catch (error) {
      console.error('Error extracting product info:', error);
    }
  }

  return {
    platform: platform?.name || null,
    productId,
    cleanUrl: removeAffiliateParameters(url),
  };
}
