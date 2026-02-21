import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: {
    handle: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { handle } = params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    // Get user profile by handle
    const { data: profileData, error: profileError } =
      await getSupabaseAdmin().rpc('get_user_profile_by_handle', {
        user_handle: handle,
      });

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile data' },
        { status: 500 }
      );
    }

    if (!profileData || profileData.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profileData[0];

    // Get total likes for this user
    const { data: likesData } = await getSupabaseAdmin().rpc(
      'get_user_total_likes',
      { user_id: profile.id }
    );

    // Get user's published articles
    const { data: articles, error: articlesError } = await getSupabaseAdmin()
      .from('articles')
      .select('*')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.error('Error fetching user articles:', articlesError);
      // Don't fail the request, just return empty articles
    }

    return NextResponse.json({
      profile: {
        ...profile,
        total_likes: likesData || 0,
      },
      articles: articles || [],
    });
  } catch (error) {
    console.error('Unexpected error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
