import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Request validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
    accessToken: z.string().optional(), // For additional verification if needed
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const { password, accessToken } = resetPasswordSchema.parse(body);

    // Get the current session from the request headers or body
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || accessToken;

    if (!token) {
      return NextResponse.json(
        {
          error: 'No valid session found. Please request a new password reset.',
          success: false,
        },
        { status: 401 }
      );
    }

    // Set the session for this request
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser(token);

    if (sessionError || !user) {
      return NextResponse.json(
        {
          error:
            'Invalid or expired reset token. Please request a new password reset.',
          success: false,
        },
        { status: 401 }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update password. Please try again.',
          success: false,
        },
        { status: 500 }
      );
    }

    // Log the successful password reset
    console.log(`Password successfully reset for user: ${user.email}`);

    return NextResponse.json(
      {
        message: 'Password has been successfully updated.',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
          success: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        success: false,
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
