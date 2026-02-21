// @ts-ignore - Deno imports work in runtime but not in IDE
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - Deno imports work in runtime but not in IDE
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

// Type declarations for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface EmailNotification {
  id: string;
  notification_id: string;
  recipient_email: string;
  subject: string;
  html_content: string;
  text_content: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  max_attempts: number;
  last_error?: string;
  scheduled_at: string;
}

interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend API
 * You can replace this with your preferred email service
 */
async function sendEmail(emailData: SendEmailRequest): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') || 'noreply@straylight.app',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Email service error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Process a single email notification
 */
async function processEmailNotification(
  supabase: any,
  emailNotification: EmailNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Processing email notification ${emailNotification.id}`);

    // Send the email
    await sendEmail({
      to: emailNotification.recipient_email,
      subject: emailNotification.subject,
      html: emailNotification.html_content,
      text: emailNotification.text_content,
    });

    // Update status to sent
    const { error: updateError } = await supabase
      .from('email_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailNotification.id);

    if (updateError) {
      console.error('Failed to update email notification status:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Email notification ${emailNotification.id} sent successfully`);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      `Failed to process email notification ${emailNotification.id}:`,
      errorMessage
    );

    // Update status and increment attempt count
    const newAttempts = emailNotification.attempts + 1;
    const newStatus =
      newAttempts >= emailNotification.max_attempts ? 'failed' : 'retrying';

    const { error: updateError } = await supabase
      .from('email_notifications')
      .update({
        status: newStatus,
        attempts: newAttempts,
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
        // Schedule retry for later if not max attempts reached
        ...(newStatus === 'retrying' && {
          scheduled_at: new Date(
            Date.now() + newAttempts * 5 * 60 * 1000
          ).toISOString(), // Exponential backoff: 5min, 10min, 15min
        }),
      })
      .eq('id', emailNotification.id);

    if (updateError) {
      console.error('Failed to update failed email notification:', updateError);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Main function to process pending email notifications
 */
async function processPendingEmails(supabase: any): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get pending email notifications
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_notifications')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('Failed to fetch pending emails:', fetchError);
      results.errors.push(`Fetch error: ${fetchError.message}`);
      return results;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No pending email notifications to process');
      return results;
    }

    console.log(
      `Processing ${pendingEmails.length} pending email notifications`
    );

    // Process each email notification
    for (const emailNotification of pendingEmails) {
      results.processed++;

      const result = await processEmailNotification(
        supabase,
        emailNotification
      );

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${emailNotification.id}: ${result.error}`);
        }
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`Email processing complete:`, results);
    return results;
  } catch (error) {
    console.error('Unexpected error in processPendingEmails:', error);
    results.errors.push(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return results;
  }
}

/**
 * Test email sending functionality
 */
async function testEmailSending(
  supabase: any,
  testEmail: string
): Promise<any> {
  try {
    console.log(`Sending test email to ${testEmail}`);

    const testEmailData = {
      to: testEmail,
      subject: 'StrayLight Notification System Test',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the StrayLight notification system.</p>
        <p>If you receive this email, the email notification system is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    };

    await sendEmail(testEmailData);

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Test email failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Edge function handler
 */
serve(async (req: Request) => {
  // CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'process';

    let responseData: any;

    switch (action) {
      case 'process':
        // Process pending email notifications (default action)
        responseData = await processPendingEmails(supabase);
        break;

      case 'test':
        // Test email sending
        const testEmail = url.searchParams.get('email');
        if (!testEmail) {
          return new Response(
            JSON.stringify({ error: 'Email parameter required for test' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        responseData = await testEmailSending(supabase, testEmail);
        break;

      case 'status':
        // Get email notification status
        const { data: stats, error: statsError } = await supabase
          .from('email_notifications')
          .select('status')
          .then(({ data, error }: { data: any; error: any }) => {
            if (error) return { data: null, error };

            const statusCounts =
              data?.reduce((acc: any, email: any) => {
                acc[email.status] = (acc[email.status] || 0) + 1;
                return acc;
              }, {}) || {};

            return { data: statusCounts, error: null };
          });

        if (statsError) {
          throw statsError;
        }

        responseData = {
          email_stats: stats,
          timestamp: new Date().toISOString(),
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action. Use: process, test, or status',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Optional: Health check endpoint
console.log('Email notification service started');
