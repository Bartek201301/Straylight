import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface ErrorLog {
  name: string;
  type: string;
  severity: string;
  category: string;
  userMessage: string;
  technicalMessage: string;
  metadata: {
    originalError?: Error;
    statusCode?: number;
    context?: Record<string, any>;
    timestamp: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
  };
  suggestedActions: Array<{
    id: string;
    label: string;
    type: string;
    isRetry?: boolean;
  }>;
  isRetryable: boolean;
  retryAfter?: number;
}

export async function POST(request: NextRequest) {
  try {
    const errorLog: ErrorLog = await request.json();

    // Get client info from headers
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const clientIP =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    // Enhanced error log with client context
    const enhancedLog = {
      ...errorLog,
      clientInfo: {
        userAgent,
        clientIP,
        timestamp: new Date().toISOString(),
        url: request.url,
        method: request.method,
      },
    };

    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error Log:', JSON.stringify(enhancedLog, null, 2));
      return NextResponse.json({ status: 'logged' });
    }

    // In production, you would typically send to an error tracking service
    // Examples:
    // - Sentry: Sentry.captureException(errorLog)
    // - DataDog: logger.error('Client error', enhancedLog)
    // - Custom logging service: await logService.log(enhancedLog)

    // For now, we'll just log to server console
    console.error(
      'Production Error Log:',
      JSON.stringify(enhancedLog, null, 2)
    );

    // You might also want to store critical errors in database
    if (errorLog.severity === 'critical' || errorLog.severity === 'high') {
      // await storeErrorInDatabase(enhancedLog);
    }

    return NextResponse.json({
      status: 'logged',
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  } catch (error) {
    console.error('Failed to process error log:', error);

    // Don't fail the client request even if logging fails
    return NextResponse.json(
      {
        status: 'failed',
        message: 'Logging failed but request processed',
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve recent error logs for debugging
export async function GET(_request: NextRequest) {
  // Only allow in development or for admin users
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  // In a real implementation, you'd retrieve from your logging service/database
  return NextResponse.json({
    message: 'Error logs would be retrieved from logging service',
    logs: [],
  });
}
