import { NextRequest, NextResponse } from 'next/server';
import {
  addSubscriberTags,
  removeSubscriberTags,
  getSubscriberTags,
  updateSubscriberTags,
  validateTags,
} from '@/lib/mail/mailchimp';
import { z } from 'zod';

// Validation schemas
const getTagsSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const addTagsSchema = z.object({
  email: z.string().email('Invalid email address'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

const removeTagsSchema = z.object({
  email: z.string().email('Invalid email address'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
});

const updateTagsSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    tagsToAdd: z.array(z.string()).optional().default([]),
    tagsToRemove: z.array(z.string()).optional().default([]),
  })
  .refine((data) => data.tagsToAdd.length > 0 || data.tagsToRemove.length > 0, {
    message: 'Must specify tags to add or remove',
  });

// GET: Retrieve subscriber tags
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

    const validatedData = getTagsSchema.parse({ email });
    const result = await getSubscriberTags(validatedData.email);

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

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data || {
        email: validatedData.email,
        tags: result.tags,
      },
    });
  } catch (error: any) {
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

    console.error('Get tags error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST: Add tags to subscriber
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addTagsSchema.parse(body);

    // Validate tag format
    const tagValidation = validateTags(validatedData.tags);
    if (!tagValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tag format',
          details: tagValidation.errors,
        },
        { status: 400 }
      );
    }

    const result = await addSubscriberTags(
      validatedData.email,
      validatedData.tags
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

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data || {
        email: validatedData.email,
        tagsAdded: validatedData.tags,
      },
    });
  } catch (error: any) {
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

    console.error('Add tags error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove tags from subscriber
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = removeTagsSchema.parse(body);

    // Validate tag format
    const tagValidation = validateTags(validatedData.tags);
    if (!tagValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tag format',
          details: tagValidation.errors,
        },
        { status: 400 }
      );
    }

    const result = await removeSubscriberTags(
      validatedData.email,
      validatedData.tags
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

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data || {
        email: validatedData.email,
        tagsRemoved: validatedData.tags,
      },
    });
  } catch (error: any) {
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

    console.error('Remove tags error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT: Update subscriber tags (add and remove in one operation)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateTagsSchema.parse(body);

    // Validate tag formats
    const allTags = [...validatedData.tagsToAdd, ...validatedData.tagsToRemove];
    if (allTags.length > 0) {
      const tagValidation = validateTags(allTags);
      if (!tagValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid tag format',
            details: tagValidation.errors,
          },
          { status: 400 }
        );
      }
    }

    const result = await updateSubscriberTags(
      validatedData.email,
      validatedData.tagsToAdd,
      validatedData.tagsToRemove
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

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data || {
        email: validatedData.email,
        tagsAdded: validatedData.tagsToAdd,
        tagsRemoved: validatedData.tagsToRemove,
      },
    });
  } catch (error: any) {
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

    console.error('Update tags error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
