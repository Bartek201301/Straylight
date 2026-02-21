import { NextResponse } from 'next/server';
import { testMailchimpConnection, getListInfo } from '@/lib/mail/mailchimp';

// Test Mailchimp API connection
export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await testMailchimpConnection();

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: connectionTest.userMessage || connectionTest.error,
          details: connectionTest.error,
          shouldRetry: connectionTest.shouldRetry,
        },
        {
          status:
            connectionTest.errorCode === 'rate_limit_exceeded' ? 429 : 500,
        }
      );
    }

    // Test list access
    const listTest = await getListInfo();

    if (!listTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: listTest.userMessage || listTest.error,
          details: listTest.error,
          shouldRetry: listTest.shouldRetry,
        },
        { status: listTest.errorCode === 'rate_limit_exceeded' ? 429 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mailchimp API connection successful',
      data: {
        account: connectionTest.data,
        list: listTest.data,
      },
    });
  } catch (error: any) {
    console.error('Mailchimp test error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test Mailchimp connection',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
