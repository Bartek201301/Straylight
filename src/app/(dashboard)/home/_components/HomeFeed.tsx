'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeaturedArticleCard from './FeaturedArticleCard';
import FeaturedArticlesCarousel from './FeaturedArticlesCarousel';
import FeaturedToolCard from './FeaturedToolCard';
import FeaturedToolsCarousel from './FeaturedToolsCarousel';
import EnhancedArticleCard from './EnhancedArticleCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  FeaturedArticle,
  FeaturedTool,
  PopularArticle,
  ArticleWithAuthor,
} from '@/lib/supabase';

interface HomeFeedProps {
  className?: string;
}

export default function HomeFeed({ className }: HomeFeedProps) {
  const { user } = useAuth();

  // State for different content sections
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>(
    []
  );
  const [featuredTools, setFeaturedTools] = useState<FeaturedTool[]>([]);
  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);
  const [newestArticles, setNewestArticles] = useState<ArticleWithAuthor[]>([]);

  // Loading states
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTools, setLoadingTools] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingNewest, setLoadingNewest] = useState(true);

  // Error states
  const [errors, setErrors] = useState<{
    featured?: string;
    tools?: string;
    popular?: string;
    newest?: string;
  }>({});

  // Fetch featured articles
  const fetchFeaturedArticles = async () => {
    try {
      const response = await fetch('/api/featured/articles?limit=6');
      if (!response.ok) throw new Error('Failed to fetch featured articles');

      const data = await response.json();
      setFeaturedArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      setErrors((prev) => ({
        ...prev,
        featured: 'Failed to load featured articles',
      }));
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Fetch featured tools
  const fetchFeaturedTools = async () => {
    try {
      const response = await fetch('/api/featured/tools?limit=6');
      if (!response.ok) throw new Error('Failed to fetch featured tools');

      const data = await response.json();
      setFeaturedTools(data.tools || []);
    } catch (error) {
      console.error('Error fetching featured tools:', error);
      setErrors((prev) => ({
        ...prev,
        tools: 'Failed to load featured tools',
      }));
    } finally {
      setLoadingTools(false);
    }
  };

  // Fetch popular articles for leaderboard
  const fetchPopularArticles = async () => {
    try {
      const response = await fetch('/api/articles/popular?limit=6');
      if (!response.ok) throw new Error('Failed to fetch popular articles');

      const data = await response.json();
      setPopularArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching popular articles:', error);
      setErrors((prev) => ({
        ...prev,
        popular: 'Failed to load popular articles',
      }));
    } finally {
      setLoadingPopular(false);
    }
  };

  // Fetch newest articles
  const fetchNewestArticles = async () => {
    try {
      const response = await fetch('/api/articles/newest?limit=5');
      if (!response.ok) throw new Error('Failed to fetch newest articles');

      const data = await response.json();
      setNewestArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching newest articles:', error);
      setErrors((prev) => ({
        ...prev,
        newest: 'Failed to load newest articles',
      }));
    } finally {
      setLoadingNewest(false);
    }
  };

  // Load all content on mount
  useEffect(() => {
    fetchFeaturedArticles();
    fetchFeaturedTools();
    fetchPopularArticles();
    fetchNewestArticles();
  }, []);

  // Featured Articles Skeleton
  const FeaturedArticlesSkeleton = () => (
    <Skeleton className="h-[320px] md:h-[380px] rounded-xl" />
  );

  // Featured Tools Skeleton
  const FeaturedToolsSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-[240px] rounded-xl" />
      ))}
    </div>
  );

  const FeaturedToolsCarouselSkeleton = () => (
    <Skeleton className="h-[260px] rounded-xl" />
  );

  // Popular Articles Skeleton
  const PopularArticlesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[160px] md:h-[180px] rounded-lg" />
        ))}
      </div>
      <div className="space-y-4">
        {[4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[160px] md:h-[180px] rounded-lg" />
        ))}
      </div>
    </div>
  );

  // Newest Articles Skeleton
  const NewestArticlesSkeleton = () => (
    <div className="space-y-6">
      {/* Large article */}
      <Skeleton className="h-[280px] md:h-[320px] rounded-xl" />
      {/* Small articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[160px] md:h-[180px] rounded-lg" />
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      <main className="pt-20 px-4 sm:px-6 pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Personalized Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-inter">
              Witamy, {user?.profile?.display_name || user?.handle || 'user'}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-source">
              Twój spersonalizowany feed wskazówek kariery napędzany przez AI.
              Bądź na bieżąco z najnowszymi spostrzeżeniami, artykułami i
              możliwościami.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content Area - Takes 3/4 width */}
            <div className="lg:col-span-3 space-y-12">
              {/* Featured Articles Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold font-inter">
                    Polecane Artykuły
                  </h2>
                  {featuredArticles.length > 0 && (
                    <span className="hidden sm:inline text-sm text-white/60 font-source">
                      Wybrane przez nasz zespół
                    </span>
                  )}
                </div>

                {loadingFeatured ? (
                  <FeaturedArticlesSkeleton />
                ) : errors.featured ? (
                  <div className="card-base border border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center">
                    <div className="text-red-400 mb-2">⚠️</div>
                    <p className="text-red-300">{errors.featured}</p>
                    <button
                      onClick={fetchFeaturedArticles}
                      className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : featuredArticles.length === 0 ? (
                  <div className="card-base border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/60">
                      No featured articles available yet.
                    </p>
                  </div>
                ) : (
                  <FeaturedArticlesCarousel articles={featuredArticles} />
                )}
              </section>

              {/* Featured Tools Section (mobile) */}
              <section className="lg:hidden">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold font-inter">
                    Najlepsze Narzędzia AI
                  </h2>
                </div>

                {loadingTools ? (
                  <FeaturedToolsCarouselSkeleton />
                ) : errors.tools ? (
                  <div className="card-base border border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center">
                    <div className="text-red-400 mb-2">⚠️</div>
                    <p className="text-red-300">{errors.tools}</p>
                    <button
                      onClick={fetchFeaturedTools}
                      className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
                    >
                      Spróbuj Ponownie
                    </button>
                  </div>
                ) : featuredTools.length === 0 ? (
                  <div className="card-base border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/60">
                      Brak polecanych narzędzi do wyświetlenia.
                    </p>
                  </div>
                ) : (
                  <FeaturedToolsCarousel tools={featuredTools} />
                )}
              </section>

              {/* Popular Articles Leaderboard */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold font-inter">
                    Najpopularniejsze
                  </h2>
                  <span className="hidden sm:inline text-sm text-white/60 font-source">
                    Na podstawie polubień społeczności
                  </span>
                </div>

                {loadingPopular ? (
                  <PopularArticlesSkeleton />
                ) : errors.popular ? (
                  <div className="card-base border border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center">
                    <div className="text-red-400 mb-2">⚠️</div>
                    <p className="text-red-300">{errors.popular}</p>
                    <button
                      onClick={fetchPopularArticles}
                      className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : popularArticles.length === 0 ? (
                  <div className="card-base border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/60">
                      No popular articles available yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popularArticles.map((article, index) => (
                      <EnhancedArticleCard
                        key={article.id}
                        article={article}
                        rank={article.rank_position ?? index + 1}
                        variant="leaderboard"
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Newest Articles Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold font-inter">
                    Najnowsze Artykuły
                  </h2>
                  <span className="hidden sm:inline text-sm text-white/60 font-source">
                    Prosto z pieca
                  </span>
                </div>

                {loadingNewest ? (
                  <NewestArticlesSkeleton />
                ) : errors.newest ? (
                  <div className="card-base border border-red-500/20 bg-red-500/5 rounded-xl p-8 text-center">
                    <div className="text-red-400 mb-2">⚠️</div>
                    <p className="text-red-300">{errors.newest}</p>
                    <button
                      onClick={fetchNewestArticles}
                      className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : newestArticles.length === 0 ? (
                  <div className="card-base border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-white/60">
                      No recent articles available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* First article as large featured */}
                    {newestArticles[0] && (
                      <FeaturedArticleCard
                        key={newestArticles[0].id}
                        article={{
                          ...newestArticles[0],
                          excerpt: newestArticles[0].excerpt || '', // Handle null excerpt
                          published_at:
                            newestArticles[0].published_at ||
                            newestArticles[0].created_at, // Handle null published_at
                          author_handle: newestArticles[0].users?.handle || '',
                          author_display_name:
                            newestArticles[0].users?.display_name || null,
                          author_avatar_url:
                            newestArticles[0].users?.avatar_url || null,
                          featured_order: 1,
                        }}
                        variant="large"
                      />
                    )}
                    {/* Remaining articles as enhanced cards */}
                    {newestArticles.length > 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newestArticles.slice(1, 5).map((article) => (
                          <EnhancedArticleCard
                            key={article.id}
                            article={article}
                            variant="compact"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar - Takes 1/4 width */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-8 space-y-8">
                {/* Featured AI Tools Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold font-inter">
                      Najlepsze Narzędzia AI
                    </h3>
                    <span className="hidden sm:inline text-xs text-white/60 font-source">
                      Wybrane
                    </span>
                  </div>

                  {loadingTools ? (
                    <FeaturedToolsSkeleton />
                  ) : errors.tools ? (
                    <div className="card-base border border-red-500/20 bg-red-500/5 rounded-xl p-6 text-center">
                      <div className="text-red-400 mb-2 text-sm">⚠️</div>
                      <p className="text-red-300 text-sm">{errors.tools}</p>
                      <button
                        onClick={fetchFeaturedTools}
                        className="mt-3 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors text-sm"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : featuredTools.length === 0 ? (
                    <div className="card-base border border-white/10 rounded-xl p-6 text-center">
                      <p className="text-white/60 text-sm">
                        No featured tools available yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {featuredTools.map((tool) => (
                        <FeaturedToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
