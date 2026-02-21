import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATION_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Revalidation not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { path, slug, type = 'article' } = body;

    // Revalidate specific paths based on the update type
    if (type === 'article' && slug) {
      // Revalidate the specific article page
      revalidatePath(`/articles/${slug}`);

      // Also revalidate the articles listing page
      revalidatePath('/articles');

      // Revalidate the home page (in case featured articles changed)
      revalidatePath('/');

      console.log(`Revalidated article: ${slug}`);

      return NextResponse.json({
        revalidated: true,
        message: `Article ${slug} revalidated successfully`,
        paths: [`/articles/${slug}`, '/articles', '/'],
        timestamp: new Date().toISOString(),
      });
    }

    if (path) {
      // Revalidate a specific path
      revalidatePath(path);

      console.log(`Revalidated path: ${path}`);

      return NextResponse.json({
        revalidated: true,
        message: `Path ${path} revalidated successfully`,
        paths: [path],
        timestamp: new Date().toISOString(),
      });
    }

    // Bulk revalidation for major content changes
    if (type === 'bulk') {
      const paths = ['/', '/articles', '/library', '/research'];

      // Get all published article slugs for comprehensive revalidation
      const supabase = getSupabaseAdmin();
      const { data: articles } = await supabase
        .from('articles')
        .select('slug')
        .eq('status', 'published')
        .limit(50); // Limit to prevent overwhelming the system

      // Add article paths to revalidation list
      if (articles) {
        articles.forEach((article) => {
          paths.push(`/articles/${article.slug}`);
        });
      }

      // Revalidate all paths
      paths.forEach((path) => {
        revalidatePath(path);
      });

      console.log(`Bulk revalidated ${paths.length} paths`);

      return NextResponse.json({
        revalidated: true,
        message: `Bulk revalidation completed for ${paths.length} paths`,
        paths,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid revalidation request - missing path or slug' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Revalidation error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error during revalidation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for testing revalidation endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Revalidation endpoint is active',
    usage: {
      method: 'POST',
      headers: {
        authorization: 'Bearer YOUR_REVALIDATION_TOKEN',
        'content-type': 'application/json',
      },
      body: {
        examples: [
          { slug: 'article-slug', type: 'article' },
          { path: '/articles' },
          { type: 'bulk' },
        ],
      },
    },
    timestamp: new Date().toISOString(),
  });
}
