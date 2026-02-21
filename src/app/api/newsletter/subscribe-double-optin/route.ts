import { NextRequest, NextResponse } from 'next/server';
import {
  addNewsletterSubscriberDoubleOptin,
  addSubscriberTags,
  TAG_CATEGORIES,
} from '@/lib/mail/mailchimp';
import { z } from 'zod';

// Validation schema for newsletter subscription with double opt-in
const subscribeDoubleOptinSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = subscribeDoubleOptinSchema.parse(body);

    // Add subscriber with double opt-in (pending status)
    const result = await addNewsletterSubscriberDoubleOptin(
      validatedData.email,
      validatedData.firstName,
      validatedData.lastName
    );

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
        },
        {
          status: statusCode,
          headers: result.retryAfter
            ? { 'Retry-After': result.retryAfter.toString() }
            : {},
        }
      );
    }

    // Add "new-subscriber" tag for pending subscribers (will be activated upon confirmation)
    if (result.subscriberId && result.data?.status === 'pending') {
      try {
        const tagResult = await addSubscriberTags(validatedData.email, [
          TAG_CATEGORIES.ENGAGEMENT.NEW_SUBSCRIBER,
        ]);
        if (!tagResult.success) {
          console.warn('Failed to add new-subscriber tag:', tagResult.error);
        }
      } catch (tagError) {
        // Don't fail the subscription if tagging fails, just log it
        console.warn('Failed to add new-subscriber tag:', tagError);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data || {
        email: validatedData.email,
        subscriberId: result.subscriberId,
        status: 'pending',
        confirmationRequired: true,
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

    console.error('Newsletter double opt-in subscription error:', error);

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
      error:
        'Method not allowed. Use POST to subscribe to newsletter with double opt-in.',
    },
    { status: 405 }
  );
}
