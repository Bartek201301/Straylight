import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { authenticateAPIRequest } from '@/lib/auth/api-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    // Authenticate the user
    const authResult = await authenticateAPIRequest(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Parse the request body to get the action (like or unlike)
    const body = await request.json();
    const { action } = body; // 'like' or 'unlike'

    if (!action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "like" or "unlike"' },
        { status: 400 }
      );
    }

    // Use admin client for database operations
    const admin = getSupabaseAdmin();

    // Check if article exists and is published
    const { data: article, error: articleError } = await admin
      .from('articles')
      .select('id, status, author_id')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot vote on unpublished article' },
        { status: 400 }
      );
    }

    // Prevent self-voting
    if (article.author_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own article' },
        { status: 400 }
      );
    }

    if (action === 'like') {
      // Cast a like (or update existing vote to like)
      const { error: voteError } = await admin.rpc('cast_vote', {
        p_user_id: user.id,
        p_item_id: articleId,
        p_item_type: 'article',
        p_vote_type: 'like',
      });

      if (voteError) {
        console.error('Error casting vote:', voteError);
        return NextResponse.json(
          { error: 'Failed to cast vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: 'liked' });
    } else if (action === 'unlike') {
      // Remove the vote
      const { data: voteRemoved, error: removeError } = await admin.rpc(
        'remove_vote',
        {
          p_user_id: user.id,
          p_item_id: articleId,
          p_item_type: 'article',
        }
      );

      if (removeError) {
        console.error('Error removing vote:', removeError);
        return NextResponse.json(
          { error: 'Failed to remove vote' },
          { status: 500 }
        );
      }

      // The function returns a boolean indicating if a vote was actually removed
      if (!voteRemoved) {
        console.warn(
          'No vote found to remove for user:',
          user.id,
          'on article:',
          articleId
        );
        // Still return success since the desired state (no vote) is achieved
      }

      return NextResponse.json({ success: true, action: 'unliked' });
    }
  } catch (error) {
    console.error('Error in vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;

    // Authenticate the user
    const authResult = await authenticateAPIRequest(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;

    // Use admin client for database operations
    const admin = getSupabaseAdmin();

    // Get user's vote on this article
    const { data: userVote, error: voteError } = await admin.rpc(
      'get_user_vote',
      {
        p_user_id: user.id,
        p_item_id: articleId,
        p_item_type: 'article',
      }
    );

    if (voteError) {
      console.error('Error getting user vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to get user vote' },
        { status: 500 }
      );
    }

    // Return whether user has liked this article
    return NextResponse.json({
      hasLiked: userVote === 'like',
      voteType: userVote || null,
    });
  } catch (error) {
    console.error('Error in get vote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
