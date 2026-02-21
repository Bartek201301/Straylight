import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    // Use admin client for database operations
    const admin = getSupabaseAdmin();

    // Check if article exists and is published (public endpoint, so we check visibility)
    const { data: article, error: articleError } = await admin
      .from('articles')
      .select('id, status')
      .eq('id', articleId)
      .eq('status', 'published')
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found or not published' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // Get vote counts from the public view (which only shows published articles)
    const { data: voteCounts, error: voteError } = await admin
      .from('public_article_vote_counts')
      .select('likes, upvotes, downvotes, net_votes, total_votes')
      .eq('article_id', articleId)
      .single();

    if (voteError) {
      // If no votes found, return zero counts
      if (voteError.code === 'PGRST116') {
        return NextResponse.json(
          {
            likes: 0,
            upvotes: 0, // For backward compatibility
            downvotes: 0, // Always 0 in like system
            net_votes: 0,
            total_votes: 0,
          },
          {
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        );
      }

      console.error('Error getting vote counts:', voteError);
      return NextResponse.json(
        { error: 'Failed to get vote counts' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    return NextResponse.json(
      {
        likes: voteCounts?.likes || 0, // Primary like count
        upvotes: voteCounts?.upvotes || 0, // For backward compatibility (same as likes)
        downvotes: voteCounts?.downvotes || 0, // Always 0 in like system
        net_votes: voteCounts?.net_votes || 0, // Same as likes in new system
        total_votes: voteCounts?.total_votes || 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in vote counts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
