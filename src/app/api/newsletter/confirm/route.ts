import { NextRequest, NextResponse } from 'next/server';
import {
  updateSubscriberStatus,
  getSubscriberStatus,
  addSubscriberTags,
  TAG_CATEGORIES,
} from '@/lib/mail/mailchimp';
import { z } from 'zod';

// Validation schema for subscription confirmation
const confirmSubscriptionSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().optional(), // Optional token for additional security
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = confirmSubscriptionSchema.parse(body);

    // First, check the current status of the subscriber
    const statusResult = await getSubscriberStatus(validatedData.email);

    if (!statusResult.success) {
      const statusCode =
        statusResult.errorCode === 'rate_limit_exceeded'
          ? 429
          : statusResult.errorCode === 'member_not_found'
            ? 404
            : 500;

      return NextResponse.json(
        {
          success: false,
          error: statusResult.userMessage || statusResult.error,
          details: statusResult.error,
          shouldRetry: statusResult.shouldRetry,
          retryAfter: statusResult.retryAfter,
        },
        {
          status: statusCode,
          headers: statusResult.retryAfter
            ? { 'Retry-After': statusResult.retryAfter.toString() }
            : {},
        }
      );
    }

    // Check if subscriber is already confirmed
    if (statusResult.data?.status === 'subscribed') {
      return NextResponse.json({
        success: true,
        message: 'Email is already confirmed and subscribed',
        data: {
          email: validatedData.email,
          status: 'subscribed',
          alreadyConfirmed: true,
        },
      });
    }

    // Check if subscriber is in pending status
    if (statusResult.data?.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm subscription. Current status: ${statusResult.data?.status}`,
          details: 'Only pending subscriptions can be confirmed',
        },
        { status: 400 }
      );
    }

    // Update subscriber status to confirmed/subscribed
    const confirmResult = await updateSubscriberStatus(
      validatedData.email,
      'subscribed'
    );

    if (!confirmResult.success) {
      const statusCode =
        confirmResult.errorCode === 'rate_limit_exceeded' ? 429 : 500;

      return NextResponse.json(
        {
          success: false,
          error: confirmResult.userMessage || confirmResult.error,
          details: confirmResult.error,
          shouldRetry: confirmResult.shouldRetry,
          retryAfter: confirmResult.retryAfter,
        },
        {
          status: statusCode,
          headers: confirmResult.retryAfter
            ? { 'Retry-After': confirmResult.retryAfter.toString() }
            : {},
        }
      );
    }

    // Update tags: remove "new-subscriber" and add "active-reader"
    try {
      await addSubscriberTags(validatedData.email, [
        TAG_CATEGORIES.ENGAGEMENT.ACTIVE_READER,
      ]);
    } catch (tagError) {
      // Don't fail the confirmation if tagging fails, just log it
      console.warn(
        'Failed to update subscriber tags after confirmation:',
        tagError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Subscription confirmed successfully! Welcome to our newsletter.',
      data: {
        email: validatedData.email,
        status: 'subscribed',
        subscriberId: confirmResult.data?.subscriberId,
        confirmedAt: new Date().toISOString(),
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

    console.error('Newsletter confirmation error:', error);

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

// GET: Check confirmation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email parameter is required',
        },
        { status: 400 }
      );
    }

    const validatedData = z
      .object({ email: z.string().email() })
      .parse({ email });
    const statusResult = await getSubscriberStatus(validatedData.email);

    if (!statusResult.success) {
      const statusCode =
        statusResult.errorCode === 'rate_limit_exceeded'
          ? 429
          : statusResult.errorCode === 'member_not_found'
            ? 404
            : 500;

      return NextResponse.json(
        {
          success: false,
          error: statusResult.userMessage || statusResult.error,
          details: statusResult.error,
          shouldRetry: statusResult.shouldRetry,
          retryAfter: statusResult.retryAfter,
        },
        {
          status: statusCode,
          headers: statusResult.retryAfter
            ? { 'Retry-After': statusResult.retryAfter.toString() }
            : {},
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved subscription status',
      data: {
        email: validatedData.email,
        status: statusResult.data?.status,
        isConfirmed: statusResult.data?.status === 'subscribed',
        isPending: statusResult.data?.status === 'pending',
        subscriberId: statusResult.data?.subscriberId,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    console.error('Get confirmation status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
