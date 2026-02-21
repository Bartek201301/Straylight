import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import {
  handleAPIError,
  createSuccessResponse,
  generateRequestId,
  DatabaseError,
  ValidationError,
} from '@/lib/errors/api-errors';
import { generateSlugAlternatives } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await request.json();
    const { slug, excludeId } = body;

    if (!slug || typeof slug !== 'string') {
      throw new ValidationError('Slug is required and must be a string');
    }

    // Basic slug format validation
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new ValidationError(
        'Slug can only contain lowercase letters, numbers, and hyphens'
      );
    }

    // Check if slug exists in database
    let query = getSupabaseAdmin()
      .from('articles')
      .select('id, slug')
      .eq('slug', slug);

    // Exclude current article when editing
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existingArticles, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to check slug availability', error);
    }

    const isAvailable = !existingArticles || existingArticles.length === 0;
    let suggestions: string[] = [];

    // If slug is not available, generate alternatives
    if (!isAvailable) {
      // Get existing slugs that start with the base slug for better alternatives
      const { data: similarSlugs, error: similarError } =
        await getSupabaseAdmin()
          .from('articles')
          .select('slug')
          .like('slug', `${slug}%`);

      if (similarError) {
        console.warn('Failed to fetch similar slugs:', similarError);
      }

      const existingSlugs = similarSlugs?.map((item) => item.slug) || [];
      suggestions = generateSlugAlternatives(slug, existingSlugs, 5);
    }

    const responseData = {
      slug,
      isAvailable,
      ...(suggestions.length > 0 && { suggestions }),
    };

    return createSuccessResponse(
      responseData,
      isAvailable ? 'Slug is available' : 'Slug is not available',
      requestId
    );
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}
