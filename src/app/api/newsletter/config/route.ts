import { NextRequest, NextResponse } from 'next/server';
import {
  configureListDoubleOptin,
  getListConfiguration,
} from '@/lib/mail/mailchimp';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema for list configuration
const configureListSchema = z.object({
  enableDoubleOptin: z.boolean(),
  listId: z.string().optional(),
});

// GET: Get current list configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    const result = await getListConfiguration(listId || undefined);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'rate_limit_exceeded'
          ? 429
          : result.errorCode === 'list_not_found'
            ? 404
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
      data: result.data,
    });
  } catch (error: any) {
    console.error('Get list configuration error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT: Update list configuration
export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = configureListSchema.parse(body);

    // Configure double opt-in setting
    const result = await configureListDoubleOptin(
      validatedData.listId,
      validatedData.enableDoubleOptin
    );

    if (!result.success) {
      const statusCode =
        result.errorCode === 'rate_limit_exceeded'
          ? 429
          : result.errorCode === 'list_not_found'
            ? 404
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
      data: result.data,
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

    console.error('Configure list error:', error);

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
