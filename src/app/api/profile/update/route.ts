import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const {
      userId,
      handle,
      display_name,
      bio,
      website,
      location,
      avatar_url,
      social_links,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current user data using admin client
    const adminClient = getSupabaseAdmin();
    const { data: currentUser, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {};

    // Handle username/handle update
    if (handle && handle !== currentUser.handle) {
      // Validate handle format
      if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
        return NextResponse.json(
          {
            error:
              'Username can only contain letters, numbers, underscores, and hyphens',
          },
          { status: 400 }
        );
      }

      if (handle.length < 3 || handle.length > 20) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 20 characters' },
          { status: 400 }
        );
      }

      // Check if handle is already taken using admin client
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('handle', handle)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }

      updates.handle = handle;
    }

    // Handle display name update
    if (display_name !== undefined) {
      if (display_name && display_name.length > 100) {
        return NextResponse.json(
          { error: 'Display name must be 100 characters or less' },
          { status: 400 }
        );
      }
      updates.display_name = display_name || null;
    }

    // Handle bio update
    if (bio !== undefined) {
      if (bio && bio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be 500 characters or less' },
          { status: 400 }
        );
      }
      updates.bio = bio || null;
    }

    // Handle website update
    if (website !== undefined) {
      if (website && website.trim()) {
        const websiteRegex =
          /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!websiteRegex.test(website.trim())) {
          return NextResponse.json(
            { error: 'Please enter a valid website URL' },
            { status: 400 }
          );
        }
        updates.website = website.trim();
      } else {
        updates.website = null;
      }
    }

    // Handle location update
    if (location !== undefined) {
      if (location && location.length > 100) {
        return NextResponse.json(
          { error: 'Location must be 100 characters or less' },
          { status: 400 }
        );
      }
      updates.location = location || null;
    }

    // Handle avatar URL update
    if (avatar_url !== undefined) {
      if (avatar_url && avatar_url.trim()) {
        // Validate URL format (allow both HTTP URLs and data URLs for base64)
        const isDataUrl = avatar_url.startsWith('data:image/');
        const isHttpUrl = /^https?:\/\/.+/.test(avatar_url.trim());

        if (!isDataUrl && !isHttpUrl) {
          return NextResponse.json(
            { error: 'Please provide a valid image URL' },
            { status: 400 }
          );
        }

        // Check length for base64 data URLs (to prevent extremely large URLs)
        if (isDataUrl && avatar_url.length > 5 * 1024 * 1024) {
          // 5MB limit for base64
          return NextResponse.json(
            { error: 'Profile image is too large. Maximum size: 5MB' },
            { status: 400 }
          );
        }

        updates.avatar_url = avatar_url.trim();
      } else {
        updates.avatar_url = null;
      }
    }

    // Handle social links update
    if (social_links !== undefined) {
      const cleanSocialLinks: any = {};
      const urlRegex =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

      // Validate each social link
      for (const [platform, url] of Object.entries(social_links as any)) {
        if (url && typeof url === 'string' && url.trim()) {
          if (!urlRegex.test(url.trim())) {
            return NextResponse.json(
              { error: `Please enter a valid ${platform} URL` },
              { status: 400 }
            );
          }
          cleanSocialLinks[platform] = url.trim();
        }
      }

      updates.social_links = cleanSocialLinks;
    }

    // Update database records
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await adminClient
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update profile', details: updateError.message },
          { status: 500 }
        );
      }
    }

    // Get updated user data
    const { data: updatedUser } = await adminClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser || currentUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check username availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    const userId = searchParams.get('userId');

    if (!handle) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate handle format
    if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
      return NextResponse.json(
        { available: false, error: 'Invalid username format' },
        { status: 200 }
      );
    }

    if (handle.length < 3 || handle.length > 20) {
      return NextResponse.json(
        {
          available: false,
          error: 'Username must be between 3 and 20 characters',
        },
        { status: 200 }
      );
    }

    // Check if handle exists (excluding current user if userId provided)
    let query = supabase.from('users').select('id').eq('handle', handle);

    if (userId) {
      query = query.neq('id', userId);
    }

    const { data: existingUser } = await query.single();

    return NextResponse.json({
      available: !existingUser,
      handle: handle,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
