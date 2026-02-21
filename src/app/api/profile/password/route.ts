import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

// Password strength validation
function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, currentPassword, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!userId || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Get current user from database using provided userId
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get user email from auth.users using admin client for password verification
    try {
      const adminClient = getSupabaseAdmin();
      const { data: authUser, error: authError } =
        await adminClient.auth.admin.getUserById(userId);

      if (authError || !authUser.user?.email) {
        return NextResponse.json(
          { error: 'User email not found' },
          { status: 404 }
        );
      }

      const userEmail = authUser.user.email;

      // Verify current password by attempting to sign in
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: currentPassword,
        });

        if (signInError) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 401 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to verify current password' },
          { status: 401 }
        );
      }
    } catch (adminError) {
      console.error('Admin client error during password change:', adminError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    // Update password using admin client for more reliable updates
    try {
      const adminClient = getSupabaseAdmin();
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

      if (updateError) {
        console.error('Password update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password. Please try again.' },
          { status: 500 }
        );
      }
    } catch (adminError) {
      console.error('Admin client error:', adminError);

      // Fallback to regular user update
      try {
        const { error: fallbackError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (fallbackError) {
          throw fallbackError;
        }
      } catch (fallbackError) {
        console.error('Fallback password update error:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        );
      }
    }

    // Log the password change for security tracking
    console.log(
      `Password changed for user ${userId} at ${new Date().toISOString()}`
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check password strength
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const validation = validatePasswordStrength(password);

    // Calculate strength score
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    let strength = 'weak';
    if (score >= 90) strength = 'very-strong';
    else if (score >= 70) strength = 'strong';
    else if (score >= 50) strength = 'medium';

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      strength: strength,
      score: score,
    });
  } catch (error: any) {
    console.error('Password strength check error:', error);
    return NextResponse.json(
      { error: 'Failed to check password strength' },
      { status: 500 }
    );
  }
}
