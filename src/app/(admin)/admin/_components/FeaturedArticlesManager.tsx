'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Article, FeaturedArticle } from '@/lib/supabase';

interface ArticleWithFeatured extends Article {
  users?: {
    handle: string;
    display_name: string | null;
  };
}

export default function FeaturedArticlesManager() {
  const { user } = useAuth();

  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>(
    []
  );
  const [availableArticles, setAvailableArticles] = useState<
    ArticleWithFeatured[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch featured articles
  const fetchFeaturedArticles = async () => {
    try {
      const response = await fetch('/api/featured/articles?limit=6');
      if (!response.ok) throw new Error('Failed to fetch featured articles');
      const data = await response.json();
      setFeaturedArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      setMessage({ type: 'error', text: 'Failed to load featured articles' });
    }
  };

  // Fetch available published articles with pagination
  const fetchAvailableArticles = async (page = 0, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const limit = 100; // Load more articles per batch
      const offset = page * limit;
      const response = await fetch(
        `/api/articles?status=published&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();

      const newArticles = data.data?.articles || data.articles || [];
      const pagination = data.data?.pagination || data.pagination;

      if (append) {
        setAvailableArticles((prev) => [...prev, ...newArticles]);
      } else {
        setAvailableArticles(newArticles);
      }

      // Update pagination state
      setHasMoreArticles(pagination?.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setMessage({ type: 'error', text: 'Failed to load available articles' });
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more articles
  const loadMoreArticles = () => {
    if (!loadingMore && hasMoreArticles) {
      fetchAvailableArticles(currentPage + 1, true);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFeaturedArticles(), fetchAvailableArticles()]);
    };
    loadData();
  }, []);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Update featured article
  const updateFeaturedArticle = async (
    articleId: string,
    isFeatured: boolean,
    order?: number
  ) => {
    try {
      const response = await fetch('/api/featured/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          is_featured: isFeatured,
          featured_order: isFeatured ? order : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update featured status');

      // Refresh data
      await fetchFeaturedArticles();
      setMessage({
        type: 'success',
        text: `Article ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      });
    } catch (error) {
      console.error('Error updating featured article:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update article featured status',
      });
    }
  };

  // Save all featured articles order
  const saveFeaturedOrder = async () => {
    setSaving(true);
    try {
      const articlesToUpdate = featuredArticles.map((article, index) => ({
        id: article.id,
        is_featured: true,
        featured_order: index + 1,
      }));

      const response = await fetch('/api/featured/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: articlesToUpdate }),
      });

      if (!response.ok)
        throw new Error('Failed to save featured articles order');

      setMessage({
        type: 'success',
        text: 'Featured articles order saved successfully',
      });
    } catch (error) {
      console.error('Error saving featured order:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save featured articles order',
      });
    } finally {
      setSaving(false);
    }
  };

  // Move article in featured list
  const moveFeaturedArticle = (fromIndex: number, toIndex: number) => {
    const newFeatured = [...featuredArticles];
    const [moved] = newFeatured.splice(fromIndex, 1);
    newFeatured.splice(toIndex, 0, moved);
    setFeaturedArticles(newFeatured);
  };

  // Filter available articles
  const filteredArticles = availableArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.users?.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-white/60">
          Admin access required to manage featured articles.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-ai-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/60">Loading featured articles manager...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-inter">
            Featured Articles Manager
          </h1>
          <p className="text-white/60 font-source mt-2">
            Manage the featured articles displayed on the home feed
          </p>
        </div>
        {featuredArticles.length > 0 && (
          <button
            onClick={saveFeaturedOrder}
            disabled={saving}
            className="px-6 py-3 bg-ai-teal-500 text-black font-semibold rounded-xl hover:bg-ai-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Current Featured Articles */}
      <div className="card-base border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 font-inter">
          Featured Articles ({featuredArticles.length}/6)
        </h2>

        {featuredArticles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No featured articles selected yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {featuredArticles.map((article, index) => (
              <div
                key={article.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() =>
                      index > 0 && moveFeaturedArticle(index, index - 1)
                    }
                    disabled={index === 0}
                    className="p-1 text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <span className="text-sm font-bold text-ai-teal-400 text-center w-6">
                    {index + 1}
                  </span>
                  <button
                    onClick={() =>
                      index < featuredArticles.length - 1 &&
                      moveFeaturedArticle(index, index + 1)
                    }
                    disabled={index === featuredArticles.length - 1}
                    className="p-1 text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {article.title}
                  </h3>
                  <p className="text-sm text-white/60">
                    by {article.author_display_name || article.author_handle} •{' '}
                    {article.view_count} views
                  </p>
                  <div className="flex gap-2 mt-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => updateFeaturedArticle(article.id, false)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Articles */}
      <div className="card-base border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-inter">
              Available Articles
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Showing {availableArticles.length} articles
              {hasMoreArticles && ' (load more to see all)'}
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-ai-teal-500"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {filteredArticles.map((article) => {
            const isFeatured = featuredArticles.some(
              (fa) => fa.id === article.id
            );
            const canFeature = !isFeatured && featuredArticles.length < 6;

            return (
              <div
                key={article.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  isFeatured
                    ? 'bg-ai-teal-500/10 border-ai-teal-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {article.title}
                  </h3>
                  <p className="text-sm text-white/60">
                    by {article.users?.display_name || article.users?.handle} •{' '}
                    {article.view_count} views
                  </p>
                  <div className="flex gap-2 mt-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() =>
                    updateFeaturedArticle(
                      article.id,
                      !isFeatured,
                      featuredArticles.length + 1
                    )
                  }
                  disabled={!canFeature && !isFeatured}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFeatured
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : canFeature
                        ? 'bg-ai-teal-500/20 text-ai-teal-400 hover:bg-ai-teal-500/30'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {isFeatured
                    ? 'Featured'
                    : canFeature
                      ? 'Feature'
                      : 'Limit Reached'}
                </button>
              </div>
            );
          })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/60">
              No articles found matching your search.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!searchTerm && hasMoreArticles && (
          <div className="flex justify-center mt-6 pt-4 border-t border-white/10">
            <button
              onClick={loadMoreArticles}
              disabled={loadingMore}
              className="px-6 py-3 bg-white/10 text-white hover:bg-white/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Loading more articles...
                </div>
              ) : (
                'Load More Articles'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
