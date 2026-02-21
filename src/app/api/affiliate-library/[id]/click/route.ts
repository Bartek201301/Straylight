import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import {
  handleAPIError,
  generateRequestId,
  NotFoundError,
} from '@/lib/errors/api-errors';

/**
 * POST /api/affiliate-library/[id]/click
 * Track affiliate link click with enhanced analytics and return the affiliate URL for redirection
 * This endpoint increments the click count, stores tracking data, and returns the affiliate URL
 * The frontend should then redirect to the returned URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();

  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      throw new Error('Valid item ID is required');
    }

    // Parse enhanced tracking data from request body
    const trackingData = await request.json().catch(() => ({}));
    const {
      timestamp,
      userAgent,
      referrer,
      sessionId,
      source = 'card',
      context = {},
    } = trackingData;

    // Get the affiliate library item
    const { data: item, error: fetchError } = await supabase
      .from('affiliate_library')
      .select('id, title, affiliate_url, is_active, click_count')
      .eq('id', id)
      .eq('is_active', true) // Only allow clicks on active items
      .single();

    if (fetchError || !item) {
      throw new NotFoundError('Affiliate library item not found or inactive');
    }

    // Generate unique tracking ID
    const trackingId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Increment click count using admin client
    const { data: updatedItem, error: updateError } = await getSupabaseAdmin()
      .from('affiliate_library')
      .update({
        click_count: item.click_count + 1,
        last_clicked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, title, affiliate_url, click_count')
      .single();

    if (updateError) {
      // Log error but still return the affiliate URL to not break user experience
      console.error('Failed to update click count:', updateError);
    }

    // Store detailed tracking data (fire and forget - don't block response)
    if (sessionId || userAgent) {
      getSupabaseAdmin()
        .from('affiliate_clicks')
        .insert({
          tracking_id: trackingId,
          item_id: id,
          session_id: sessionId,
          user_agent: userAgent,
          referrer: referrer,
          source: source,
          context: context,
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
          timestamp: timestamp || new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to store tracking data:', error);
          }
        });
    }

    // Return the affiliate URL for frontend to redirect
    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        title: item.title,
        affiliate_url: item.affiliate_url,
        click_count: updatedItem?.click_count || item.click_count,
        tracking_id: trackingId,
      },
      message: 'Click tracked successfully',
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error) {
    return handleAPIError(error, requestId);
  }
}

/**
 * GET /api/affiliate-library/[id]/click
 * Alternative method for click tracking via GET request (for simple redirects)
 * This directly redirects the user to the affiliate URL after tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  generateRequestId();

  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      throw new Error('Valid item ID is required');
    }

    // Get the affiliate library item
    const { data: item, error: fetchError } = await supabase
      .from('affiliate_library')
      .select('id, title, affiliate_url, is_active, click_count')
      .eq('id', id)
      .eq('is_active', true) // Only allow clicks on active items
      .single();

    if (fetchError || !item) {
      throw new NotFoundError('Affiliate library item not found or inactive');
    }

    // Increment click count using admin client (fire and forget)
    getSupabaseAdmin()
      .from('affiliate_library')
      .update({ click_count: item.click_count + 1 })
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to update click count:', error);
        }
      });

    // Directly redirect to affiliate URL
    return NextResponse.redirect(item.affiliate_url, 302);
  } catch (error) {
    // If there's an error, redirect to a fallback page or return error
    if (error instanceof NotFoundError) {
      // Could redirect to a "not found" page instead
      return new NextResponse('Affiliate link not found', { status: 404 });
    }

    // For other errors, log and return generic error
    console.error('Affiliate click tracking error:', error);
    return new NextResponse('Affiliate link temporarily unavailable', {
      status: 500,
    });
  }
}
