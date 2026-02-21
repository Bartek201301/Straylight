import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import type { FeaturedArticle } from '@/lib/supabase';

// GET /api/featured/articles - Get featured articles for home feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12); // Max 12, default 6

    // Use the database function to get featured articles with author info
    const { data: featuredArticles, error } = await supabase.rpc(
      'get_featured_articles',
      { limit_count: limit }
    );

    if (error) {
      console.error('Error fetching featured articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch featured articles' },
        { status: 500 }
      );
    }

    // Transform data to match FeaturedArticle interface
    const articles: FeaturedArticle[] = (featuredArticles || []).map(
      (article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        body_md: article.body_md || '',
        cover_image_url: article.cover_image_url,
        tags: article.tags || [],
        view_count: article.view_count || 0,
        created_at: article.created_at,
        published_at: article.published_at,
        author_handle: article.author_handle,
        author_display_name: article.author_display_name,
        author_avatar_url: article.author_avatar_url,
        featured_order: article.featured_order,
      })
    );

    return NextResponse.json({
      articles,
      count: articles.length,
    });
  } catch (error) {
    console.error('Featured articles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/featured/articles - Admin: Update featured status of articles
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { article_id, is_featured, featured_order } = body;

    if (!article_id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Validate featured_order if provided
    if (featured_order !== null && featured_order !== undefined) {
      if (
        typeof featured_order !== 'number' ||
        featured_order < 1 ||
        featured_order > 6
      ) {
        return NextResponse.json(
          { error: 'Featured order must be between 1 and 6' },
          { status: 400 }
        );
      }
    }

    // Use admin client to update featured status
    const admin = getSupabaseAdmin();

    // First, if setting featured_order, check if another article already has that order
    if (is_featured && featured_order) {
      const { data: existingArticle } = await admin
        .from('articles')
        .select('id')
        .eq('featured_order', featured_order)
        .neq('id', article_id)
        .single();

      if (existingArticle) {
        // Clear the existing article's featured_order
        await admin
          .from('articles')
          .update({ featured_order: null })
          .eq('id', existingArticle.id);
      }
    }

    // Update the article
    const { data: updatedArticle, error } = await admin
      .from('articles')
      .update({
        is_featured,
        featured_order: is_featured ? featured_order : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article_id)
      .select('id, title, is_featured, featured_order')
      .single();

    if (error) {
      console.error('Error updating featured article:', error);
      return NextResponse.json(
        { error: 'Failed to update article featured status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article: updatedArticle,
    });
  } catch (error) {
    console.error('Featured articles PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/featured/articles - Admin: Batch update featured articles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles } = body;

    if (!Array.isArray(articles)) {
      return NextResponse.json(
        { error: 'Articles array is required' },
        { status: 400 }
      );
    }

    // Validate articles data
    for (const article of articles) {
      if (!article.id) {
        return NextResponse.json(
          { error: 'Each article must have an ID' },
          { status: 400 }
        );
      }

      if (
        article.featured_order &&
        (article.featured_order < 1 || article.featured_order > 6)
      ) {
        return NextResponse.json(
          { error: 'Featured order must be between 1 and 6' },
          { status: 400 }
        );
      }
    }

    const admin = getSupabaseAdmin();

    // First, clear all existing featured articles
    await admin
      .from('articles')
      .update({
        is_featured: false,
        featured_order: null,
        updated_at: new Date().toISOString(),
      })
      .eq('is_featured', true);

    // Then set the new featured articles
    const updatePromises = articles.map((article) =>
      admin
        .from('articles')
        .update({
          is_featured: article.is_featured || false,
          featured_order: article.is_featured
            ? article.featured_order || null
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Batch update errors:', errors);
      return NextResponse.json(
        { error: 'Some articles failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated_count: articles.length,
    });
  } catch (error) {
    console.error('Featured articles POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
