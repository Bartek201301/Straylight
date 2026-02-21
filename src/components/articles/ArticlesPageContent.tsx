'use client';

import { useEffect, useState, Suspense } from 'react';
import { MiniNewsletterSignup } from '@/components/newsletter/MiniNewsletterSignup';
import { useTheme } from '@/contexts/ThemeContext';
import ClientArticleCard from '@/components/articles/ClientArticleCard';

import { ArticleListStructuredData } from '@/components/seo/StructuredData';

// Article type definition - aligned with ArticleCard interface
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  status: string;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string;
  cover_image_url?: string | null;
  users?: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Skeleton loading component - updated for ArticleCard dimensions
function ArticlesGridSkeleton(_props: { resolvedTheme: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8 justify-items-center px-2 xs:px-3 sm:px-4 md:px-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className={`w-full max-w-[340px] sm:max-w-[360px] lg:max-w-[380px] h-[260px] sm:h-[280px] rounded-md shadow-xl animate-pulse ${'bg-white/10'}`}
        >
          <div className="p-4 space-y-3 h-full flex flex-col justify-between">
            {/* Author skeleton */}
            <div className="flex items-center space-x-3">
              <div className={`h-10 w-10 rounded-full ${'bg-white/20'}`}></div>
              <div className="space-y-2">
                <div className={`h-4 rounded w-20 ${'bg-white/20'}`}></div>
                <div className={`h-3 rounded w-16 ${'bg-white/15'}`}></div>
              </div>
            </div>
            {/* Content skeleton */}
            <div className="flex-1 space-y-4">
              <div className={`h-6 rounded w-3/4 ${'bg-white/20'}`}></div>
              <div className="space-y-2">
                <div className={`h-4 rounded w-full ${'bg-white/15'}`}></div>
                <div className={`h-4 rounded w-4/5 ${'bg-white/15'}`}></div>
              </div>
            </div>
            {/* Footer skeleton */}
            <div className="flex justify-between items-center">
              <div className={`h-6 rounded w-16 ${'bg-white/20'}`}></div>
              <div className={`h-8 rounded w-12 ${'bg-white/20'}`}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main articles content component
function ArticlesContent() {
  const { resolvedTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const articlesPerPage = 9; // 9 articles per page for 3-column grid

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load real articles from API (published only), with pagination
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const limit = articlesPerPage;
        const offset = (currentPage - 1) * articlesPerPage;
        const res = await fetch(
          `/api/articles?status=published&limit=${limit}&offset=${offset}&sort_order=desc`,
          { cache: 'no-store' }
        );
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || 'Failed to load articles');
        }

        const apiArticles = (json.data?.articles || []) as any[];
        const normalized: Article[] = apiArticles.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt || '',
          body_md: a.body_md || '',
          status: a.status,
          tags: a.tags || [],
          view_count: a.view_count || 0,
          created_at: a.created_at,
          updated_at: a.updated_at,
          published_at: a.published_at,
          author_id: a.author_id,
          cover_image_url: a.cover_image_url || null,
          // Add user information for ArticleCard - use actual user data or fallback
          users: a.users || {
            handle: 'straylight',
            display_name: 'StrayLight',
            avatar_url: null,
          },
        }));

        setArticles(normalized);
        setTotal(json.data?.pagination?.total || normalized.length);
      } catch (err) {
        console.error('Failed to load articles:', err);
        setArticles([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage]);

  // Pagination (server-driven)
  const totalPages = Math.max(1, Math.ceil(total / articlesPerPage));
  const currentArticles = articles;

  if (loading) {
    return (
      <div className={`min-h-screen ${'bg-black'}`}>
        <main className="relative z-10 pt-4">
          {/* Title Section */}
          <section className="px-6 py-16 md:py-20">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 md:mb-20">
                <h1
                  className={`text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold tracking-wider uppercase font-sans ${'text-white'}`}
                >
                  Artykuły
                </h1>
                <p
                  className={`mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto font-source leading-relaxed ${'text-white/80'}`}
                >
                  Poznaj najnowsze teksty społeczności StrayLight o rozwoju
                  kariery w erze sztucznej inteligencji. Zdobądź praktyczne
                  wskazówki, trendy technologiczne i inspiracje do działania.
                </p>
              </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="px-6 py-0 mb-20">
            <div className="max-w-7xl mx-auto">
              <ArticlesGridSkeleton resolvedTheme={resolvedTheme || 'light'} />
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${'bg-black'}`}>
      <main className="relative z-10 pt-4">
        {/* Structured Data */}
        {articles.length > 0 && (
          <ArticleListStructuredData articles={articles} />
        )}

        {/* Title Section */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h1
                className={`text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold tracking-wider uppercase font-sans ${'text-white'}`}
              >
                Artykuły
              </h1>
              <p
                className={`mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto font-source leading-relaxed ${'text-white/80'}`}
              >
                Poznaj najnowsze teksty społeczności StrayLight o rozwoju
                kariery w erze sztucznej inteligencji. Zdobądź praktyczne
                wskazówki, trendy technologiczne i inspiracje do działania.
              </p>
            </div>
          </div>
        </section>

        {/* Articles Section */}
        <section className="px-6 py-0 mb-20">
          <div className="max-w-7xl mx-auto">
            {currentArticles.length === 0 ? (
              <div
                className={`backdrop-blur-sm border rounded-2xl p-8 text-center max-w-4xl mx-auto ${'bg-white/5 border-white/10'}`}
              >
                <h3 className={`text-2xl font-black mb-4 ${'text-white'}`}>
                  No articles found
                </h3>
                <p className={false ? 'text-black/70' : 'text-white/70'}>
                  We&apos;re preparing a collection of thoughtful articles about
                  career development in the age of AI. Check back soon for
                  expert insights and practical guidance.
                </p>
              </div>
            ) : (
              <>
                {/* Articles Grid - Using ClientArticleCard with responsive layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8 justify-items-center px-2 xs:px-3 sm:px-4 md:px-4 overflow-visible">
                  {currentArticles.map((article) => (
                    <ClientArticleCard
                      key={article.id}
                      article={article}
                      variant="default"
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${currentPage === page ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Newsletter Signup Section - Only displays on articles pages */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-6">
            <MiniNewsletterSignup />
          </div>
        </section>
      </main>
    </div>
  );
}

// Main wrapper component
export default function ArticlesPageContent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArticlesContent />
    </Suspense>
  );
}
