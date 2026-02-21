import { supabase } from '@/lib/supabase';

/**
 * Client-side service for article voting operations
 */

interface VoteResponse {
  success: boolean;
  action: 'liked' | 'unliked';
  error?: string;
}

interface UserVoteStatus {
  hasLiked: boolean;
  voteType: 'like' | null; // Simplified to only 'like' or null
}

interface VoteCounts {
  likes: number; // Primary count for the new system
  upvotes: number; // Kept for backward compatibility (same as likes)
  downvotes: number; // Always 0 in new system
  net_votes: number; // Same as likes in new system
  total_votes: number; // Total vote count
}

// Helper function to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

class VoteService {
  /**
   * Like an article
   */
  async likeArticle(articleId: string): Promise<VoteResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/articles/${articleId}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'like' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to like article');
      }

      return data;
    } catch (error) {
      console.error('Error liking article:', error);
      return {
        success: false,
        action: 'liked',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Unlike an article
   */
  async unlikeArticle(articleId: string): Promise<VoteResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/articles/${articleId}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'unlike' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlike article');
      }

      return data;
    } catch (error) {
      console.error('Error unliking article:', error);
      return {
        success: false,
        action: 'unliked',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's vote status on an article
   */
  async getUserVoteStatus(articleId: string): Promise<UserVoteStatus | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/articles/${articleId}/vote`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (response.status === 401) {
        // User not authenticated
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user vote status');
      }

      return data;
    } catch (error) {
      console.error('Error getting user vote status:', error);
      return null;
    }
  }

  /**
   * Get vote counts for an article
   */
  async getVoteCounts(articleId: string): Promise<VoteCounts | null> {
    try {
      const response = await fetch(`/api/articles/${articleId}/vote-counts`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'cache-control': 'no-store',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get vote counts');
      }

      return data;
    } catch (error) {
      console.error('Error getting vote counts:', error);
      return null;
    }
  }

  /**
   * Toggle like status (like if not liked, unlike if liked)
   */
  async toggleLike(
    articleId: string,
    currentlyLiked: boolean
  ): Promise<VoteResponse> {
    if (currentlyLiked) {
      return this.unlikeArticle(articleId);
    } else {
      return this.likeArticle(articleId);
    }
  }
}

export const voteService = new VoteService();
