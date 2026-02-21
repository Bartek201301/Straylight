import { DEFAULT_METADATA } from './metadata';

/**
 * Open Graph image dimensions and configuration
 */
export const OG_IMAGE_CONFIG = {
  width: 1200,
  height: 630,
  quality: 90,
} as const;

/**
 * Open Graph image types and categories
 */
const OG_IMAGE_TYPES = {
  article: 'og-article',
  website: 'og-website',
  profile: 'og-profile',
  book: 'og-book',
  video: 'og-video',
} as const;

/**
 * Generate dynamic Open Graph image URL with parameters
 */
function generateOGImageUrl({
  title,
  type = 'website',
  author,
  category,
  tags = [],
  customParams = {},
}: {
  title: string;
  type?: keyof typeof OG_IMAGE_TYPES;
  author?: string;
  category?: string;
  tags?: string[];
  customParams?: Record<string, string>;
}): string {
  const baseUrl = '/api/og';
  const params = new URLSearchParams({
    title: title.slice(0, 100), // Limit title length for URL
    type: OG_IMAGE_TYPES[type],
    ...customParams,
  });

  if (author) {
    params.set('author', author);
  }

  if (category) {
    params.set('category', category);
  }

  if (tags.length > 0) {
    params.set('tags', tags.slice(0, 3).join(','));
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Enhanced Open Graph metadata for articles
 */
export function createArticleOpenGraph({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
  authors = ['StrayLight Team'],
  section = 'Technology',
  tags = [],
  readingTimeMinutes,
  wordCount,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
  readingTimeMinutes?: number;
  wordCount?: number;
}) {
  // Generate dynamic OG image if none provided
  const ogImageUrl =
    image ||
    generateOGImageUrl({
      title,
      type: 'article',
      author: authors[0],
      category: section,
      tags,
    });

  return {
    title,
    description,
    url,
    siteName: DEFAULT_METADATA.siteName,
    locale: 'en_US',
    type: 'article' as const,
    publishedTime,
    modifiedTime,
    authors,
    section,
    tags,
    images: [
      {
        url: ogImageUrl,
        width: OG_IMAGE_CONFIG.width,
        height: OG_IMAGE_CONFIG.height,
        alt: `${title} - StrayLight Article`,
        type: 'image/png',
      },
      // Fallback image
      {
        url: '/og-article-default.jpg',
        width: OG_IMAGE_CONFIG.width,
        height: OG_IMAGE_CONFIG.height,
        alt: `${title} - StrayLight Article`,
        type: 'image/jpeg',
      },
    ],
    // Additional article metadata
    ...(readingTimeMinutes && {
      'article:reading_time': readingTimeMinutes.toString(),
    }),
    ...(wordCount && {
      'article:word_count': wordCount.toString(),
    }),
  };
}

/**
 * Enhanced Open Graph metadata for website pages
 */
export function createWebsiteOpenGraph({
  title,
  description,
  url,
  image,
  category,
  keywords = [],
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  category?: string;
  keywords?: string[];
}) {
  // Generate dynamic OG image if none provided
  const ogImageUrl =
    image ||
    generateOGImageUrl({
      title,
      type: 'website',
      category,
      tags: keywords.slice(0, 3),
    });

  return {
    title,
    description,
    url,
    siteName: DEFAULT_METADATA.siteName,
    locale: 'en_US',
    type: 'website' as const,
    images: [
      {
        url: ogImageUrl,
        width: OG_IMAGE_CONFIG.width,
        height: OG_IMAGE_CONFIG.height,
        alt: `${title} - ${DEFAULT_METADATA.siteName}`,
        type: 'image/png',
      },
      // Fallback image
      {
        url: DEFAULT_METADATA.defaultImage,
        width: OG_IMAGE_CONFIG.width,
        height: OG_IMAGE_CONFIG.height,
        alt: `${title} - ${DEFAULT_METADATA.siteName}`,
        type: 'image/jpeg',
      },
    ],
  };
}

/**
 * Enhanced Open Graph metadata for library/book pages
 */
function _createLibraryOpenGraph({
  title,
  description,
  url,
  image,
  books = [],
  totalItems,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  books?: string[];
  totalItems?: number;
}) {
  // Generate dynamic OG image for library
  const ogImageUrl =
    image ||
    generateOGImageUrl({
      title,
      type: 'book',
      customParams: {
        books: books.slice(0, 3).join(','),
        ...(totalItems && { total: totalItems.toString() }),
      },
    });

  return {
    title,
    description,
    url,
    siteName: DEFAULT_METADATA.siteName,
    locale: 'en_US',
    type: 'website' as const,
    images: [
      {
        url: ogImageUrl,
        width: OG_IMAGE_CONFIG.width,
        height: OG_IMAGE_CONFIG.height,
        alt: `${title} - ${DEFAULT_METADATA.siteName}`,
        type: 'image/png',
      },
    ],
  };
}

/**
 * Create structured Open Graph video metadata
 */
function _createVideoOpenGraph({
  title,
  description,
  url,
  videoUrl,
  duration,
  image,
}: {
  title: string;
  description: string;
  url: string;
  videoUrl: string;
  duration?: number;
  image?: string;
}) {
  return {
    title,
    description,
    url,
    siteName: DEFAULT_METADATA.siteName,
    locale: 'en_US',
    type: 'video.other' as const,
    videos: [
      {
        url: videoUrl,
        type: 'video/mp4',
        width: 1280,
        height: 720,
      },
    ],
    images: image
      ? [
          {
            url: image,
            width: OG_IMAGE_CONFIG.width,
            height: OG_IMAGE_CONFIG.height,
            alt: `${title} - Video Thumbnail`,
            type: 'image/jpeg',
          },
        ]
      : undefined,
    ...(duration && { 'video:duration': duration.toString() }),
  };
}

/**
 * Generate comprehensive Open Graph tags for debugging
 */
export function getOpenGraphDebugInfo(openGraph: any) {
  const debugTags = [];

  // Essential OG tags
  debugTags.push(`og:title: ${openGraph.title || 'Not set'}`);
  debugTags.push(`og:description: ${openGraph.description || 'Not set'}`);
  debugTags.push(`og:type: ${openGraph.type || 'Not set'}`);
  debugTags.push(`og:url: ${openGraph.url || 'Not set'}`);
  debugTags.push(`og:site_name: ${openGraph.siteName || 'Not set'}`);
  debugTags.push(`og:locale: ${openGraph.locale || 'Not set'}`);

  // Images
  if (openGraph.images?.length > 0) {
    openGraph.images.forEach((img: any, index: number) => {
      debugTags.push(`og:image:${index}: ${img.url}`);
      debugTags.push(`og:image:width:${index}: ${img.width}`);
      debugTags.push(`og:image:height:${index}: ${img.height}`);
      debugTags.push(`og:image:alt:${index}: ${img.alt}`);
    });
  }

  // Article-specific tags
  if (openGraph.type === 'article') {
    debugTags.push(
      `article:published_time: ${openGraph.publishedTime || 'Not set'}`
    );
    debugTags.push(
      `article:modified_time: ${openGraph.modifiedTime || 'Not set'}`
    );
    debugTags.push(
      `article:author: ${openGraph.authors?.join(', ') || 'Not set'}`
    );
    debugTags.push(`article:section: ${openGraph.section || 'Not set'}`);
    debugTags.push(`article:tag: ${openGraph.tags?.join(', ') || 'Not set'}`);
  }

  return debugTags;
}

/**
 * Validate Open Graph metadata completeness
 */
export function validateOpenGraphMetadata(openGraph: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!openGraph.title) errors.push('Missing og:title');
  if (!openGraph.description) errors.push('Missing og:description');
  if (!openGraph.type) errors.push('Missing og:type');
  if (!openGraph.url) errors.push('Missing og:url');

  // Recommended fields
  if (!openGraph.siteName) warnings.push('Missing og:site_name');
  if (!openGraph.locale) warnings.push('Missing og:locale');
  if (!openGraph.images?.length) warnings.push('Missing og:image');

  // Title length check
  if (openGraph.title && openGraph.title.length > 60) {
    warnings.push('og:title is longer than 60 characters (may be truncated)');
  }

  // Description length check
  if (openGraph.description && openGraph.description.length > 155) {
    warnings.push(
      'og:description is longer than 155 characters (may be truncated)'
    );
  }

  // Image dimensions check
  if (openGraph.images?.length > 0) {
    openGraph.images.forEach((img: any, index: number) => {
      if (
        img.width !== OG_IMAGE_CONFIG.width ||
        img.height !== OG_IMAGE_CONFIG.height
      ) {
        warnings.push(
          `Image ${index} dimensions (${img.width}x${img.height}) don't match recommended size (${OG_IMAGE_CONFIG.width}x${OG_IMAGE_CONFIG.height})`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
