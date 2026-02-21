'use client';

import { useEffect, useMemo, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import ArticleCard from './ArticleCard';

interface RelatedItem {
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

interface Props {
  slug: string;
  limit?: number;
}

export default function RelatedArticles({ slug, limit = 3 }: Props) {
  const [items, setItems] = useState<RelatedItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    return `/api/articles/related/${encodeURIComponent(slug)}?${params.toString()}`;
  }, [slug, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        setItems(data);
        // Impression telemetry (no-op if GA not present)
        try {
          trackEvent(
            'article.related_impression',
            'engagement',
            slug,
            data.length
          );
        } catch {}
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, slug]);

  const handleClick = (toSlug: string, position: number) => {
    try {
      trackEvent(
        'article.related_click',
        'engagement',
        JSON.stringify({
          fromSlug: slug,
          toSlug,
          position,
        })
      );
    } catch {}
  };

  return (
    <section className="mt-12">
      <h2 className={`text-2xl md:text-3xl font-bold mb-6 ${'text-white'}`}>
        Related articles
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center px-4 overflow-visible">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className={`w-[320px] h-[220px] rounded-md shadow-xl animate-pulse ${'bg-white/10'}`}
            >
              <div className="p-3 space-y-2 h-full flex flex-col justify-between">
                {/* Author skeleton */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-8 w-8 rounded-full ${'bg-white/20'}`}
                  ></div>
                  <div className="space-y-1">
                    <div className={`h-3 rounded w-16 ${'bg-white/20'}`}></div>
                    <div className={`h-2 rounded w-12 ${'bg-white/15'}`}></div>
                  </div>
                </div>
                {/* Content skeleton */}
                <div className="flex-1 space-y-3">
                  <div className={`h-5 rounded w-3/4 ${'bg-white/20'}`}></div>
                  <div className="space-y-1">
                    <div
                      className={`h-3 rounded w-full ${'bg-white/15'}`}
                    ></div>
                    <div className={`h-3 rounded w-4/5 ${'bg-white/15'}`}></div>
                  </div>
                </div>
                {/* Footer skeleton */}
                <div className="flex justify-between items-center">
                  <div className={`h-5 rounded w-12 ${'bg-white/20'}`}></div>
                  <div className={`h-6 rounded w-10 ${'bg-white/20'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center px-4 overflow-visible">
          {items.slice(0, limit).map((item, idx) => {
            // Transform RelatedItem to match ArticleCard interface
            const articleForCard = {
              id: item.id,
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              body_md: item.body_md,
              status: 'published', // All related articles are published
              tags: item.tags,
              view_count: item.viewCount,
              created_at: item.publishedAt || new Date().toISOString(),
              updated_at: item.publishedAt || new Date().toISOString(),
              published_at: item.publishedAt || null,
              author_id: item.authorId,
              cover_image_url: item.coverUrl,
              users: item.users,
            };

            return (
              <div key={item.id} onClick={() => handleClick(item.slug, idx)}>
                <ArticleCard article={articleForCard} variant="compact" />
              </div>
            );
          })}
        </div>
      ) : (
        <p className={'text-neutral-400'}>No related posts yet.</p>
      )}
    </section>
  );
}
