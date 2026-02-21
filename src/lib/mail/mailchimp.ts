import mailchimp from '@mailchimp/mailchimp_marketing';
import {
  parseMailchimpError,
  withRetry,
  validateEmail,
  logMailchimpError,
  type MailchimpResult,
} from './mailchimp-errors';

// Mailchimp configuration interface
interface MailchimpConfig {
  apiKey: string;
  server: string;
  listId: string;
}

// Validate environment variables
function validateMailchimpConfig(): MailchimpConfig {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!apiKey) {
    throw new Error('MAILCHIMP_API_KEY environment variable is required');
  }

  if (!server) {
    throw new Error('MAILCHIMP_SERVER_PREFIX environment variable is required');
  }

  if (!listId) {
    throw new Error('MAILCHIMP_LIST_ID environment variable is required');
  }

  return { apiKey, server, listId };
}

// Initialize Mailchimp client with configuration
function initializeMailchimp(): MailchimpConfig {
  const config = validateMailchimpConfig();

  (mailchimp as any).setConfig({
    apiKey: config.apiKey,
    server: config.server,
  });

  return config;
}

// Test Mailchimp API connection
export async function testMailchimpConnection(): Promise<MailchimpResult> {
  try {
    const config = initializeMailchimp();

    // Test connection by pinging the API with retry logic
    await withRetry(async () => {
      return await mailchimp.ping.get();
    });

    return {
      success: true,
      message: 'Mailchimp connection successful',
      data: {
        status: 'connected',
        server: config.server,
      },
    };
  } catch (error: any) {
    logMailchimpError('testConnection', error);
    const errorResult = parseMailchimpError(error);
    return {
      ...errorResult,
      error: `Connection test failed: ${errorResult.error}`,
    };
  }
}

// Get list information
export async function getListInfo(listId?: string): Promise<MailchimpResult> {
  try {
    const config = initializeMailchimp();
    const targetListId = listId || config.listId;

    const listInfo = await withRetry(async () => {
      return await (mailchimp.lists as any).getList(targetListId);
    });

    return {
      success: true,
      message: 'List information retrieved successfully',
      data: {
        id: listInfo.id,
        name: listInfo.name,
        memberCount: listInfo.stats.member_count,
        subscribeUrlShort: listInfo.subscribe_url_short,
      },
    };
  } catch (error: any) {
    logMailchimpError('getListInfo', error, { listId });
    return parseMailchimpError(error);
  }
}

// Add a subscriber to the newsletter list with single opt-in
export async function addNewsletterSubscriber(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<MailchimpResult & { subscriberId?: string }> {
  try {
    // Validate email format before making API call
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    const config = initializeMailchimp();

    const subscriberData = {
      email_address: email,
      status: 'subscribed' as const,
      merge_fields: {} as any,
    };

    // Add first name if provided
    if (firstName) {
      subscriberData.merge_fields.FNAME = firstName;
    }

    // Add last name if provided
    if (lastName) {
      subscriberData.merge_fields.LNAME = lastName;
    }

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).addListMember(
        config.listId,
        subscriberData
      );
    });

    return {
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: {
        email,
        subscriberId: response.id,
        status: 'subscribed',
      },
      subscriberId: response.id,
    };
  } catch (error: any) {
    logMailchimpError('addNewsletterSubscriber', error, {
      email,
      firstName,
      lastName,
    });

    const errorResult = parseMailchimpError(error);

    // Handle the special case where member already exists as a success
    if (errorResult.errorCode === 'member_exists') {
      return {
        success: true,
        message: 'Email is already subscribed to the newsletter',
        data: { email, status: 'subscribed' },
      };
    }

    return errorResult;
  }
}

// Add a subscriber with double opt-in (pending status)
export async function addNewsletterSubscriberDoubleOptin(
  email: string,
  firstName?: string,
  lastName?: string
): Promise<MailchimpResult & { subscriberId?: string }> {
  try {
    // Validate email format before making API call
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    const config = initializeMailchimp();

    const subscriberData = {
      email_address: email,
      status: 'pending' as const, // Requires confirmation
      merge_fields: {} as any,
    };

    // Add first name if provided
    if (firstName) {
      subscriberData.merge_fields.FNAME = firstName;
    }

    // Add last name if provided
    if (lastName) {
      subscriberData.merge_fields.LNAME = lastName;
    }

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).addListMember(
        config.listId,
        subscriberData
      );
    });

    return {
      success: true,
      message: 'Please check your email to confirm your subscription',
      data: {
        email,
        subscriberId: response.id,
        status: 'pending',
        confirmationRequired: true,
      },
      subscriberId: response.id,
    };
  } catch (error: any) {
    logMailchimpError('addNewsletterSubscriberDoubleOptin', error, {
      email,
      firstName,
      lastName,
    });

    const errorResult = parseMailchimpError(error);

    // Handle the special case where member already exists
    if (errorResult.errorCode === 'member_exists') {
      // Check current status of the member
      try {
        const memberStatus = await getSubscriberStatus(email);
        if (
          memberStatus.success &&
          memberStatus.data?.status === 'subscribed'
        ) {
          return {
            success: true,
            message: 'Email is already subscribed to the newsletter',
            data: { email, status: 'subscribed' },
          };
        } else if (
          memberStatus.success &&
          memberStatus.data?.status === 'pending'
        ) {
          return {
            success: true,
            message:
              'Confirmation email already sent. Please check your email.',
            data: { email, status: 'pending', confirmationRequired: true },
          };
        }
      } catch (statusError) {
        console.warn('Failed to check member status:', statusError);
      }

      return {
        success: true,
        message: 'Email is already in our newsletter list',
        data: { email },
      };
    }

    return errorResult;
  }
}

// Get subscriber status and information
export async function getSubscriberStatus(
  email: string
): Promise<
  MailchimpResult & { data?: { status: string; subscriberId?: string } }
> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).getListMember(
        config.listId,
        subscriberHash
      );
    });

    return {
      success: true,
      message: 'Successfully retrieved subscriber status',
      data: {
        email,
        status: response.status,
        subscriberId: response.id,
        firstName: response.merge_fields?.FNAME,
        lastName: response.merge_fields?.LNAME,
        subscribeDate: response.timestamp_opt,
      },
    };
  } catch (error: any) {
    logMailchimpError('getSubscriberStatus', error, { email });
    return parseMailchimpError(error);
  }
}

// Update subscriber status (for confirming pending subscriptions)
export async function updateSubscriberStatus(
  email: string,
  status: 'subscribed' | 'unsubscribed' | 'pending'
): Promise<MailchimpResult> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const updateData = {
      status: status,
    };

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).updateListMember(
        config.listId,
        subscriberHash,
        updateData
      );
    });

    return {
      success: true,
      message: `Successfully updated subscription status to ${status}`,
      data: {
        email,
        status: response.status,
        subscriberId: response.id,
      },
    };
  } catch (error: any) {
    logMailchimpError('updateSubscriberStatus', error, { email, status });
    return parseMailchimpError(error);
  }
}

// Tag management functions
export async function addSubscriberTags(
  email: string,
  tags: string[]
): Promise<MailchimpResult> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    // Validate tags
    const tagValidation = validateTags(tags);
    if (!tagValidation.valid) {
      return {
        success: false,
        error: 'Invalid tag format',
        userMessage: 'Please check your tag format and try again.',
        shouldRetry: false,
        errorCode: 'validation_error',
      };
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash (required by Mailchimp API)
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    // Format tags for Mailchimp API
    const tagData = {
      tags: tags.map((tag) => ({
        name: tag,
        status: 'active' as const,
      })),
    };

    await withRetry(async () => {
      return await (mailchimp.lists as any).updateListMemberTags(
        config.listId,
        subscriberHash,
        tagData
      );
    });

    return {
      success: true,
      message: `Successfully added tags: ${tags.join(', ')}`,
      data: { email, tags },
    };
  } catch (error: any) {
    logMailchimpError('addSubscriberTags', error, { email, tags });
    return parseMailchimpError(error);
  }
}

export async function removeSubscriberTags(
  email: string,
  tags: string[]
): Promise<MailchimpResult> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    // Validate tags
    const tagValidation = validateTags(tags);
    if (!tagValidation.valid) {
      return {
        success: false,
        error: 'Invalid tag format',
        userMessage: 'Please check your tag format and try again.',
        shouldRetry: false,
        errorCode: 'validation_error',
      };
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    // Format tags for removal
    const tagData = {
      tags: tags.map((tag) => ({
        name: tag,
        status: 'inactive' as const,
      })),
    };

    await withRetry(async () => {
      return await (mailchimp.lists as any).updateListMemberTags(
        config.listId,
        subscriberHash,
        tagData
      );
    });

    return {
      success: true,
      message: `Successfully removed tags: ${tags.join(', ')}`,
      data: { email, tags },
    };
  } catch (error: any) {
    logMailchimpError('removeSubscriberTags', error, { email, tags });
    return parseMailchimpError(error);
  }
}

export async function getSubscriberTags(
  email: string
): Promise<MailchimpResult & { tags?: string[] }> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).getListMemberTags(
        config.listId,
        subscriberHash
      );
    });

    const activeTags = response.tags
      .filter((tag: any) => tag.name) // Only include tags with names
      .map((tag: any) => tag.name);

    return {
      success: true,
      message: 'Successfully retrieved subscriber tags',
      data: { email, tags: activeTags },
      tags: activeTags,
    };
  } catch (error: any) {
    logMailchimpError('getSubscriberTags', error, { email });
    return parseMailchimpError(error);
  }
}

export async function updateSubscriberTags(
  email: string,
  tagsToAdd: string[] = [],
  tagsToRemove: string[] = []
): Promise<MailchimpResult> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    // Validate all tags
    const allTags = [...tagsToAdd, ...tagsToRemove];
    if (allTags.length > 0) {
      const tagValidation = validateTags(allTags);
      if (!tagValidation.valid) {
        return {
          success: false,
          error: 'Invalid tag format',
          userMessage: 'Please check your tag format and try again.',
          shouldRetry: false,
          errorCode: 'validation_error',
        };
      }
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    // Combine add and remove operations
    const tagData = {
      tags: [
        ...tagsToAdd.map((tag) => ({
          name: tag,
          status: 'active' as const,
        })),
        ...tagsToRemove.map((tag) => ({
          name: tag,
          status: 'inactive' as const,
        })),
      ],
    };

    await withRetry(async () => {
      return await (mailchimp.lists as any).updateListMemberTags(
        config.listId,
        subscriberHash,
        tagData
      );
    });

    const operations = [];
    if (tagsToAdd.length > 0) operations.push(`added: ${tagsToAdd.join(', ')}`);
    if (tagsToRemove.length > 0)
      operations.push(`removed: ${tagsToRemove.join(', ')}`);

    return {
      success: true,
      message: `Successfully updated tags (${operations.join('; ')})`,
      data: { email, tagsToAdd, tagsToRemove },
    };
  } catch (error: any) {
    logMailchimpError('updateSubscriberTags', error, {
      email,
      tagsToAdd,
      tagsToRemove,
    });
    return parseMailchimpError(error);
  }
}

// Predefined tag categories for common use cases
export const TAG_CATEGORIES = {
  INTERESTS: {
    TECH: 'tech',
    DESIGN: 'design',
    BUSINESS: 'business',
    MARKETING: 'marketing',
    DEVELOPMENT: 'development',
  },
  ENGAGEMENT: {
    NEW_SUBSCRIBER: 'new-subscriber',
    ACTIVE_READER: 'active-reader',
    VIP: 'vip',
    INACTIVE: 'inactive',
  },
  CONTENT_PREFERENCES: {
    TUTORIALS: 'tutorials',
    NEWS: 'news',
    CASE_STUDIES: 'case-studies',
    ANNOUNCEMENTS: 'announcements',
  },
} as const;

// Helper function to validate tags
export function validateTags(tags: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(tags)) {
    errors.push('Tags must be an array');
    return { valid: false, errors };
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      errors.push('All tags must be strings');
    } else if (tag.length === 0) {
      errors.push('Tags cannot be empty');
    } else if (tag.length > 50) {
      errors.push('Tags cannot be longer than 50 characters');
    } else if (!/^[a-zA-Z0-9\-_\s]+$/.test(tag)) {
      errors.push(
        'Tags can only contain letters, numbers, hyphens, underscores, and spaces'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Configure list settings for double opt-in
export async function configureListDoubleOptin(
  listId?: string,
  enableDoubleOptin: boolean = true
): Promise<MailchimpResult> {
  try {
    const config = initializeMailchimp();
    const targetListId = listId || config.listId;

    const updateData = {
      double_optin: enableDoubleOptin,
      has_welcome: true, // Send welcome email after confirmation
    };

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).updateList(
        targetListId,
        updateData
      );
    });

    return {
      success: true,
      message: `Successfully ${enableDoubleOptin ? 'enabled' : 'disabled'} double opt-in for list`,
      data: {
        listId: targetListId,
        doubleOptin: response.double_optin,
        hasWelcome: response.has_welcome,
      },
    };
  } catch (error: any) {
    logMailchimpError('configureListDoubleOptin', error, {
      listId,
      enableDoubleOptin,
    });
    return parseMailchimpError(error);
  }
}

// Get list double opt-in configuration
export async function getListConfiguration(
  listId?: string
): Promise<MailchimpResult> {
  try {
    const config = initializeMailchimp();
    const targetListId = listId || config.listId;

    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).getList(targetListId);
    });

    return {
      success: true,
      message: 'Successfully retrieved list configuration',
      data: {
        listId: targetListId,
        name: response.name,
        doubleOptin: response.double_optin,
        hasWelcome: response.has_welcome,
        memberCount: response.stats?.member_count,
        subscribeUrlShort: response.subscribe_url_short,
        defaultFromName: response.default_from_name,
        defaultFromEmail: response.default_from_email,
        defaultSubject: response.default_subject,
        defaultLanguage: response.default_language,
      },
    };
  } catch (error: any) {
    logMailchimpError('getListConfiguration', error, { listId });
    return parseMailchimpError(error);
  }
}

// Resend confirmation email for pending subscriber
export async function resendConfirmationEmail(
  email: string
): Promise<MailchimpResult> {
  try {
    // Validate email format
    if (!validateEmail(email)) {
      return {
        success: false,
        error: 'Invalid email format',
        userMessage: 'Please enter a valid email address.',
        shouldRetry: false,
        errorCode: 'invalid_email',
      };
    }

    // First check if subscriber exists and is pending
    const statusResult = await getSubscriberStatus(email);

    if (!statusResult.success) {
      return statusResult;
    }

    if (statusResult.data?.status !== 'pending') {
      return {
        success: false,
        error: `Cannot resend confirmation. Current status: ${statusResult.data?.status}`,
        userMessage:
          'Confirmation email can only be sent to pending subscriptions.',
        shouldRetry: false,
        errorCode: 'validation_error',
      };
    }

    const config = initializeMailchimp();

    // Convert email to MD5 hash
    const crypto = require('crypto');
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    // Trigger resend of confirmation email by updating with same status
    const response = await withRetry(async () => {
      return await (mailchimp.lists as any).updateListMember(
        config.listId,
        subscriberHash,
        { status: 'pending' }
      );
    });

    return {
      success: true,
      message: 'Confirmation email has been resent. Please check your inbox.',
      data: {
        email,
        status: response.status,
        subscriberId: response.id,
      },
    };
  } catch (error: any) {
    logMailchimpError('resendConfirmationEmail', error, { email });
    return parseMailchimpError(error);
  }
}
