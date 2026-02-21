import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Request validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const { email } = forgotPasswordSchema.parse(body);

    // Rate limiting could be implemented here
    // For now, we'll rely on Supabase's built-in rate limiting

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);

      // Don't reveal whether the email exists or not for security
      // Always return success to prevent email enumeration attacks
      return NextResponse.json(
        {
          message:
            'If an account with that email exists, we have sent password reset instructions.',
          success: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Password reset instructions have been sent to your email.',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password API error:', error);

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

    // Always return success to prevent email enumeration attacks
    return NextResponse.json(
      {
        message:
          'If an account with that email exists, we have sent password reset instructions.',
        success: true,
      },
      { status: 200 }
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
