import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  ValidationError,
} from '@/lib/errors/api-errors';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();
    const { content, title, existingTags = [] } = body;

    if (!content && !title) {
      throw new ValidationError('Either content or title must be provided');
    }

    // Combine title and content for analysis
    const textToAnalyze = `${title || ''} ${content || ''}`.toLowerCase();

    // Extract potential tags using multiple strategies
    const suggestions = new Set<string>();

    // Strategy 1: Extract common technology keywords
    const techKeywords = extractTechKeywords(textToAnalyze);
    techKeywords.forEach((keyword) => suggestions.add(keyword));

    // Strategy 2: Extract from existing popular tags that match content
    const { data: articles } = await getSupabaseAdmin()
      .from('articles')
      .select('tags')
      .eq('status', 'published')
      .limit(100);

    if (articles) {
      const popularTags = extractPopularTags(articles);
      const matchingTags = findMatchingTags(textToAnalyze, popularTags);
      matchingTags.forEach((tag) => suggestions.add(tag));
    }

    // Strategy 3: Generate tags from content structure
    const structuralTags = extractStructuralTags(textToAnalyze);
    structuralTags.forEach((tag) => suggestions.add(tag));

    // Strategy 4: Extract topic-based tags
    const topicTags = extractTopicTags(textToAnalyze);
    topicTags.forEach((tag) => suggestions.add(tag));

    // Filter out existing tags and invalid suggestions
    const filteredSuggestions = Array.from(suggestions)
      .filter(
        (tag) =>
          tag.length >= 2 &&
          tag.length <= 50 &&
          /^[a-z0-9_-]+$/.test(tag) &&
          !existingTags.map((t: string) => t.toLowerCase()).includes(tag)
      )
      .slice(0, 10) // Limit to 10 suggestions
      .map((tag) => ({
        name: tag,
        category: detectTagCategory(tag),
        confidence: calculateConfidence(tag, textToAnalyze),
        reason: getTagReason(tag, textToAnalyze, title || ''),
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const responseData = {
      suggestions: filteredSuggestions,
      analysis: {
        contentLength: textToAnalyze.length,
        strategiesUsed: [
          'tech-keywords',
          'popular-tags',
          'structural',
          'topic-based',
        ],
        totalCandidates: suggestions.size,
        filtered: filteredSuggestions.length,
      },
    };

    return createSuccessResponse(
      responseData,
      'Tag suggestions generated successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// Extract technology-related keywords
function extractTechKeywords(text: string): string[] {
  const techPatterns = [
    // Programming languages
    /\b(javascript|typescript|python|java|csharp|php|ruby|go|rust|swift|kotlin)\b/g,
    // Frameworks and libraries
    /\b(react|vue|angular|nodejs|express|django|flask|rails|spring|laravel)\b/g,
    // Technologies
    /\b(api|rest|graphql|database|mysql|postgresql|mongodb|redis|docker|kubernetes)\b/g,
    // Web technologies
    /\b(html|css|sass|scss|tailwind|bootstrap|webpack|vite|nextjs|gatsby)\b/g,
    // Cloud and DevOps
    /\b(aws|azure|gcp|docker|kubernetes|jenkins|github|gitlab|ci\/cd|devops)\b/g,
  ];

  const keywords = new Set<string>();
  techPatterns.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => keywords.add(match.toLowerCase()));
  });

  return Array.from(keywords);
}

// Extract popular tags from existing articles
function extractPopularTags(articles: any[]): Map<string, number> {
  const tagCounts = new Map<string, number>();

  articles.forEach((article) => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach((tag: string) => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      });
    }
  });

  return tagCounts;
}

// Find tags that match content
function findMatchingTags(
  text: string,
  popularTags: Map<string, number>
): string[] {
  const matchingTags: string[] = [];

  popularTags.forEach((count, tag) => {
    // Check if tag or related terms appear in content
    if (text.includes(tag) || text.includes(tag.replace('-', ' '))) {
      matchingTags.push(tag);
    }
  });

  return matchingTags.sort(
    (a, b) => (popularTags.get(b) || 0) - (popularTags.get(a) || 0)
  );
}

// Extract structural content tags
function extractStructuralTags(text: string): string[] {
  const tags: string[] = [];

  // Check for common content patterns
  if (
    text.includes('tutorial') ||
    text.includes('step by step') ||
    text.includes('how to')
  ) {
    tags.push('tutorial');
  }
  if (text.includes('guide') || text.includes('comprehensive')) {
    tags.push('guide');
  }
  if (text.includes('tips') || text.includes('advice')) {
    tags.push('tips');
  }
  if (text.includes('review') || text.includes('evaluation')) {
    tags.push('review');
  }
  if (
    text.includes('comparison') ||
    text.includes('vs') ||
    text.includes('versus')
  ) {
    tags.push('comparison');
  }
  if (text.includes('beginner') || text.includes('getting started')) {
    tags.push('beginner');
  }
  if (text.includes('advanced') || text.includes('expert')) {
    tags.push('advanced');
  }
  if (text.includes('best practices') || text.includes('best practice')) {
    tags.push('best-practices');
  }

  return tags;
}

// Extract topic-based tags
function extractTopicTags(text: string): string[] {
  const topicPatterns = [
    {
      pattern: /\b(web development|frontend|backend|fullstack)\b/g,
      tag: 'web-development',
    },
    {
      pattern: /\b(mobile development|ios|android|app development)\b/g,
      tag: 'mobile-development',
    },
    {
      pattern: /\b(machine learning|ai|artificial intelligence|ml)\b/g,
      tag: 'machine-learning',
    },
    { pattern: /\b(data science|analytics|big data)\b/g, tag: 'data-science' },
    {
      pattern: /\b(ui design|ux design|user experience|user interface)\b/g,
      tag: 'design',
    },
    { pattern: /\b(startup|entrepreneur|business)\b/g, tag: 'business' },
    { pattern: /\b(marketing|seo|social media)\b/g, tag: 'marketing' },
    { pattern: /\b(security|cybersecurity|privacy)\b/g, tag: 'security' },
    { pattern: /\b(performance|optimization|speed)\b/g, tag: 'performance' },
    { pattern: /\b(testing|unit test|integration test)\b/g, tag: 'testing' },
  ];

  const tags: string[] = [];
  topicPatterns.forEach(({ pattern, tag }) => {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  });

  return tags;
}

// Calculate confidence score for a tag suggestion
function calculateConfidence(tag: string, text: string): number {
  let confidence = 0;

  // Base confidence for finding the tag in text
  if (text.includes(tag)) {
    confidence += 0.5;
  }
  if (text.includes(tag.replace('-', ' '))) {
    confidence += 0.3;
  }

  // Boost for technology tags
  const techTerms = ['javascript', 'react', 'python', 'api', 'database'];
  if (techTerms.includes(tag)) {
    confidence += 0.3;
  }

  // Boost for common content types
  const contentTypes = ['tutorial', 'guide', 'tips', 'review'];
  if (contentTypes.includes(tag)) {
    confidence += 0.2;
  }

  // Penalty for very generic tags
  const genericTags = ['general', 'article', 'content'];
  if (genericTags.includes(tag)) {
    confidence -= 0.3;
  }

  return Math.max(0, Math.min(1, confidence));
}

// Get reason for tag suggestion
function getTagReason(tag: string, text: string, title: string): string {
  if (title.toLowerCase().includes(tag)) {
    return 'Found in title';
  }
  if (text.includes(tag)) {
    return 'Found in content';
  }
  if (text.includes(tag.replace('-', ' '))) {
    return 'Related term found in content';
  }

  const structuralTags = ['tutorial', 'guide', 'tips', 'review', 'comparison'];
  if (structuralTags.includes(tag)) {
    return 'Based on content structure';
  }

  return 'Related to content topic';
}

// Detect tag category (reused from main tags endpoint)
function detectTagCategory(tag: string): string {
  const techTags = [
    'javascript',
    'python',
    'react',
    'node',
    'typescript',
    'css',
    'html',
    'api',
    'database',
    'frontend',
    'backend',
    'web',
    'mobile',
    'ios',
    'android',
    'devops',
    'aws',
    'docker',
    'kubernetes',
  ];
  const designTags = [
    'design',
    'ui',
    'ux',
    'figma',
    'sketch',
    'adobe',
    'branding',
    'logo',
    'typography',
    'color',
  ];
  const businessTags = [
    'marketing',
    'sales',
    'startup',
    'entrepreneur',
    'business',
    'strategy',
    'growth',
    'analytics',
    'seo',
    'social',
  ];
  const topicTags = [
    'tutorial',
    'guide',
    'tips',
    'howto',
    'best-practices',
    'review',
    'comparison',
    'news',
    'trends',
  ];

  const lowerTag = tag.toLowerCase();

  if (techTags.some((tech) => lowerTag.includes(tech))) {
    return 'technology';
  }
  if (designTags.some((design) => lowerTag.includes(design))) {
    return 'design';
  }
  if (businessTags.some((biz) => lowerTag.includes(biz))) {
    return 'business';
  }
  if (topicTags.some((topic) => lowerTag.includes(topic))) {
    return 'content-type';
  }

  return 'general';
}
