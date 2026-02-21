import { getSupabaseAdmin } from '@/lib/supabase';

interface RelatedArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  coverUrl?: string | null;
  publishedAt?: string | null;
  tags: string[];
  viewCount: number;
  authorId: string;
  users?: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface GetRelatedParams {
  slug: string;
  limit?: number;
}

/**
 * Fetch related published articles by overlapping tags, excluding the current article
 * Ordered by like count desc (most popular first)
 */
export async function getRelatedArticles({
  slug,
  limit = 3,
}: GetRelatedParams): Promise<RelatedArticleItem[]> {
  // Get current article
  const { data: current, error: currentError } = await getSupabaseAdmin()
    .from('articles')
    .select('id, slug, tags')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (currentError || !current) {
    return [];
  }

  // If no tags or empty, nothing to relate
  const tags: string[] = Array.isArray(current.tags) ? current.tags : [];
  if (!tags.length) {
    return [];
  }

  // Find other published articles sharing ≥1 tag, excluding current
  // Use a simpler approach - get articles and sort by view_count as proxy for popularity
  const { data, error } = await getSupabaseAdmin()
    .from('articles')
    .select(
      `
      id, 
      slug, 
      title, 
      excerpt,
      body_md,
      cover_image_url, 
      published_at, 
      created_at,
      tags,
      view_count,
      author_id,
      users:author_id (
        handle,
        display_name,
        avatar_url
      )
    `
    )
    .eq('status', 'published')
    .overlaps('tags', tags)
    .neq('id', current.id)
    .order('view_count', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit * 2); // Get more results to filter by actual vote counts later

  if (error || !data) {
    return [];
  }

  // Get vote counts for each article
  const articlesWithVotes = await Promise.all(
    data.map(async (article) => {
      const { count } = await getSupabaseAdmin()
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('type', 'like');

      return {
        ...article,
        likeCount: count || 0,
      };
    })
  );

  // Sort by like count first, then by view count, then by published date
  const sortedArticles = articlesWithVotes
    .sort((a, b) => {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      if (b.view_count !== a.view_count) {
        return (b.view_count || 0) - (a.view_count || 0);
      }
      const aDate = new Date(a.published_at || a.created_at).getTime();
      const bDate = new Date(b.published_at || b.created_at).getTime();
      return bDate - aDate;
    })
    .slice(0, limit);

  return sortedArticles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || '',
    body_md: a.body_md || '',
    coverUrl: a.cover_image_url ?? null,
    publishedAt: a.published_at ?? a.created_at ?? null,
    tags: a.tags || [],
    viewCount: a.view_count || 0,
    authorId: a.author_id,
    users: (a as any).users
      ? {
          handle: (a as any).users.handle,
          display_name: (a as any).users.display_name,
          avatar_url: (a as any).users.avatar_url,
        }
      : undefined,
  }));
}
