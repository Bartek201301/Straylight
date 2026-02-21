import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ResourceSuggestionInsert } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema for resource suggestion
const resourceSuggestionSchema = z.object({
  resourceName: z
    .string()
    .min(1, 'Resource name is required')
    .max(200, 'Resource name too long'),
  resourceType: z.enum([
    'book',
    'tool',
    'course',
    'podcast',
    'dataset',
    'website',
    'paper',
    'other',
  ]),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  author: z
    .string()
    .max(100, 'Author name too long')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
  targetAudience: z
    .enum(['beginner', 'intermediate', 'advanced', 'all'])
    .optional()
    .or(z.literal('')),
  submitterName: z
    .string()
    .max(100, 'Name too long')
    .optional()
    .or(z.literal('')),
  submitterEmail: z.string().email('Invalid email address'),
  recommendation: z
    .string()
    .max(500, 'Recommendation too long')
    .optional()
    .or(z.literal('')),
  relationship: z.array(z.string()).optional(),
  pricing: z
    .enum(['free', 'freemium', 'paid', 'subscription'])
    .optional()
    .or(z.literal('')),
  timeInvestment: z
    .string()
    .max(100, 'Time investment description too long')
    .optional()
    .or(z.literal('')),
  prerequisites: z
    .string()
    .max(200, 'Prerequisites description too long')
    .optional()
    .or(z.literal('')),
  additionalNotes: z
    .string()
    .max(1000, 'Additional notes too long')
    .optional()
    .or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = resourceSuggestionSchema.parse(body);

    // Get Supabase admin client
    const supabase = getSupabaseAdmin();

    // Transform the data for database insertion
    const suggestionData: ResourceSuggestionInsert = {
      resource_name: validatedData.resourceName,
      resource_type: validatedData.resourceType,
      url: validatedData.url || null,
      author: validatedData.author || null,
      description: validatedData.description,
      categories: validatedData.categories,
      target_audience: validatedData.targetAudience || null,
      submitter_name: validatedData.submitterName || null,
      submitter_email: validatedData.submitterEmail.toLowerCase(),
      recommendation: validatedData.recommendation || null,
      relationship: validatedData.relationship || [],
      pricing: (validatedData.pricing as any) || null,
      time_investment: validatedData.timeInvestment || null,
      prerequisites: validatedData.prerequisites || null,
      additional_notes: validatedData.additionalNotes || null,
      status: 'pending', // All suggestions start as pending for review
    };

    // Insert the resource suggestion into database
    const { data: newSuggestion, error: insertError } = await supabase
      .from('resource_suggestions')
      .insert(suggestionData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save resource suggestion',
          userMessage: 'Something went wrong. Please try again later.',
          details:
            process.env.NODE_ENV === 'development'
              ? insertError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    // TODO: Send email notification to admin about new resource suggestion
    // This could be implemented using a service like Resend or by adding to a queue
    try {
      // For now, just log the new suggestion
      console.log('New resource suggestion received:', {
        id: newSuggestion.id,
        resourceName: newSuggestion.resource_name,
        submitterEmail: newSuggestion.submitter_email,
        resourceType: newSuggestion.resource_type,
      });

      // In a production environment, you might want to:
      // 1. Send email notification to admins
      // 2. Add to a review queue
      // 3. Send confirmation email to submitter
    } catch (notificationError) {
      // Don't fail the submission if notification fails
      console.warn('Failed to send notification:', notificationError);
    }

    // Success response
    return NextResponse.json({
      success: true,
      message:
        "Resource suggestion submitted successfully! We'll review it within 2-3 business days.",
      data: {
        suggestionId: newSuggestion.id,
        resourceName: newSuggestion.resource_name,
        submitterEmail: newSuggestion.submitter_email,
        status: newSuggestion.status,
        createdAt: newSuggestion.created_at,
        reviewProcess: {
          estimatedReviewTime: '2-3 business days',
          statusUpdates: "You'll receive email updates on the review status",
          creditOnApproval: "If approved, you'll get credit as a contributor",
        },
      },
    });
  } catch (error) {
    console.error('Resource suggestion error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          userMessage: 'Please check your input and try again.',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON',
          userMessage: 'Invalid request format.',
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        userMessage: 'Something went wrong. Please try again later.',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as any).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve suggestions (could be used for admin interface)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const status = searchParams.get('status') as
      | 'pending'
      | 'approved'
      | 'rejected';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Basic validation
    if (limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit cannot exceed 100',
          userMessage: 'Too many results requested.',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('resource_suggestions')
      .select(
        `
        id,
        resource_name,
        resource_type,
        description,
        categories,
        target_audience,
        submitter_name,
        submitter_email,
        status,
        created_at,
        reviewed_at
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by email if provided (for user's own submissions)
    if (email) {
      if (!z.string().email().safeParse(email).success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email format',
            userMessage: 'Please provide a valid email address.',
          },
          { status: 400 }
        );
      }
      query = query.eq('submitter_email', email.toLowerCase());
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: suggestions, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          userMessage: 'Unable to retrieve suggestions.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Suggestions retrieved successfully',
      data: {
        suggestions,
        pagination: {
          limit,
          offset,
          count: suggestions.length,
        },
      },
    });
  } catch (error) {
    console.error('Resource suggestion GET error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        userMessage: 'Unable to retrieve suggestions.',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as any).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        Allow: 'POST, GET, OPTIONS',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
