'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import type { AffiliateLibraryItem, FeaturedTool } from '@/lib/supabase';

export default function FeaturedToolsManager() {
  const { user } = useAuth();

  const [featuredTools, setFeaturedTools] = useState<FeaturedTool[]>([]);
  const [availableTools, setAvailableTools] = useState<AffiliateLibraryItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreTools, setHasMoreTools] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'book' | 'tool'>('all');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch featured tools
  const fetchFeaturedTools = async () => {
    try {
      const response = await fetch('/api/featured/tools?limit=6');
      if (!response.ok) throw new Error('Failed to fetch featured tools');
      const data = await response.json();
      setFeaturedTools(data.tools || []);
    } catch (error) {
      console.error('Error fetching featured tools:', error);
      setMessage({ type: 'error', text: 'Failed to load featured tools' });
    }
  };

  // Fetch available tools/books with pagination
  const fetchAvailableTools = async (page = 0, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const limit = 50; // Load tools per batch
      const offset = page * limit;
      const response = await fetch(
        `/api/affiliate-library?limit=${limit}&offset=${offset}&is_active=true`
      );
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();

      const newTools = data.data?.items || data.items || [];
      const pagination = data.data?.pagination || data.pagination;

      if (append) {
        setAvailableTools((prev) => [...prev, ...newTools]);
      } else {
        setAvailableTools(newTools);
      }

      // Update pagination state
      setHasMoreTools(pagination?.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setMessage({ type: 'error', text: 'Failed to load available tools' });
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Load more tools
  const loadMoreTools = () => {
    if (!loadingMore && hasMoreTools) {
      fetchAvailableTools(currentPage + 1, true);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchFeaturedTools(), fetchAvailableTools()]);
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

  // Update featured tool
  const updateFeaturedTool = async (
    toolId: string,
    isFeatured: boolean,
    order?: number
  ) => {
    try {
      const response = await fetch('/api/featured/tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: toolId,
          is_featured: isFeatured,
          featured_order: isFeatured ? order : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update featured status');

      // Refresh data
      await fetchFeaturedTools();
      setMessage({
        type: 'success',
        text: `Tool ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      });
    } catch (error) {
      console.error('Error updating featured tool:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update tool featured status',
      });
    }
  };

  // Save all featured tools order
  const saveFeaturedOrder = async () => {
    setSaving(true);
    try {
      const toolsToUpdate = featuredTools.map((tool, index) => ({
        id: tool.id,
        is_featured: true,
        featured_order: index + 1,
      }));

      const response = await fetch('/api/featured/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: toolsToUpdate }),
      });

      if (!response.ok) throw new Error('Failed to save featured tools order');

      setMessage({
        type: 'success',
        text: 'Featured tools order saved successfully',
      });
    } catch (error) {
      console.error('Error saving featured order:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save featured tools order',
      });
    } finally {
      setSaving(false);
    }
  };

  // Move tool in featured list
  const moveFeaturedTool = (fromIndex: number, toIndex: number) => {
    const newFeatured = [...featuredTools];
    const [moved] = newFeatured.splice(fromIndex, 1);
    newFeatured.splice(toIndex, 0, moved);
    setFeaturedTools(newFeatured);
  };

  // Get tool icon
  const getToolIcon = (type: string) => (type === 'book' ? '📚' : '🔧');

  // Get tool type label
  const getToolTypeLabel = (type: string) =>
    type === 'book' ? 'Book' : 'AI Tool';

  // Get price range label
  const getPriceRangeLabel = (priceRange: string | null) => {
    if (!priceRange) return null;
    const priceLabels = {
      free: 'Free',
      'under-50': '<$50',
      '50-100': '$50-$100',
      '100-200': '$100-$200',
      'over-200': '>$200',
    };
    return priceLabels[priceRange as keyof typeof priceLabels];
  };

  // Filter available tools
  const filteredTools = availableTools.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesType = filterType === 'all' || tool.type === filterType;
    const isActive = tool.is_active;

    return matchesSearch && matchesType && isActive;
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-white/60">
          Admin access required to manage featured tools.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-ai-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white/60">Loading featured tools manager...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-inter">
            Featured Tools Manager
          </h1>
          <p className="text-white/60 font-source mt-2">
            Manage the featured AI tools and books displayed on the home feed
          </p>
        </div>
        {featuredTools.length > 0 && (
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

      {/* Current Featured Tools */}
      <div className="card-base border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 font-inter">
          Featured Tools ({featuredTools.length}/6)
        </h2>

        {featuredTools.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No featured tools selected yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {featuredTools.map((tool, index) => (
              <div
                key={tool.id}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
              >
                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() =>
                      index > 0 && moveFeaturedTool(index, index - 1)
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
                      index < featuredTools.length - 1 &&
                      moveFeaturedTool(index, index + 1)
                    }
                    disabled={index === featuredTools.length - 1}
                    className="p-1 text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                </div>

                {/* Tool Image */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {tool.image_url ? (
                    <Image
                      src={tool.image_url}
                      alt={tool.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-lg">{getToolIcon(tool.type)}</span>
                    </div>
                  )}
                </div>

                {/* Tool Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {tool.title}
                    </h3>
                    <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded flex-shrink-0">
                      {getToolTypeLabel(tool.type)}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">
                    {tool.author && `by ${tool.author} • `}
                    {tool.click_count} clicks
                    {tool.rating && ` • ⭐ ${tool.rating.toFixed(1)}`}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {tool.price_range && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        {getPriceRangeLabel(tool.price_range)}
                      </span>
                    )}
                    {tool.tags.slice(0, 2).map((tag) => (
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
                  onClick={() => updateFeaturedTool(tool.id, false)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Tools */}
      <div className="card-base border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-inter">
              Available Tools & Books
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Showing {availableTools.length} items
              {hasMoreTools && ' (load more to see all)'}
            </p>
          </div>
          <div className="flex gap-4">
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as 'all' | 'book' | 'tool')
              }
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-ai-teal-500"
            >
              <option value="all">All Types</option>
              <option value="tool">AI Tools</option>
              <option value="book">Books</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tools..."
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
        </div>

        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {filteredTools.map((tool) => {
            const isFeatured = featuredTools.some((ft) => ft.id === tool.id);
            const canFeature = !isFeatured && featuredTools.length < 6;

            return (
              <div
                key={tool.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  isFeatured
                    ? 'bg-ai-teal-500/10 border-ai-teal-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Tool Image */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {tool.image_url ? (
                    <Image
                      src={tool.image_url}
                      alt={tool.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <span className="text-lg">{getToolIcon(tool.type)}</span>
                    </div>
                  )}
                </div>

                {/* Tool Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {tool.title}
                    </h3>
                    <span className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded flex-shrink-0">
                      {getToolTypeLabel(tool.type)}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">
                    {tool.author && `by ${tool.author} • `}
                    {tool.click_count} clicks
                    {tool.rating && ` • ⭐ ${tool.rating.toFixed(1)}`}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {tool.price_range && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                        {getPriceRangeLabel(tool.price_range)}
                      </span>
                    )}
                    {tool.tags.slice(0, 2).map((tag) => (
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
                    updateFeaturedTool(
                      tool.id,
                      !isFeatured,
                      featuredTools.length + 1
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

        {filteredTools.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/60">
              No tools found matching your criteria.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!searchTerm && filterType === 'all' && hasMoreTools && (
          <div className="flex justify-center mt-6 pt-4 border-t border-white/10">
            <button
              onClick={loadMoreTools}
              disabled={loadingMore}
              className="px-6 py-3 bg-white/10 text-white hover:bg-white/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Loading more tools...
                </div>
              ) : (
                'Load More Tools'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
