import { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_METADATA } from '@/lib/seo/metadata';

/**
 * Comprehensive XML Sitemap Generation System
 * Dynamically generates sitemap with all public pages, articles, and content
 */

interface Article {
  slug: string;
  updated_at: string;
  published_at: string | null;
  created_at: string;
  title?: string;
  status: string;
}

interface LibraryItem {
  id: string;
  updated_at: string;
  created_at: string;
  item_type: string;
  submission_status: string;
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
 * Fetch all published articles for sitemap
 */
async function getPublishedArticles(): Promise<Article[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('articles')
      .select('slug, updated_at, published_at, created_at, title, status')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(10000); // Reasonable limit for sitemap

    if (error) {
      console.error('Error fetching articles for sitemap:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching articles for sitemap:', err);
    return [];
  }
}

/**
 * Fetch library items if they have public pages
 */
async function getLibraryItems(): Promise<LibraryItem[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('library_items')
      .select('id, updated_at, created_at, item_type, submission_status')
      .eq('submission_status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(5000); // Reasonable limit

    if (error) {
      console.error('Error fetching library items for sitemap:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching library items for sitemap:', err);
    return [];
  }
}

/**
 * Get the most recent article update date for homepage priority
 */
function getLatestContentDate(articles: Article[]): Date {
  if (articles.length === 0) return new Date();

  const latestArticle = articles.reduce((latest, article) => {
    const articleDate = new Date(article.updated_at);
    const latestDate = new Date(latest.updated_at);
    return articleDate > latestDate ? article : latest;
  });

  return new Date(latestArticle.updated_at);
}

/**
 * Calculate priority based on content age and type
 */
function calculateArticlePriority(article: Article): number {
  const now = new Date();
  const updated = new Date(article.updated_at);
  const daysSinceUpdate = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recent articles get higher priority
  if (daysSinceUpdate <= 7) return 0.9;
  if (daysSinceUpdate <= 30) return 0.8;
  if (daysSinceUpdate <= 90) return 0.7;
  return 0.6;
}

/**
 * Calculate change frequency based on content age
 */
function calculateChangeFrequency(
  lastModified: Date
): 'daily' | 'weekly' | 'monthly' {
  const now = new Date();
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceUpdate <= 7) return 'daily';
  if (daysSinceUpdate <= 30) return 'weekly';
  return 'monthly';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  // Fetch dynamic content
  const [articles, libraryItems] = await Promise.all([
    getPublishedArticles(),
    getLibraryItems(),
  ]);

  const latestContentDate = getLatestContentDate(articles);

  // ============================================================================
  // STATIC PAGES - Core application pages
  // ============================================================================
  const staticPages: SitemapEntry[] = [
    // Homepage - Highest priority, updated when new content is published
    {
      url: baseUrl,
      lastModified: latestContentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },

    // Primary content pages
    {
      url: `${baseUrl}/articles`,
      lastModified:
        articles.length > 0 ? new Date(articles[0].updated_at) : new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/library`,
      lastModified:
        libraryItems.length > 0
          ? new Date(libraryItems[0].updated_at)
          : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Secondary pages
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Quiz pages - LightTool feature
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/quiz/questions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // Testing and utility pages (lower priority)
    {
      url: `${baseUrl}/test-opengraph`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // ============================================================================
  // DYNAMIC ARTICLE PAGES - Published articles with smart prioritization
  // ============================================================================
  const articlePages: SitemapEntry[] = articles.map((article) => {
    const lastModified = new Date(article.updated_at);

    return {
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified,
      changeFrequency: calculateChangeFrequency(lastModified),
      priority: calculateArticlePriority(article),
    };
  });

  // ============================================================================
  // LIBRARY ITEMS - If individual pages exist (placeholder for future)
  // ============================================================================
  const libraryPages: SitemapEntry[] = [];
  // Note: Currently library items don't have individual pages
  // When implemented, uncomment:
  /*
  const libraryPages: SitemapEntry[] = libraryItems.map((item) => ({
    url: `${baseUrl}/library/${item.id}`,
    lastModified: new Date(item.updated_at),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  */

  // ============================================================================
  // CATEGORY AND TAG PAGES (Future Enhancement)
  // ============================================================================
  // When category/tag pages are implemented, add them here
  const categoryPages: SitemapEntry[] = [];

  // ============================================================================
  // COMBINE AND RETURN
  // ============================================================================
  const allPages = [
    ...staticPages,
    ...articlePages,
    ...libraryPages,
    ...categoryPages,
  ];

  // Sort by priority (highest first) for better SEO
  allPages.sort((a, b) => b.priority - a.priority);

  // Log sitemap generation for monitoring
  console.log(`Generated sitemap with ${allPages.length} URLs:`);
  console.log(`- ${staticPages.length} static pages`);
  console.log(`- ${articlePages.length} article pages`);
  console.log(`- ${libraryPages.length} library pages`);
  console.log(`- ${categoryPages.length} category pages`);

  // Convert to Next.js MetadataRoute.Sitemap format
  return allPages.map((page) => ({
    url: page.url,
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
