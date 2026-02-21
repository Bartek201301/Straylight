import { NextRequest, NextResponse } from 'next/server';
import {
  addNewsletterSubscriber,
  addSubscriberTags,
  TAG_CATEGORIES,
} from '@/lib/mail/mailchimp';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { NewsletterSubscriptionInsert } from '@/lib/supabase';
import { z } from 'zod';

// Enhanced validation schema for newsletter subscription
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name too long'),
  lastName: z.string().optional(),
  careerFocus: z
    .array(z.string())
    .min(1, 'Please select at least one career focus')
    .optional(),
  experienceLevel: z.string().optional(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    const {
      email,
      firstName,
      lastName,
      careerFocus,
      experienceLevel,
      frequency,
    } = validatedData;

    // Get Supabase admin client for database operations
    const supabase = getSupabaseAdmin();

    // Check if email already exists in our database
    const { data: existingSubscription, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, status')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new subscriptions
      console.error('Database check error:', checkError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error occurred',
          details: 'Unable to check existing subscription',
        },
        { status: 500 }
      );
    }

    // If user already exists and is confirmed, return success
    if (existingSubscription && existingSubscription.status === 'confirmed') {
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to our newsletter!',
        data: {
          email,
          status: 'confirmed',
          alreadySubscribed: true,
        },
      });
    }

    // Prepare data for database insertion (only if not already exists)
    let newSubscription = null;
    if (!existingSubscription) {
      const subscriptionData: NewsletterSubscriptionInsert = {
        email: email.toLowerCase(),
        first_name: firstName,
        career_focus: careerFocus || [],
        experience_level: experienceLevel || null,
        frequency: frequency || 'weekly',
        status: 'pending', // Start as pending, will be confirmed via Mailchimp
      };

      // Insert into database
      const { data: insertedSubscription, error: insertError } = await supabase
        .from('newsletter_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);

        // Handle unique constraint violation (duplicate email)
        if (insertError.code === '23505') {
          return NextResponse.json({
            success: true,
            message: 'You are already subscribed to our newsletter!',
            data: { email, status: 'confirmed', alreadySubscribed: true },
          });
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to save subscription',
            details: 'Database insert failed',
          },
          { status: 500 }
        );
      }

      newSubscription = insertedSubscription;
    }

    // Add subscriber to Mailchimp list
    const result = await addNewsletterSubscriber(email, firstName, lastName);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'rate_limit_exceeded'
          ? 429
          : result.errorCode === 'invalid_email'
            ? 400
            : 500;

      return NextResponse.json(
        {
          success: false,
          error: result.userMessage || result.error,
          details: result.error,
          shouldRetry: result.shouldRetry,
          retryAfter: result.retryAfter,
          databaseSaved: !!newSubscription,
        },
        {
          status: statusCode,
          headers: result.retryAfter
            ? { 'Retry-After': result.retryAfter.toString() }
            : {},
        }
      );
    }

    // Add tags if provided and subscription was successful
    if (result.subscriberId) {
      try {
        const tagsToAdd: string[] = [TAG_CATEGORIES.ENGAGEMENT.NEW_SUBSCRIBER];

        // Add career focus as tags
        if (careerFocus && careerFocus.length > 0) {
          const careerTags = careerFocus.map((focus) =>
            focus.toLowerCase().replace(/[^a-z0-9]/g, '-')
          );
          tagsToAdd.push(...careerTags);
        }

        // Add experience level as tag
        if (experienceLevel) {
          tagsToAdd.push(`experience-${experienceLevel}`);
        }

        // Add frequency preference as tag
        if (frequency) {
          tagsToAdd.push(`frequency-${frequency}`);
        }

        // Add custom tags if provided
        if (validatedData.tags && validatedData.tags.length > 0) {
          tagsToAdd.push(...validatedData.tags);
        }

        const tagResult = await addSubscriberTags(email, tagsToAdd);
        if (!tagResult.success) {
          console.warn('Failed to add tags:', tagResult.error);
        }
      } catch (tagError) {
        // Don't fail the subscription if tagging fails, just log it
        console.warn('Failed to add tags:', tagError);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        email,
        subscriberId: result.subscriberId,
        status: 'pending',
        confirmationRequired: true,
        subscriptionId: newSubscription?.id,
        databaseSaved: true,
        mailchimpSuccess: true,
        ...(result.data || {}),
      },
    });
  } catch (error: any) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
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
          error: 'Invalid JSON in request body',
        },
        { status: 400 }
      );
    }

    console.error('Newsletter subscription error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to subscribe to newsletter.',
    },
    { status: 405 }
  );
}
