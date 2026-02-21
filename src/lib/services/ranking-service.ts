// ============================================================================
// SEARCH RESULT RANKING ALGORITHM FOR STRAYLIGHT
// ============================================================================
// This service provides sophisticated ranking algorithms for search results,
// considering text relevance, content type priority, publication date,
// user engagement metrics (votes), and other quality signals.
// ============================================================================

import { supabase } from '@/lib/supabase';
import type { SearchResult } from './search-service';

// ============================================================================
// RANKING TYPES AND INTERFACES
// ============================================================================

export interface RankingOptions {
  mode: 'relevance' | 'popularity' | 'recent' | 'combined' | 'quality';
  contentTypeWeights?: ContentTypeWeights;
  recencyWeight?: number;
  popularityWeight?: number;
  qualityWeight?: number;
  personalizedUserId?: string;
  boostFactors?: BoostFactors;
}

export interface ContentTypeWeights {
  articles: number;
  research_papers: number;
  library_items: number;
  default: number;
}

export interface BoostFactors {
  highQualityAuthors?: number;
  recentContent?: number;
  highEngagement?: number;
  verifiedContent?: number;
  premiumContent?: number;
}

export interface RankingSignals {
  textRelevanceScore: number;
  contentTypeScore: number;
  recencyScore: number;
  popularityScore: number;
  qualityScore: number;
  engagementScore: number;
  authorReputationScore: number;
  personalizedScore?: number;
}

export interface EnhancedSearchResult extends SearchResult {
  rankingSignals: RankingSignals;
  finalRankingScore: number;
  rankingFactors: string[];
}

interface VoteData {
  upvotes: number;
  downvotes: number;
  net_votes: number;
  total_votes: number;
}

interface AuthorReputation {
  authorId: string;
  totalArticles: number;
  avgVoteScore: number;
  recentActivity: number;
  badges: string[];
  xp: number;
  reputationScore: number;
}

// ============================================================================
// RANKING CONSTANTS AND CONFIGURATION
// ============================================================================

const DEFAULT_CONTENT_TYPE_WEIGHTS: ContentTypeWeights = {
  articles: 1.0,
  research_papers: 1.2, // Slight boost for academic content
  library_items: 0.9,
  default: 1.0,
};

const DEFAULT_BOOST_FACTORS: BoostFactors = {
  highQualityAuthors: 1.5,
  recentContent: 1.3,
  highEngagement: 1.4,
  verifiedContent: 1.2,
  premiumContent: 1.1,
};

const RANKING_WEIGHTS = {
  TEXT_RELEVANCE: 0.4,
  POPULARITY: 0.25,
  RECENCY: 0.15,
  QUALITY: 0.15,
  AUTHOR_REPUTATION: 0.05,
};

const RECENCY_DECAY_DAYS = 90; // Days after which content starts losing recency score
const _POPULARITY_LOG_BASE = Math.E; // Base for logarithmic popularity scaling

// ============================================================================
// VOTE DATA FETCHING
// ============================================================================

/**
 * Fetches vote counts for articles and library items
 */
async function fetchVoteData(
  results: SearchResult[]
): Promise<Map<string, VoteData>> {
  const voteData = new Map<string, VoteData>();

  // Separate articles and library items
  const articleIds = results
    .filter((r) => r.type === 'article')
    .map((r) => r.id);
  const libraryItemIds = results
    .filter((r) => r.type === 'library_item')
    .map((r) => r.id);

  try {
    const promises: Promise<any>[] = [];

    // Fetch article vote counts
    if (articleIds.length > 0) {
      const articleVotesPromise = supabase
        .from('article_vote_counts')
        .select('article_id, upvotes, downvotes, net_votes, total_votes')
        .in('article_id', articleIds);
      promises.push(Promise.resolve(articleVotesPromise));
    }

    // Fetch library item vote counts
    if (libraryItemIds.length > 0) {
      const libraryVotesPromise = supabase
        .from('library_item_vote_counts')
        .select('library_item_id, upvotes, downvotes, net_votes, total_votes')
        .in('library_item_id', libraryItemIds);
      promises.push(Promise.resolve(libraryVotesPromise));
    }

    const results = await Promise.all(promises);

    // Process article votes
    if (articleIds.length > 0 && results[0]?.data) {
      results[0].data.forEach((vote: any) => {
        voteData.set(vote.article_id, {
          upvotes: vote.upvotes || 0,
          downvotes: vote.downvotes || 0,
          net_votes: vote.net_votes || 0,
          total_votes: vote.total_votes || 0,
        });
      });
    }

    // Process library item votes
    const libraryVoteIndex = articleIds.length > 0 ? 1 : 0;
    if (libraryItemIds.length > 0 && results[libraryVoteIndex]?.data) {
      results[libraryVoteIndex].data.forEach((vote: any) => {
        voteData.set(vote.library_item_id, {
          upvotes: vote.upvotes || 0,
          downvotes: vote.downvotes || 0,
          net_votes: vote.net_votes || 0,
          total_votes: vote.total_votes || 0,
        });
      });
    }
  } catch (error) {
    console.error('Error fetching vote data:', error);
  }

  return voteData;
}

// ============================================================================
// AUTHOR REPUTATION CALCULATION
// ============================================================================

/**
 * Calculates author reputation scores based on their content and engagement
 */
async function calculateAuthorReputations(
  authorIds: string[]
): Promise<Map<string, AuthorReputation>> {
  const reputations = new Map<string, AuthorReputation>();

  if (authorIds.length === 0) return reputations;

  try {
    // Fetch user profiles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, handle, xp, badges, created_at')
      .in('id', authorIds);

    if (usersError) throw usersError;

    // Fetch author article statistics
    const { data: articleStats, error: articleError } = await supabase
      .from('articles')
      .select(
        `
        author_id,
        view_count,
        created_at,
        status
      `
      )
      .in('author_id', authorIds)
      .eq('status', 'published');

    if (articleError) throw articleError;

    // Fetch vote statistics for authors
    const { data: voteStats, error: voteError } = await supabase
      .from('public_article_vote_counts')
      .select('author_id, net_votes, total_votes')
      .in('author_id', authorIds);

    if (voteError) throw voteError;

    // Calculate reputation for each author
    users?.forEach((user) => {
      const userArticles =
        articleStats?.filter((a) => a.author_id === user.id) || [];
      const userVotes = voteStats?.filter((v) => v.author_id === user.id) || [];

      const totalArticles = userArticles.length;
      const totalViews = userArticles.reduce(
        (sum, a) => sum + (a.view_count || 0),
        0
      );
      const totalNetVotes = userVotes.reduce(
        (sum, v) => sum + (v.net_votes || 0),
        0
      );
      const totalVoteCount = userVotes.reduce(
        (sum, v) => sum + (v.total_votes || 0),
        0
      );

      const avgVoteScore =
        totalVoteCount > 0 ? totalNetVotes / totalVoteCount : 0;

      // Calculate recent activity (articles in last 90 days)
      const recentDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const recentActivity = userArticles.filter(
        (a) => new Date(a.created_at) > recentDate
      ).length;

      // Calculate overall reputation score
      const baseScore = user.xp || 0;
      const articleBonus = totalArticles * 10;
      const viewBonus = Math.log(totalViews + 1) * 5;
      const voteBonus = totalNetVotes * 2;
      const activityBonus = recentActivity * 15;
      const badgeBonus = (user.badges || []).length * 20;

      const reputationScore =
        baseScore +
        articleBonus +
        viewBonus +
        voteBonus +
        activityBonus +
        badgeBonus;

      reputations.set(user.id, {
        authorId: user.id,
        totalArticles,
        avgVoteScore,
        recentActivity,
        badges: user.badges || [],
        xp: user.xp || 0,
        reputationScore: Math.max(0, reputationScore),
      });
    });
  } catch (error) {
    console.error('Error calculating author reputations:', error);
  }

  return reputations;
}

// ============================================================================
// RANKING SIGNAL CALCULATIONS
// ============================================================================

/**
 * Calculates text relevance score (normalized from Supabase's internal ranking)
 */
function calculateTextRelevanceScore(result: SearchResult): number {
  // Supabase provides relevance through its textSearch ranking
  // We normalize the existing relevanceScore to a 0-1 range
  return Math.min(1.0, Math.max(0.0, result.relevanceScore));
}

/**
 * Calculates content type priority score
 */
function calculateContentTypeScore(
  result: SearchResult,
  weights: ContentTypeWeights
): number {
  const itemType = result.metadata?.itemType;

  if (result.type === 'article') {
    return weights.articles;
  } else if (result.type === 'library_item') {
    if (itemType === 'paper') {
      return weights.research_papers;
    }
    return weights.library_items;
  }

  return weights.default;
}

/**
 * Calculates recency score based on publication/approval date
 */
function calculateRecencyScore(result: SearchResult): number {
  const now = new Date();
  const contentDate = new Date(
    result.publishedAt || result.approvedAt || result.createdAt
  );

  const daysSincePublication = Math.max(
    0,
    (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Sigmoid decay function: newer content gets higher scores
  const decayFactor = Math.exp(-daysSincePublication / RECENCY_DECAY_DAYS);
  return Math.max(0.1, decayFactor); // Minimum score of 0.1 for very old content
}

/**
 * Calculates popularity score based on views and votes
 */
function calculatePopularityScore(
  result: SearchResult,
  voteData?: VoteData
): number {
  const viewCount = result.viewCount || 0;
  const netVotes = voteData?.net_votes || 0;
  const totalVotes = voteData?.total_votes || 0;

  // Logarithmic scaling for views (diminishing returns)
  const viewScore = Math.log(viewCount + 1) / Math.log(1000); // Normalize to ~1.0 for 1000 views

  // Vote score with quality consideration
  const voteScore =
    totalVotes > 0
      ? (netVotes / totalVotes + 1) / 2 // Normalize to 0-1 range
      : 0.5; // Neutral score for unvoted content

  // Combine view and vote scores
  const combinedScore = viewScore * 0.6 + voteScore * 0.4;

  return Math.min(1.0, Math.max(0.0, combinedScore));
}

/**
 * Calculates quality score based on content characteristics
 */
function calculateQualityScore(
  result: SearchResult,
  voteData?: VoteData
): number {
  let qualityScore = 0.5; // Base quality score

  // Content length quality (prefer substantial content)
  const hasSubstantialContent = (result.description?.length || 0) > 100;
  if (hasSubstantialContent) qualityScore += 0.1;

  // Tag quality (well-categorized content)
  const hasGoodTags = result.tags.length >= 2 && result.tags.length <= 8;
  if (hasGoodTags) qualityScore += 0.1;

  // Vote quality (positive community feedback)
  if (voteData) {
    const voteRatio =
      voteData.total_votes > 0 ? voteData.upvotes / voteData.total_votes : 0.5;

    if (voteRatio > 0.7)
      qualityScore += 0.2; // High approval
    else if (voteRatio < 0.3) qualityScore -= 0.2; // Low approval
  }

  // Metadata quality for library items
  if (result.type === 'library_item') {
    const metadata = result.metadata;
    let metadataScore = 0;

    if (metadata?.author) metadataScore += 0.05;
    if (metadata?.doi) metadataScore += 0.05;
    if (metadata?.journal) metadataScore += 0.05;
    if (metadata?.publicationYear) metadataScore += 0.05;

    qualityScore += metadataScore;
  }

  return Math.min(1.0, Math.max(0.0, qualityScore));
}

/**
 * Calculates engagement score based on user interactions
 */
function calculateEngagementScore(
  result: SearchResult,
  voteData?: VoteData
): number {
  const viewCount = result.viewCount || 0;
  const totalVotes = voteData?.total_votes || 0;

  // Engagement rate: votes per view (with smoothing)
  const engagementRate = viewCount > 0 ? totalVotes / (viewCount + 10) : 0; // Add 10 to prevent division issues

  // Logarithmic scaling for engagement
  const engagementScore = Math.log(engagementRate * 100 + 1) / Math.log(11); // Normalize

  return Math.min(1.0, Math.max(0.0, engagementScore));
}

/**
 * Calculates author reputation score
 */
function calculateAuthorReputationScore(
  result: SearchResult,
  authorReputations: Map<string, AuthorReputation>
): number {
  const authorId = result.author?.id || result.submitter?.id;
  if (!authorId) return 0.5; // Neutral score for unknown authors

  const reputation = authorReputations.get(authorId);
  if (!reputation) return 0.5;

  // Normalize reputation score to 0-1 range
  const maxExpectedReputation = 1000; // Adjust based on your system
  return Math.min(1.0, reputation.reputationScore / maxExpectedReputation);
}

// ============================================================================
// MAIN RANKING FUNCTION
// ============================================================================

/**
 * Applies sophisticated ranking algorithm to search results
 */
export async function rankSearchResults(
  results: SearchResult[],
  options: RankingOptions = { mode: 'combined' }
): Promise<EnhancedSearchResult[]> {
  if (results.length === 0) return [];

  // Set up default options
  const contentTypeWeights =
    options.contentTypeWeights || DEFAULT_CONTENT_TYPE_WEIGHTS;
  const boostFactors = options.boostFactors || DEFAULT_BOOST_FACTORS;

  // Fetch additional data needed for ranking
  const [voteDataMap, authorReputations] = await Promise.all([
    fetchVoteData(results),
    calculateAuthorReputations([
      ...results.map((r) => r.author?.id).filter(Boolean),
      ...results.map((r) => r.submitter?.id).filter(Boolean),
    ] as string[]),
  ]);

  // Calculate ranking signals for each result
  const enhancedResults: EnhancedSearchResult[] = results.map((result) => {
    const voteData = voteDataMap.get(result.id);

    const rankingSignals: RankingSignals = {
      textRelevanceScore: calculateTextRelevanceScore(result),
      contentTypeScore: calculateContentTypeScore(result, contentTypeWeights),
      recencyScore: calculateRecencyScore(result),
      popularityScore: calculatePopularityScore(result, voteData),
      qualityScore: calculateQualityScore(result, voteData),
      engagementScore: calculateEngagementScore(result, voteData),
      authorReputationScore: calculateAuthorReputationScore(
        result,
        authorReputations
      ),
    };

    // Calculate final ranking score based on mode
    let finalRankingScore: number;
    let rankingFactors: string[] = [];

    switch (options.mode) {
      case 'relevance':
        finalRankingScore = rankingSignals.textRelevanceScore;
        rankingFactors = ['text_relevance'];
        break;

      case 'popularity':
        finalRankingScore =
          rankingSignals.popularityScore * 0.6 +
          rankingSignals.engagementScore * 0.4;
        rankingFactors = ['popularity', 'engagement'];
        break;

      case 'recent':
        finalRankingScore =
          rankingSignals.recencyScore * 0.7 +
          rankingSignals.textRelevanceScore * 0.3;
        rankingFactors = ['recency', 'text_relevance'];
        break;

      case 'quality':
        finalRankingScore =
          rankingSignals.qualityScore * 0.4 +
          rankingSignals.authorReputationScore * 0.3 +
          rankingSignals.popularityScore * 0.3;
        rankingFactors = ['quality', 'author_reputation', 'popularity'];
        break;

      case 'combined':
      default:
        finalRankingScore =
          rankingSignals.textRelevanceScore * RANKING_WEIGHTS.TEXT_RELEVANCE +
          rankingSignals.popularityScore * RANKING_WEIGHTS.POPULARITY +
          rankingSignals.recencyScore * RANKING_WEIGHTS.RECENCY +
          rankingSignals.qualityScore * RANKING_WEIGHTS.QUALITY +
          rankingSignals.authorReputationScore *
            RANKING_WEIGHTS.AUTHOR_REPUTATION;
        rankingFactors = [
          'text_relevance',
          'popularity',
          'recency',
          'quality',
          'author_reputation',
        ];
        break;
    }

    // Apply content type weighting
    finalRankingScore *= rankingSignals.contentTypeScore;

    // Apply boost factors
    if (rankingSignals.authorReputationScore > 0.8) {
      finalRankingScore *= boostFactors.highQualityAuthors || 1.0;
      rankingFactors.push('high_quality_author');
    }

    if (rankingSignals.recencyScore > 0.8) {
      finalRankingScore *= boostFactors.recentContent || 1.0;
      rankingFactors.push('recent_content');
    }

    if (rankingSignals.engagementScore > 0.7) {
      finalRankingScore *= boostFactors.highEngagement || 1.0;
      rankingFactors.push('high_engagement');
    }

    return {
      ...result,
      rankingSignals,
      finalRankingScore,
      rankingFactors,
    };
  });

  // Sort by final ranking score
  enhancedResults.sort((a, b) => b.finalRankingScore - a.finalRankingScore);

  return enhancedResults;
}

// ============================================================================
// RANKING UTILITIES
// ============================================================================

/**
 * Gets ranking explanation for a search result
 */
function _getRankingExplanation(result: EnhancedSearchResult): string {
  const signals = result.rankingSignals;
  const factors = result.rankingFactors;

  const explanations: string[] = [];

  if (factors.includes('text_relevance')) {
    explanations.push(
      `Text relevance: ${(signals.textRelevanceScore * 100).toFixed(0)}%`
    );
  }

  if (factors.includes('popularity')) {
    explanations.push(
      `Popularity: ${(signals.popularityScore * 100).toFixed(0)}%`
    );
  }

  if (factors.includes('recency')) {
    explanations.push(`Recency: ${(signals.recencyScore * 100).toFixed(0)}%`);
  }

  if (factors.includes('quality')) {
    explanations.push(`Quality: ${(signals.qualityScore * 100).toFixed(0)}%`);
  }

  if (factors.includes('high_quality_author')) {
    explanations.push('High-quality author boost');
  }

  if (factors.includes('recent_content')) {
    explanations.push('Recent content boost');
  }

  if (factors.includes('high_engagement')) {
    explanations.push('High engagement boost');
  }

  return explanations.join(', ');
}

/**
 * Analyzes ranking performance and suggests improvements
 */
function _analyzeRankingPerformance(results: EnhancedSearchResult[]): {
  avgRelevanceScore: number;
  topContentTypes: string[];
  rankingDistribution: Record<string, number>;
  suggestions: string[];
} {
  if (results.length === 0) {
    return {
      avgRelevanceScore: 0,
      topContentTypes: [],
      rankingDistribution: {},
      suggestions: ['No results to analyze'],
    };
  }

  const avgRelevanceScore =
    results.reduce((sum, r) => sum + r.rankingSignals.textRelevanceScore, 0) /
    results.length;

  const contentTypeCounts = results.reduce(
    (acc, r) => {
      const type =
        r.type === 'library_item' && r.metadata?.itemType === 'paper'
          ? 'research_papers'
          : r.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topContentTypes = Object.entries(contentTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type);

  const rankingDistribution = results.reduce(
    (acc, r) => {
      r.rankingFactors.forEach((factor) => {
        acc[factor] = (acc[factor] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const suggestions: string[] = [];

  if (avgRelevanceScore < 0.3) {
    suggestions.push(
      'Consider improving search query processing or index quality'
    );
  }

  if (results.length > 0 && results[0].rankingSignals.recencyScore < 0.5) {
    suggestions.push('Consider boosting recent content more aggressively');
  }

  return {
    avgRelevanceScore,
    topContentTypes,
    rankingDistribution,
    suggestions,
  };
}
