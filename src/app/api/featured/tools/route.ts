import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, supabase } from '@/lib/supabase';
import type { FeaturedTool } from '@/lib/supabase';

// GET /api/featured/tools - Get featured AI tools for home feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12); // Max 12, default 6

    // Use the database function to get featured tools
    const { data: featuredTools, error } = await supabase.rpc(
      'get_featured_tools',
      { limit_count: limit }
    );

    if (error) {
      console.error('Error fetching featured tools:', error);
      return NextResponse.json(
        { error: 'Failed to fetch featured tools' },
        { status: 500 }
      );
    }

    // Transform data to match FeaturedTool interface
    const tools: FeaturedTool[] = (featuredTools || []).map((tool: any) => ({
      id: tool.id,
      title: tool.title,
      description: tool.description,
      image_url: tool.image_url,
      affiliate_url: tool.affiliate_url,
      type: tool.type,
      tags: tool.tags || [],
      rating: tool.rating,
      price_range: tool.price_range,
      click_count: tool.click_count || 0,
      author: tool.author,
      is_active: tool.is_active,
      created_at: tool.created_at,
      featured_order: tool.featured_order,
    }));

    return NextResponse.json({
      tools,
      count: tools.length,
    });
  } catch (error) {
    console.error('Featured tools API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/featured/tools - Admin: Update featured status of tools
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool_id, is_featured, featured_order } = body;

    if (!tool_id) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
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

    // First, if setting featured_order, check if another tool already has that order
    if (is_featured && featured_order) {
      const { data: existingTool } = await admin
        .from('affiliate_library')
        .select('id')
        .eq('featured_order', featured_order)
        .neq('id', tool_id)
        .single();

      if (existingTool) {
        // Clear the existing tool's featured_order
        await admin
          .from('affiliate_library')
          .update({ featured_order: null })
          .eq('id', existingTool.id);
      }
    }

    // Update the tool
    const { data: updatedTool, error } = await admin
      .from('affiliate_library')
      .update({
        is_featured,
        featured_order: is_featured ? featured_order : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tool_id)
      .select('id, title, is_featured, featured_order')
      .single();

    if (error) {
      console.error('Error updating featured tool:', error);
      return NextResponse.json(
        { error: 'Failed to update tool featured status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tool: updatedTool,
    });
  } catch (error) {
    console.error('Featured tools PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/featured/tools - Admin: Batch update featured tools
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tools } = body;

    if (!Array.isArray(tools)) {
      return NextResponse.json(
        { error: 'Tools array is required' },
        { status: 400 }
      );
    }

    // Validate tools data
    for (const tool of tools) {
      if (!tool.id) {
        return NextResponse.json(
          { error: 'Each tool must have an ID' },
          { status: 400 }
        );
      }

      if (
        tool.featured_order &&
        (tool.featured_order < 1 || tool.featured_order > 6)
      ) {
        return NextResponse.json(
          { error: 'Featured order must be between 1 and 6' },
          { status: 400 }
        );
      }
    }

    const admin = getSupabaseAdmin();

    // First, clear all existing featured tools
    await admin
      .from('affiliate_library')
      .update({
        is_featured: false,
        featured_order: null,
        updated_at: new Date().toISOString(),
      })
      .eq('is_featured', true);

    // Then set the new featured tools
    const updatePromises = tools.map((tool) =>
      admin
        .from('affiliate_library')
        .update({
          is_featured: tool.is_featured || false,
          featured_order: tool.is_featured ? tool.featured_order || null : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tool.id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('Batch update errors:', errors);
      return NextResponse.json(
        { error: 'Some tools failed to update' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated_count: tools.length,
    });
  } catch (error) {
    console.error('Featured tools POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
