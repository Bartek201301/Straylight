import { Metadata } from 'next';
import { createArticleOpenGraph, createWebsiteOpenGraph } from './opengraph';
import {
  createWebsiteTwitterCard,
  createArticleTwitterCard,
} from './twitter-cards';

/**
 * Default metadata configuration for consistent SEO across the application
 */
export const DEFAULT_METADATA = {
  siteName: 'StrayLight - Kompletny Zestaw Narzędzi AI i Centrum Wiedzy',
  baseUrl: process.env.NEXTAUTH_URL || 'https://straylight.ai',
  creator: 'StrayLight Team',
  publisher: 'StrayLight',
  twitterHandle: '@straylight_dev',
  defaultDescription:
    'Kompleksowa platforma AI oferująca bibliotekę zaawansowanych narzędzi, możliwość tworzenia i czytania artykułów oraz bogate zasoby wiedzy.',
  defaultKeywords: [
    'AI career guidance',
    'professional development',
    'technology careers',
    'Gen-Z careers',
    'future of work',
    'career coaching',
  ],
  defaultImage: '/og-default.jpg',
} as const;

/**
 * Utility function to create consistent metadata with proper fallbacks
 */
export function createMetadata({
  title,
  description,
  keywords = [],
  path = '/',
  image,
  robots = {
    index: true,
    follow: true,
  },
  noIndex = false,
}: {
  title: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
  robots?: {
    index: boolean;
    follow: boolean;
  };
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title.includes('StrayLight')
    ? title
    : `${title} | StrayLight`;
  const finalDescription = description || DEFAULT_METADATA.defaultDescription;
  const allKeywords = Array.from(
    new Set([...keywords, ...DEFAULT_METADATA.defaultKeywords])
  );
  const canonicalUrl = path === '/' ? '/' : path;
  const fullImageUrl = image || DEFAULT_METADATA.defaultImage;
  const fullCanonicalUrl = `${DEFAULT_METADATA.baseUrl}${canonicalUrl}`;

  // Override robots if noIndex is true
  const finalRobots = noIndex ? { index: false, follow: false } : robots;

  return {
    title: fullTitle,
    description: finalDescription,
    keywords: allKeywords,
    authors: [{ name: DEFAULT_METADATA.creator }],
    creator: DEFAULT_METADATA.creator,
    publisher: DEFAULT_METADATA.publisher,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(DEFAULT_METADATA.baseUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: createWebsiteOpenGraph({
      title: fullTitle,
      description: finalDescription,
      url: fullCanonicalUrl,
      image: fullImageUrl,
      keywords: allKeywords,
    }),
    twitter: createWebsiteTwitterCard({
      title: fullTitle,
      description: finalDescription,
      image: fullImageUrl,
      keywords: allKeywords,
    }),
    robots: {
      ...finalRobots,
      googleBot: {
        index: finalRobots.index,
        follow: finalRobots.follow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Creates metadata for protected/auth pages that shouldn't be indexed
 */
export function createProtectedPageMetadata({
  title,
  description,
  path = '/',
}: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  return createMetadata({
    title,
    description,
    path,
    noIndex: true,
  });
}

/**
 * Creates metadata for article pages with article-specific properties
 */
export function createArticleMetadata({
  title,
  description,
  path,
  image,
  publishedTime,
  modifiedTime,
  authors = [DEFAULT_METADATA.creator],
  tags = [],
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}): Metadata {
  const metadata = createMetadata({
    title,
    description,
    path,
    image,
  });

  // Create enhanced article OpenGraph metadata
  const articleOpenGraph = createArticleOpenGraph({
    title,
    description,
    url: `${DEFAULT_METADATA.baseUrl}${path}`,
    image,
    publishedTime,
    modifiedTime,
    authors,
    tags,
  });

  // Create enhanced Twitter Card for articles
  const articleTwitterCard = createArticleTwitterCard({
    title,
    description,
    image,
    author: authors[0],
    publishedTime,
    tags,
    url: `${DEFAULT_METADATA.baseUrl}${path}`,
  });

  // Enhance with article-specific metadata
  return {
    ...metadata,
    openGraph: articleOpenGraph,
    twitter: articleTwitterCard,
    other: {
      ...(publishedTime && { 'article:published_time': publishedTime }),
      ...(modifiedTime && { 'article:modified_time': modifiedTime }),
      'article:author': authors.join(','),
      ...(tags.length > 0 && { 'article:tag': tags.join(',') }),
    },
  };
}
