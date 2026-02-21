// ============================================================================
// SEARCH SUGGESTIONS API ENDPOINT
// ============================================================================
// Provides intelligent search suggestions based on popular queries,
// content analysis, and user behavior patterns.
// ============================================================================

import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
} from '@/lib/errors/api-errors';
import { validateSuggestionsQuery } from '@/lib/validation/search';
import { getPopularSearchQueries } from '@/lib/services/search-service';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const { q, limit, types } = validateSuggestionsQuery(searchParams);

    // Get suggestions from multiple sources
    const [popularQueries, contentSuggestions, tagSuggestions] =
      await Promise.all([
        getPopularSearchQueries(Math.ceil(limit / 3)),
        getContentBasedSuggestions(q, Math.ceil(limit / 3), types),
        getTagBasedSuggestions(q, Math.ceil(limit / 3), types),
      ]);

    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...popularQueries.map((pq) => ({
        query: pq.query,
        type: 'popular' as const,
        score: pq.count / 100, // Normalize popularity score
        metadata: {
          frequency: pq.count,
          avgResponseTime: pq.avgResponseTime,
        },
      })),
      ...contentSuggestions,
      ...tagSuggestions,
    ];

    // Remove duplicates and sort by score
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map((s) => [s.query.toLowerCase(), s])).values()
    )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return createSuccessResponse(
      {
        suggestions: uniqueSuggestions,
        query: q,
        count: uniqueSuggestions.length,
        sources: ['popular_queries', 'content_analysis', 'tag_analysis'],
      },
      'Search suggestions retrieved',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// ============================================================================
// SUGGESTION GENERATION HELPERS
// ============================================================================

/**
 * Generates suggestions based on content titles and descriptions
 */
async function getContentBasedSuggestions(
  query: string,
  limit: number,
  types: string[]
): Promise<
  Array<{ query: string; type: 'content'; score: number; metadata: any }>
> {
  const suggestions: Array<{
    query: string;
    type: 'content';
    score: number;
    metadata: any;
  }> = [];

  try {
    const searchTypes = types || ['articles', 'library_items'];

    // Search articles if requested
    if (searchTypes.includes('articles')) {
      const { data: articles } = await supabase
        .from('articles')
        .select('title, tags')
        .textSearch('title', query)
        .eq('status', 'published')
        .limit(limit);

      articles?.forEach((article) => {
        // Extract meaningful phrases from titles
        const titleWords = article.title.toLowerCase().split(/\s+/);
        const queryWords = query.toLowerCase().split(/\s+/);

        // Find title phrases that extend the current query
        titleWords.forEach((word: string, index: number) => {
          if (
            word.includes(query.toLowerCase()) ||
            queryWords.some((qw) => word.includes(qw))
          ) {
            // Suggest the title or a meaningful phrase
            const suggestionPhrase = titleWords
              .slice(Math.max(0, index - 1), index + 3)
              .join(' ');
            if (suggestionPhrase.length > query.length) {
              suggestions.push({
                query: suggestionPhrase,
                type: 'content',
                score: 0.7,
                metadata: {
                  source: 'article_title',
                  originalTitle: article.title,
                },
              });
            }
          }
        });
      });
    }

    // Search library items if requested
    if (
      searchTypes.includes('library_items') ||
      searchTypes.includes('research_papers')
    ) {
      const itemTypeFilter = searchTypes.includes('research_papers')
        ? ['paper']
        : undefined;

      let libraryQuery = supabase
        .from('library_items')
        .select('title, author, journal, tags')
        .textSearch('title', query)
        .eq('submission_status', 'approved')
        .limit(limit);

      if (itemTypeFilter) {
        libraryQuery = libraryQuery.in('item_type', itemTypeFilter);
      }

      const { data: libraryItems } = await libraryQuery;

      libraryItems?.forEach((item: any) => {
        // Suggest based on titles, authors, and journals
        [item.title, item.author, item.journal].forEach((field) => {
          if (field && field.toLowerCase().includes(query.toLowerCase())) {
            const words = field.split(/\s+/);
            const meaningfulPhrase = words.slice(0, 4).join(' ');

            suggestions.push({
              query: meaningfulPhrase,
              type: 'content',
              score: 0.6,
              metadata: {
                source: 'library_item',
                itemType: item.item_type,
                author: item.author,
                journal: item.journal,
              },
            });
          }
        });
      });
    }
  } catch (error) {
    console.error('Error generating content-based suggestions:', error);
  }

  return suggestions.slice(0, limit);
}

/**
 * Generates suggestions based on popular tags and categories
 */
async function getTagBasedSuggestions(
  query: string,
  limit: number,
  types: string[]
): Promise<
  Array<{ query: string; type: 'tag'; score: number; metadata: any }>
> {
  const suggestions: Array<{
    query: string;
    type: 'tag';
    score: number;
    metadata: any;
  }> = [];

  try {
    const searchTypes = types || ['articles', 'library_items'];

    // Collect tags from both content types
    const tagPromises: Promise<any>[] = [];

    if (searchTypes.includes('articles')) {
      tagPromises.push(
        Promise.resolve(
          supabase.from('articles').select('tags').eq('status', 'published')
        )
      );
    }

    if (
      searchTypes.includes('library_items') ||
      searchTypes.includes('research_papers')
    ) {
      tagPromises.push(
        Promise.resolve(
          supabase
            .from('library_items')
            .select('tags')
            .eq('submission_status', 'approved')
        )
      );
    }

    const tagResults = await Promise.all(tagPromises);

    // Count tag frequency and filter by query
    const tagCounts = new Map<string, number>();

    tagResults.forEach((result) => {
      result.data?.forEach((item: any) => {
        item.tags?.forEach((tag: string) => {
          const lowerTag = tag.toLowerCase();
          const lowerQuery = query.toLowerCase();

          // Include tags that contain the query or have query words
          if (
            lowerTag.includes(lowerQuery) ||
            query.split(/\s+/).some((qw) => lowerTag.includes(qw.toLowerCase()))
          ) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      });
    });

    // Convert to suggestions with scores based on frequency
    const maxCount = Math.max(...Array.from(tagCounts.values()));

    Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .forEach(([tag, count]) => {
        suggestions.push({
          query: tag,
          type: 'tag',
          score: 0.5 + (count / maxCount) * 0.3, // Base score + frequency bonus
          metadata: {
            frequency: count,
            source: 'tag_analysis',
          },
        });
      });
  } catch (error) {
    console.error('Error generating tag-based suggestions:', error);
  }

  return suggestions.slice(0, limit);
}
