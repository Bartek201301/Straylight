import { NextRequest, NextResponse } from 'next/server';
import {
  addSubscriberTags,
  updateSubscriberTags,
  TAG_CATEGORIES,
} from '@/lib/mail/mailchimp';
import { logMailchimpError } from '@/lib/mail/mailchimp-errors';

// Mailchimp webhook event types
interface MailchimpWebhookEvent {
  type:
    | 'subscribe'
    | 'unsubscribe'
    | 'profile'
    | 'upemail'
    | 'cleaned'
    | 'campaign';
  fired_at: string;
  data: {
    id: string;
    email: string;
    email_type: string;
    ip_opt?: string;
    ip_signup?: string;
    merges: {
      EMAIL: string;
      FNAME?: string;
      LNAME?: string;
      [key: string]: any;
    };
    list_id: string;
    web_id?: string;
    reason?: string;
  };
}

// Verify webhook authenticity (basic validation)
function verifyWebhookSignature(request: NextRequest): boolean {
  // In production, you should implement proper webhook signature verification
  // using the webhook secret from Mailchimp
  const webhookSecret = process.env.MAILCHIMP_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('MAILCHIMP_WEBHOOK_SECRET not configured');
    return true; // Allow in development
  }

  // Basic validation - in production, implement proper HMAC signature verification
  const userAgent = request.headers.get('user-agent');
  return (
    userAgent?.includes('MailChimp') || userAgent?.includes('Mailchimp') || true
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    if (!verifyWebhookSignature(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized webhook request' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const contentType = request.headers.get('content-type');
    let eventData: MailchimpWebhookEvent;

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Mailchimp sends form-encoded data
      const formData = await request.formData();
      const type = formData.get('type') as string;
      const firedAt = formData.get('fired_at') as string;

      // Parse the data field (JSON string)
      const dataString = formData.get('data') as string;
      const data = JSON.parse(dataString || '{}');

      eventData = {
        type: type as any,
        fired_at: firedAt,
        data,
      };
    } else {
      // Handle JSON payload (less common but possible)
      eventData = await request.json();
    }

    console.log('Received Mailchimp webhook:', {
      type: eventData.type,
      email: eventData.data?.email,
      firedAt: eventData.fired_at,
    });

    // Process different event types
    switch (eventData.type) {
      case 'subscribe':
        await handleSubscribeEvent(eventData);
        break;

      case 'unsubscribe':
        await handleUnsubscribeEvent(eventData);
        break;

      case 'profile':
        await handleProfileUpdateEvent(eventData);
        break;

      case 'cleaned':
        await handleCleanedEvent(eventData);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventData.type}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    console.error('Mailchimp webhook processing error:', error);
    logMailchimpError('webhook', error, {
      headers: Object.fromEntries(request.headers.entries()),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle subscription confirmation events
async function handleSubscribeEvent(event: MailchimpWebhookEvent) {
  try {
    const email = event.data.email || event.data.merges.EMAIL;

    if (!email) {
      console.warn('No email found in subscribe event');
      return;
    }

    console.log(`Processing subscription confirmation for: ${email}`);

    // Add active reader tag and remove new subscriber tag
    await updateSubscriberTags(
      email,
      [TAG_CATEGORIES.ENGAGEMENT.ACTIVE_READER], // Add
      [TAG_CATEGORIES.ENGAGEMENT.NEW_SUBSCRIBER] // Remove
    );

    // You could also trigger other actions here:
    // - Send welcome email
    // - Update user database
    // - Track analytics event
    // - Add to CRM system
  } catch (error) {
    console.error('Error handling subscribe event:', error);
  }
}

// Handle unsubscribe events
async function handleUnsubscribeEvent(event: MailchimpWebhookEvent) {
  try {
    const email = event.data.email || event.data.merges.EMAIL;

    if (!email) {
      console.warn('No email found in unsubscribe event');
      return;
    }

    console.log(`Processing unsubscription for: ${email}`, {
      reason: event.data.reason,
    });

    // Add inactive tag and remove active tags
    await updateSubscriberTags(
      email,
      [TAG_CATEGORIES.ENGAGEMENT.INACTIVE], // Add
      [TAG_CATEGORIES.ENGAGEMENT.ACTIVE_READER, TAG_CATEGORIES.ENGAGEMENT.VIP] // Remove
    );

    // You could also trigger other actions here:
    // - Send feedback survey
    // - Update user database
    // - Track analytics event
  } catch (error) {
    console.error('Error handling unsubscribe event:', error);
  }
}

// Handle profile update events
async function handleProfileUpdateEvent(event: MailchimpWebhookEvent) {
  try {
    const email = event.data.email || event.data.merges.EMAIL;

    if (!email) {
      console.warn('No email found in profile update event');
      return;
    }

    console.log(`Processing profile update for: ${email}`);

    // You could sync profile updates to your database here
    // For now, just log the event
  } catch (error) {
    console.error('Error handling profile update event:', error);
  }
}

// Handle cleaned (bounced/invalid) email events
async function handleCleanedEvent(event: MailchimpWebhookEvent) {
  try {
    const email = event.data.email || event.data.merges.EMAIL;

    if (!email) {
      console.warn('No email found in cleaned event');
      return;
    }

    console.log(`Processing cleaned email for: ${email}`, {
      reason: event.data.reason,
    });

    // Mark as inactive due to bounce/invalid email
    await addSubscriberTags(email, [TAG_CATEGORIES.ENGAGEMENT.INACTIVE]);

    // You could also:
    // - Update user database to mark email as invalid
    // - Remove from other marketing lists
    // - Send notification to admin
  } catch (error) {
    console.error('Error handling cleaned event:', error);
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Method not allowed. This endpoint only accepts POST requests from Mailchimp webhooks.',
    },
    { status: 405 }
  );
}
