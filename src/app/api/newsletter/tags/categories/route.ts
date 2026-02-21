import { NextResponse } from 'next/server';
import { TAG_CATEGORIES } from '@/lib/mail/mailchimp';

// GET: Get available tag categories
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Tag categories retrieved successfully',
      data: {
        categories: TAG_CATEGORIES,
        description: {
          INTERESTS: 'Tags related to subscriber interests and topics',
          ENGAGEMENT: 'Tags related to subscriber engagement level',
          CONTENT_PREFERENCES: 'Tags related to content type preferences',
        },
      },
    });
  } catch (error: any) {
    console.error('Get tag categories error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
