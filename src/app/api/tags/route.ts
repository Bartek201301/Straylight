import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
  ValidationError,
} from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const popular = searchParams.get('popular') === 'true';
    const category = searchParams.get('category') || '';

    let query = getSupabaseAdmin().from('articles').select('tags');

    // Only get published articles for tag suggestions
    query = query.eq('status', 'published');

    const { data: articles, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch tags', error);
    }

    // Extract and count all tags
    const tagCounts = new Map<string, number>();
    const tagCategories = new Map<string, string[]>();

    articles?.forEach((article) => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach((tag) => {
          if (typeof tag === 'string') {
            const normalizedTag = tag.toLowerCase().trim();
            if (normalizedTag) {
              tagCounts.set(
                normalizedTag,
                (tagCounts.get(normalizedTag) || 0) + 1
              );

              // Simple category detection based on tag patterns
              const tagCategory = detectTagCategory(normalizedTag);
              if (!tagCategories.has(tagCategory)) {
                tagCategories.set(tagCategory, []);
              }
              if (!tagCategories.get(tagCategory)!.includes(normalizedTag)) {
                tagCategories.get(tagCategory)!.push(normalizedTag);
              }
            }
          }
        });
      }
    });

    // Convert to array and sort
    let tags = Array.from(tagCounts.entries()).map(([tag, count]) => ({
      name: tag,
      count,
      category: detectTagCategory(tag),
    }));

    // Filter by search term
    if (search) {
      tags = tags.filter((tag) =>
        tag.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by category
    if (category) {
      tags = tags.filter((tag) => tag.category === category);
    }

    // Sort by popularity or alphabetically
    if (popular) {
      tags.sort((a, b) => b.count - a.count);
    } else {
      tags.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Limit results
    tags = tags.slice(0, limit);

    // Get categories for response
    const categories = Array.from(tagCategories.keys()).sort();

    const responseData = {
      tags: tags.map((tag) => ({
        name: tag.name,
        count: tag.count,
        category: tag.category,
      })),
      categories,
      total: tagCounts.size,
      filters: {
        search,
        category,
        popular,
        limit,
      },
    };

    return createSuccessResponse(
      responseData,
      'Tags retrieved successfully',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();
    const { name, category } = body;

    if (!name || typeof name !== 'string') {
      throw new ValidationError('Tag name is required and must be a string');
    }

    const normalizedName = name.toLowerCase().trim();

    // Validate tag format
    if (!/^[a-z0-9_-]+$/.test(normalizedName)) {
      throw new ValidationError(
        'Tag can only contain lowercase letters, numbers, hyphens, and underscores'
      );
    }

    if (normalizedName.length < 2 || normalizedName.length > 50) {
      throw new ValidationError('Tag must be between 2 and 50 characters');
    }

    // Check if tag already exists
    const { data: existingArticles, error: checkError } =
      await getSupabaseAdmin()
        .from('articles')
        .select('id')
        .contains('tags', [normalizedName])
        .limit(1);

    if (checkError) {
      throw new DatabaseError('Failed to check tag existence', checkError);
    }

    const tagExists = existingArticles && existingArticles.length > 0;
    const detectedCategory = category || detectTagCategory(normalizedName);

    const responseData = {
      name: normalizedName,
      exists: tagExists,
      category: detectedCategory,
      suggested: !tagExists,
    };

    return createSuccessResponse(
      responseData,
      tagExists ? 'Tag already exists' : 'New tag validated',
      requestId,
      tagExists ? 200 : 201
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

// Helper function to detect tag category based on common patterns
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
