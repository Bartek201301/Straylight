import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to check/create user in public.users table
export async function POST(request: NextRequest) {
  try {
    const { author_id } = await request.json();

    if (!author_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'author_id is required',
        },
        { status: 400 }
      );
    }

    // Check if user exists in public.users table
    const { data: existingUser, error: fetchError } = await getSupabaseAdmin()
      .from('users')
      .select('*')
      .eq('id', author_id)
      .single();

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists in public.users table',
        data: existingUser,
      });
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found
      return NextResponse.json(
        {
          success: false,
          error: 'Database error while checking user',
          details: fetchError,
        },
        { status: 500 }
      );
    }

    // Create user if doesn't exist
    const { data: newUser, error: createError } = await getSupabaseAdmin()
      .from('users')
      .insert({
        id: author_id,
        handle: 'testuser-' + Date.now(),
        role: 'member',
        xp: 0,
        badges: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (createError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user in public.users table',
          details: createError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully in public.users table',
      data: newUser,
    });
  } catch (error) {
    console.error('Debug user endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error,
      },
      { status: 500 }
    );
  }
}
