// ============================================================================
// SEARCH AUTOCOMPLETE API ENDPOINT
// ============================================================================
// Provides fast autocomplete functionality for search fields including
// tags, authors, titles, journals, and other searchable attributes.
// ============================================================================

import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
} from '@/lib/errors/api-errors';
import { validateAutocompleteQuery } from '@/lib/validation/search';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const { field, q, limit } = validateAutocompleteQuery(searchParams);

    let completions: Array<{
      value: string;
      label: string;
      frequency?: number;
      metadata?: any;
    }> = [];

    switch (field) {
      case 'tags':
        completions = await getTagCompletions(q, limit);
        break;
      case 'authors':
        completions = await getAuthorCompletions(q, limit);
        break;
      case 'titles':
        completions = await getTitleCompletions(q, limit);
        break;
      case 'journals':
        completions = await getJournalCompletions(q, limit);
        break;
      default:
        throw new Error(`Unsupported autocomplete field: ${field}`);
    }

    return createSuccessResponse(
      {
        completions,
        field,
        query: q,
        count: completions.length,
      },
      'Autocomplete results retrieved',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// ============================================================================
// AUTOCOMPLETE HELPERS
// ============================================================================

/**
 * Gets tag autocomplete suggestions with frequency data
 */
async function getTagCompletions(query: string, limit: number) {
  const tagCounts = new Map<string, number>();

  try {
    // Get tags from articles
    const { data: articles } = await supabase
      .from('articles')
      .select('tags')
      .eq('status', 'published');

    // Get tags from library items
    const { data: libraryItems } = await supabase
      .from('library_items')
      .select('tags')
      .eq('submission_status', 'approved');

    // Count tag occurrences
    [...(articles || []), ...(libraryItems || [])].forEach((item) => {
      item.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });

    // Convert to completions array sorted by frequency
    return Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({
        value: tag,
        label: tag,
        frequency: count,
        metadata: {
          type: 'tag',
          usage: count > 10 ? 'popular' : count > 3 ? 'common' : 'rare',
        },
      }));
  } catch (error) {
    console.error('Error getting tag completions:', error);
    return [];
  }
}

/**
 * Gets author autocomplete suggestions
 */
async function getAuthorCompletions(query: string, limit: number) {
  try {
    // Get user profiles that match the query
    const { data: users } = await supabase
      .from('users')
      .select('id, handle, xp')
      .ilike('handle', `%${query}%`)
      .order('xp', { ascending: false })
      .limit(limit);

    if (!users) return [];

    // Get article counts for each author
    const authorIds = users.map((u) => u.id);
    const { data: articleCounts } = await supabase
      .from('articles')
      .select('author_id')
      .in('author_id', authorIds)
      .eq('status', 'published');

    // Count articles per author
    const countsByAuthor = new Map<string, number>();
    articleCounts?.forEach((article) => {
      const count = countsByAuthor.get(article.author_id) || 0;
      countsByAuthor.set(article.author_id, count + 1);
    });

    return users.map((user) => ({
      value: user.handle,
      label: user.handle,
      frequency: countsByAuthor.get(user.id) || 0,
      metadata: {
        type: 'author',
        userId: user.id,
        handle: user.handle,
        xp: user.xp,
        articleCount: countsByAuthor.get(user.id) || 0,
      },
    }));
  } catch (error) {
    console.error('Error getting author completions:', error);
    return [];
  }
}

/**
 * Gets title autocomplete suggestions
 */
async function getTitleCompletions(query: string, limit: number) {
  const titleCompletions: Array<{
    value: string;
    label: string;
    frequency?: number;
    metadata?: any;
  }> = [];

  try {
    // Get matching article titles
    const { data: articles } = await supabase
      .from('articles')
      .select('title, view_count, published_at')
      .ilike('title', `%${query}%`)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(Math.ceil(limit / 2));

    articles?.forEach((article) => {
      titleCompletions.push({
        value: article.title,
        label: article.title,
        frequency: article.view_count,
        metadata: {
          type: 'article_title',
          viewCount: article.view_count,
          publishedAt: article.published_at,
        },
      });
    });

    // Get matching library item titles
    const { data: libraryItems } = await supabase
      .from('library_items')
      .select('title, view_count, item_type, approved_at')
      .ilike('title', `%${query}%`)
      .eq('submission_status', 'approved')
      .order('view_count', { ascending: false })
      .limit(Math.ceil(limit / 2));

    libraryItems?.forEach((item) => {
      titleCompletions.push({
        value: item.title,
        label: item.title,
        frequency: item.view_count,
        metadata: {
          type: 'library_item_title',
          itemType: item.item_type,
          viewCount: item.view_count,
          approvedAt: item.approved_at,
        },
      });
    });

    // Sort by frequency and return top results
    return titleCompletions
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting title completions:', error);
    return [];
  }
}

/**
 * Gets journal autocomplete suggestions
 */
async function getJournalCompletions(query: string, limit: number) {
  try {
    // Get journals from library items with their frequency
    const { data: libraryItems } = await supabase
      .from('library_items')
      .select('journal')
      .ilike('journal', `%${query}%`)
      .eq('submission_status', 'approved')
      .not('journal', 'is', null);

    if (!libraryItems) return [];

    // Count journal occurrences
    const journalCounts = new Map<string, number>();
    libraryItems.forEach((item) => {
      if (item.journal) {
        journalCounts.set(
          item.journal,
          (journalCounts.get(item.journal) || 0) + 1
        );
      }
    });

    // Convert to completions array
    return Array.from(journalCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([journal, count]) => ({
        value: journal,
        label: journal,
        frequency: count,
        metadata: {
          type: 'journal',
          paperCount: count,
          popularity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
        },
      }));
  } catch (error) {
    console.error('Error getting journal completions:', error);
    return [];
  }
}
