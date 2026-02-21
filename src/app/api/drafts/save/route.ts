import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [DRAFT API] POST /api/drafts/save - Request received');

    // Parse request body
    const body = await request.json();
    const { documentId, userId, content, timestamp, title } = body;

    console.log('📝 [DRAFT API] Request details:', {
      documentId: documentId,
      userId: userId,
      contentLength: content?.length || 0,
      titleProvided: !!title,
      timestamp: timestamp,
      hasUserId: !!userId,
      hasDocumentId: !!documentId,
      hasContent: !!content,
    });

    // Validate required fields
    if (!documentId || !userId || !content) {
      console.error('Draft save validation failed:', {
        documentId: !!documentId,
        userId: !!userId,
        content: !!content,
      });
      return NextResponse.json(
        { error: 'Missing required fields: documentId, userId, content' },
        { status: 400 }
      );
    }

    // Generate a title from content if not provided
    const articleTitle =
      title || generateTitleFromContent(content) || 'Untitled Draft';

    // Generate excerpt from content
    const excerpt = generateExcerpt(content);

    // Generate slug from title or documentId
    const slug = generateSlug(articleTitle + '-' + Date.now());

    // Use admin client for better performance and avoiding RLS issues for drafts
    const supabase = getSupabaseAdmin();

    // Try to find an existing draft by documentId if it looks like a UUID
    let existingArticle = null;
    let fetchError = null;

    if (
      documentId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      // documentId is a UUID, try to find the article by ID
      const result = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('id', documentId)
        .eq('author_id', userId)
        .eq('status', 'draft')
        .single();

      existingArticle = result.data;
      fetchError = result.error;
    } else {
      // documentId is not a UUID, find the most recent draft for this user
      const result = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('author_id', userId)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      existingArticle = result.data;
      fetchError = result.error;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is fine for insert)
      console.warn('Fetch error (non-critical):', fetchError);
    }

    const now = new Date().toISOString();
    let result;

    if (existingArticle) {
      // Update existing draft
      console.log('Updating existing draft:', {
        id: existingArticle.id,
        currentTitle: existingArticle.title,
        newTitle: articleTitle,
      });

      const { data, error } = await supabase
        .from('articles')
        .update({
          title: articleTitle,
          body_md: content,
          excerpt: excerpt,
          updated_at: now,
        })
        .eq('id', existingArticle.id)
        .select('id, title, slug, status, updated_at');

      if (error) {
        console.error('Draft update error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          articleId: existingArticle.id,
        });
        throw error;
      }
      result = data?.[0];
      console.log('Draft updated successfully:', result);
    } else {
      // Create new draft article
      const articleData = {
        title: articleTitle,
        slug: slug,
        body_md: content,
        author_id: userId,
        status: 'draft' as const,
        tags: [],
        excerpt: excerpt,
        view_count: 0,
        created_at: now,
        updated_at: now,
        published_at: null,
      };

      console.log('Creating new draft:', {
        title: articleData.title,
        slug: articleData.slug,
        author_id: articleData.author_id,
        status: articleData.status,
      });

      const { data, error } = await supabase
        .from('articles')
        .insert(articleData)
        .select('id, title, slug, status, created_at, updated_at');

      if (error) {
        console.error('Draft insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          articleData: articleData,
        });
        throw error;
      }
      result = data?.[0];
      console.log('Draft created successfully:', result);
    }

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Draft save error:', error);

    return NextResponse.json(
      {
        error: 'Failed to save draft',
        message: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to generate title from content
function generateTitleFromContent(content: string): string {
  // Extract first heading or first line
  const lines = content.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    // Look for markdown heading
    const headingMatch = line.match(/^#+\s+(.+)$/);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Use first non-empty line if no heading found
    if (line.trim() && !line.startsWith('#')) {
      return line.trim().substring(0, 100);
    }
  }

  return 'Untitled Draft';
}

// Helper function to generate excerpt from content
function generateExcerpt(content: string, maxLength: number = 150): string {
  // Remove markdown formatting for excerpt
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Cut at word boundary
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (
    (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...'
  );
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function GET(request: NextRequest) {
  try {
    // Get draft by documentId and userId from query params
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');

    if (!documentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: documentId, userId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch user's most recent draft or specific article if documentId looks like an article ID
    let query = supabase
      .from('articles')
      .select(
        'id, title, slug, body_md, status, tags, excerpt, created_at, updated_at'
      )
      .eq('author_id', userId)
      .eq('status', 'draft');

    // If documentId looks like a UUID, try to fetch by ID
    if (
      documentId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      query = query.eq('id', documentId);
    } else {
      // Otherwise get the most recent draft
      query = query.order('updated_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No draft found
        return NextResponse.json(
          { message: 'No draft found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        document_id: data.id, // For compatibility with existing frontend
        user_id: userId,
        title: data.title,
        content: data.body_md,
        created_at: data.created_at,
        updated_at: data.updated_at,
        // Additional article data
        slug: data.slug,
        status: data.status,
        tags: data.tags,
        excerpt: data.excerpt,
      },
    });
  } catch (error: any) {
    console.error('Draft fetch error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch draft',
        message: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
