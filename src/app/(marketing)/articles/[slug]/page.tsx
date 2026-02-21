import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import { processArticleContent } from '@/lib/content/markdown';
import type { Article } from '@/lib/supabase';
import { SingleArticleStructuredData } from '@/components/seo/StructuredData';
import { createArticleMetadata } from '@/lib/seo/metadata';
import ClientWrapper from './_components/ClientWrapper';

// Interface for page params
interface ArticlePageParams {
  slug: string;
}

interface ArticlePageProps {
  params: ArticlePageParams;
}

// Generate static params for all published articles
export async function generateStaticParams(): Promise<ArticlePageParams[]> {
  try {
    const { data: articles, error } = await getSupabaseAdmin()
      .from('articles')
      .select('slug')
      .eq('status', 'published');

    if (error) {
      console.error(
        'Error fetching article slugs for static generation:',
        error
      );
      return [];
    }

    return articles?.map((article) => ({ slug: article.slug })) || [];
  } catch (err) {
    console.error('Unexpected error generating static params:', err);
    return [];
  }
}

// Fetch individual article by slug
async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const { data: article, error } = await getSupabaseAdmin()
      .from('articles')
      .select(
        `
        *,
        users!inner (
          handle,
          display_name,
          avatar_url
        )
      `
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - article not found
        return null;
      }
      console.error('Error fetching article:', error);
      return null;
    }

    return article;
  } catch (err) {
    console.error('Unexpected error fetching article:', err);
    return null;
  }
}

// Increment view count for the article
async function incrementViewCount(articleId: string): Promise<void> {
  try {
    // First get the current view count
    const { data: currentArticle, error: fetchError } = await getSupabaseAdmin()
      .from('articles')
      .select('view_count')
      .eq('id', articleId)
      .single();

    if (fetchError) {
      console.error('Error fetching current view count:', fetchError);
      return;
    }

    // Then increment it
    const { error: updateError } = await getSupabaseAdmin()
      .from('articles')
      .update({ view_count: (currentArticle?.view_count || 0) + 1 })
      .eq('id', articleId);

    if (updateError) {
      console.error('Error updating view count:', updateError);
    }
  } catch (err) {
    // Don't fail the page if view count update fails
    console.error('Error incrementing view count:', err);
  }
}

// Generate comprehensive metadata for SEO and social sharing
export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found | StrayLight',
      description: 'The requested article could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Optimize description for SEO (155 characters max for Google)
  const description =
    article.excerpt ||
    article.body_md
      ?.slice(0, 150)
      .replace(/[#*`\[\]]/g, '')
      .trim() + '...' ||
    `Read "${article.title}" on StrayLight - insights on AI career guidance and technology trends.`;

  // Use enhanced article metadata creation
  const authorName =
    (article as any).users?.display_name ||
    (article as any).users?.handle ||
    'StrayLight Team';
  return createArticleMetadata({
    title: article.title,
    description,
    path: `/articles/${article.slug}`,
    publishedTime: article.published_at || article.created_at,
    modifiedTime: article.updated_at || article.created_at,
    authors: [authorName],
    tags: article.tags || [],
  });
}

// ISR Configuration: Incremental Static Regeneration
// Revalidate every 3600 seconds (1 hour) for optimal balance between
// performance and content freshness. This ensures:
// - Fast page loads from cached static pages
// - Content updates within a reasonable timeframe
// - Reduced server load compared to SSR
export const revalidate = 3600;

// Dynamic rendering strategy - force static for better performance
export const dynamic = 'force-static';

// Set cache control headers for optimal ISR performance
export const runtime = 'nodejs';

// Configure dynamic segments behavior
export const dynamicParams = true;

// Main article page component
export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleBySlug(params.slug);

  // Handle article not found
  if (!article) {
    notFound();
  }

  // Process the markdown content
  const processedContent = await processArticleContent(article);

  // Increment view count (fire and forget)
  incrementViewCount(article.id);

  return (
    <>
      {/* SEO Structured Data - JSON-LD for rich search results */}
      <SingleArticleStructuredData article={article} />

      {/* Client component handles theme-aware rendering */}
      <ClientWrapper article={article} processedContent={processedContent} />
    </>
  );
}
