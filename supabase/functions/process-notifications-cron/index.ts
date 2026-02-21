// @ts-ignore - Deno imports work in runtime but not in IDE
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Deno imports work in runtime but not in IDE
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type declarations for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Helper functions
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  return null;
}

function createErrorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message, success: false }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify({ ...data, success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function getSupabaseServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Cron job function to automatically process email notifications
 * This should be called by a cron service (like GitHub Actions, Vercel Cron, or Supabase Cron)
 * every few minutes to process pending email notifications
 */
serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = getSupabaseServiceClient();

    // Verify this is a valid cron request (optional security check)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');

    if (expectedSecret && cronSecret !== expectedSecret) {
      console.warn('Invalid cron secret provided');
      return createErrorResponse('Unauthorized', 401);
    }

    console.log('Starting notification processing cron job...');

    // Call the email notification processor
    const emailProcessorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notifications?action=process`;

    const emailResponse = await fetch(emailProcessorUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    const emailResults = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(
        `Email processor error: ${emailResults.error || 'Unknown error'}`
      );
    }

    // Clean up old notifications (archive notifications older than 30 days)
    const cleanupResult = await supabase.rpc('cleanup_old_notifications', {
      days_to_keep: 30,
    });

    if (cleanupResult.error) {
      console.warn('Failed to cleanup old notifications:', cleanupResult.error);
    } else {
      console.log(`Cleaned up ${cleanupResult.data || 0} old notifications`);
    }

    // Clean up old email notifications (delete processed emails older than 7 days)
    const { error: emailCleanupError } = await supabase
      .from('email_notifications')
      .delete()
      .in('status', ['sent', 'failed'])
      .lt(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (emailCleanupError) {
      console.warn(
        'Failed to cleanup old email notifications:',
        emailCleanupError
      );
    }

    // Log processing results
    console.log('Cron job completed:', {
      emailProcessing: emailResults,
      notificationCleanup: cleanupResult.data || 0,
    });

    return createSuccessResponse({
      message: 'Notification processing completed successfully',
      emailProcessing: emailResults,
      notificationCleanup: cleanupResult.data || 0,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
});

console.log('Notification processing cron job function started');
