import { NextRequest, NextResponse } from 'next/server';
import { resendConfirmationEmail } from '@/lib/mail/mailchimp';
import { z } from 'zod';

// Validation schema for resending confirmation email
const resendConfirmationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = resendConfirmationSchema.parse(body);

    // Resend confirmation email
    const result = await resendConfirmationEmail(validatedData.email);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'rate_limit_exceeded'
          ? 429
          : result.errorCode === 'invalid_email'
            ? 400
            : result.errorCode === 'member_not_found'
              ? 404
              : result.errorCode === 'validation_error'
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

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data || {
        email: validatedData.email,
        status: 'pending',
        confirmationResent: true,
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

    console.error('Resend confirmation error:', error);

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
      error: 'Method not allowed. Use POST to resend confirmation email.',
    },
    { status: 405 }
  );
}
