import { MetadataRoute } from 'next';
import { DEFAULT_METADATA } from '@/lib/seo/metadata';

/**
 * Enhanced Robots.txt generation for comprehensive SEO optimization
 * Controls search engine crawling behavior with platform-specific rules
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  return {
    rules: [
      // ========================================================================
      // GENERAL SEARCH ENGINES - Primary indexing rules
      // ========================================================================
      {
        userAgent: '*',
        allow: [
          '/',
          '/articles/',
          '/research',
          '/library',
          '/about',
          '/test-opengraph', // Allow testing page for development
          '/api/og/', // Allow OG image generation
          '/api/twitter-card/', // Allow Twitter Card image generation
        ],
        disallow: [
          '/api/*', // Block most API routes
          '!/api/og/', // Except OG images
          '!/api/twitter-card/', // Except Twitter Card images
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/access-denied',
          '/test-editor',
          '/editor-test',
          '/*?*', // Block URLs with query parameters
          '/articles/draft*',
          '/articles/preview*',
          '/_next/',
          '/favicon.ico',
          '/private/',
        ],
        crawlDelay: 1, // Be respectful to crawlers
      },

      // ========================================================================
      // GOOGLE - Optimized rules for Google search
      // ========================================================================
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/articles/',
          '/research',
          '/library',
          '/about',
          '/api/og/',
          '/api/twitter-card/',
        ],
        disallow: [
          '/api/*',
          '!/api/og/',
          '!/api/twitter-card/',
          '/admin/',
          '/dashboard/',
          '/auth/',
          '/access-denied',
          '/test-*',
          '/editor-*',
        ],
        crawlDelay: 0.5, // Faster for Google
      },

      // ========================================================================
      // SOCIAL MEDIA PLATFORMS - Allow content for social sharing
      // ========================================================================
      {
        userAgent: 'Twitterbot',
        allow: [
          '/',
          '/articles/',
          '/research',
          '/library',
          '/about',
          '/api/twitter-card/',
        ],
        disallow: [
          '/api/*',
          '!/api/twitter-card/',
          '/admin/',
          '/dashboard/',
          '/auth/',
        ],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: [
          '/',
          '/articles/',
          '/research',
          '/library',
          '/about',
          '/api/og/',
        ],
        disallow: ['/api/*', '!/api/og/', '/admin/', '/dashboard/', '/auth/'],
      },
      {
        userAgent: 'LinkedInBot',
        allow: [
          '/',
          '/articles/',
          '/research',
          '/library',
          '/about',
          '/api/og/',
        ],
        disallow: ['/api/*', '!/api/og/', '/admin/', '/dashboard/', '/auth/'],
      },

      // ========================================================================
      // AI CRAWLERS - Rules for AI training data collection
      // ========================================================================
      {
        userAgent: 'GPTBot', // OpenAI's web crawler
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: [
          '/api/',
          '/auth/',
          '/admin/',
          '/dashboard/',
          '/library/', // Restrict library access for AI training
        ],
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT user agent
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/', '/library/'],
      },
      {
        userAgent: 'CCBot', // Common Crawl bot
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/', '/library/'],
      },
      {
        userAgent: 'anthropic-ai', // Claude/Anthropic bot
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/', '/library/'],
      },
      {
        userAgent: 'Claude-Web', // Claude web crawler
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/', '/library/'],
      },
      {
        userAgent: 'Bard', // Google Bard
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/', '/library/'],
      },

      // ========================================================================
      // SPECIALIZED CRAWLERS
      // ========================================================================
      {
        userAgent: 'ia_archiver', // Internet Archive
        allow: ['/', '/articles/', '/research', '/about'],
        disallow: ['/api/', '/auth/', '/admin/', '/dashboard/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
