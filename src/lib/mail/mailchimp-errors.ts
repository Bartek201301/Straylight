// Mailchimp API error handling utilities

interface _MailchimpError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export interface ErrorHandlingResult {
  success: false;
  error: string;
  userMessage: string;
  shouldRetry: boolean;
  retryAfter?: number;
  errorCode?: string;
}

export interface SuccessResult {
  success: true;
  data?: any;
  message: string;
}

export type MailchimpResult = ErrorHandlingResult | SuccessResult;

// Common Mailchimp error types and their handling
const MAILCHIMP_ERROR_TYPES = {
  RATE_LIMIT: 'rate_limit_exceeded',
  INVALID_EMAIL: 'invalid_email',
  MEMBER_EXISTS: 'member_exists',
  LIST_NOT_FOUND: 'list_not_found',
  MEMBER_NOT_FOUND: 'member_not_found',
  INVALID_API_KEY: 'invalid_api_key',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  VALIDATION_ERROR: 'validation_error',
  SERVER_ERROR: 'server_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

// User-friendly error messages
const USER_ERROR_MESSAGES = {
  [MAILCHIMP_ERROR_TYPES.RATE_LIMIT]:
    'Too many requests. Please try again in a few minutes.',
  [MAILCHIMP_ERROR_TYPES.INVALID_EMAIL]: 'Please enter a valid email address.',
  [MAILCHIMP_ERROR_TYPES.MEMBER_EXISTS]:
    'This email is already subscribed to our newsletter.',
  [MAILCHIMP_ERROR_TYPES.LIST_NOT_FOUND]:
    'Newsletter service is temporarily unavailable.',
  [MAILCHIMP_ERROR_TYPES.MEMBER_NOT_FOUND]:
    'Email address not found in our newsletter list.',
  [MAILCHIMP_ERROR_TYPES.INVALID_API_KEY]:
    'Newsletter service configuration error.',
  [MAILCHIMP_ERROR_TYPES.NETWORK_ERROR]:
    'Unable to connect to newsletter service. Please try again.',
  [MAILCHIMP_ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
  [MAILCHIMP_ERROR_TYPES.VALIDATION_ERROR]:
    'Please check your input and try again.',
  [MAILCHIMP_ERROR_TYPES.SERVER_ERROR]:
    'Newsletter service is temporarily unavailable.',
  [MAILCHIMP_ERROR_TYPES.UNKNOWN_ERROR]:
    'An unexpected error occurred. Please try again.',
} as const;

// Parse and categorize Mailchimp API errors
export function parseMailchimpError(error: any): ErrorHandlingResult {
  console.error('Mailchimp API Error:', {
    message: error.message,
    status: error.status,
    response: error.response?.body,
    stack: error.stack,
  });

  // Handle rate limiting
  if (error.status === 429) {
    const retryAfter = parseInt(error.response?.headers?.['retry-after']) || 60;
    return {
      success: false,
      error: 'Rate limit exceeded',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.RATE_LIMIT],
      shouldRetry: true,
      retryAfter,
      errorCode: MAILCHIMP_ERROR_TYPES.RATE_LIMIT,
    };
  }

  // Handle authentication errors
  if (error.status === 401) {
    return {
      success: false,
      error: 'Invalid API key or authentication failed',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.INVALID_API_KEY],
      shouldRetry: false,
      errorCode: MAILCHIMP_ERROR_TYPES.INVALID_API_KEY,
    };
  }

  // Handle validation errors (400)
  if (error.status === 400) {
    const responseBody = error.response?.body;

    // Member already exists
    if (responseBody?.title === 'Member Exists') {
      return {
        success: false,
        error: 'Member already exists',
        userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.MEMBER_EXISTS],
        shouldRetry: false,
        errorCode: MAILCHIMP_ERROR_TYPES.MEMBER_EXISTS,
      };
    }

    // Invalid email format
    if (
      responseBody?.detail?.includes('email') ||
      responseBody?.title?.includes('Invalid')
    ) {
      return {
        success: false,
        error: 'Invalid email address',
        userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.INVALID_EMAIL],
        shouldRetry: false,
        errorCode: MAILCHIMP_ERROR_TYPES.INVALID_EMAIL,
      };
    }

    // General validation error
    return {
      success: false,
      error: responseBody?.detail || 'Validation error',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.VALIDATION_ERROR],
      shouldRetry: false,
      errorCode: MAILCHIMP_ERROR_TYPES.VALIDATION_ERROR,
    };
  }

  // Handle not found errors (404)
  if (error.status === 404) {
    const responseBody = error.response?.body;

    if (
      responseBody?.title?.includes('Resource Not Found') ||
      responseBody?.detail?.includes('list')
    ) {
      return {
        success: false,
        error: 'List not found',
        userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.LIST_NOT_FOUND],
        shouldRetry: false,
        errorCode: MAILCHIMP_ERROR_TYPES.LIST_NOT_FOUND,
      };
    }

    return {
      success: false,
      error: 'Member not found',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.MEMBER_NOT_FOUND],
      shouldRetry: false,
      errorCode: MAILCHIMP_ERROR_TYPES.MEMBER_NOT_FOUND,
    };
  }

  // Handle server errors (5xx)
  if (error.status >= 500) {
    return {
      success: false,
      error: 'Mailchimp server error',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.SERVER_ERROR],
      shouldRetry: true,
      errorCode: MAILCHIMP_ERROR_TYPES.SERVER_ERROR,
    };
  }

  // Handle network/timeout errors
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT'
  ) {
    return {
      success: false,
      error: 'Network connection error',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.NETWORK_ERROR],
      shouldRetry: true,
      errorCode: MAILCHIMP_ERROR_TYPES.NETWORK_ERROR,
    };
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
    return {
      success: false,
      error: 'Request timeout',
      userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.TIMEOUT],
      shouldRetry: true,
      errorCode: MAILCHIMP_ERROR_TYPES.TIMEOUT,
    };
  }

  // Default unknown error
  return {
    success: false,
    error: error.message || 'Unknown error occurred',
    userMessage: USER_ERROR_MESSAGES[MAILCHIMP_ERROR_TYPES.UNKNOWN_ERROR],
    shouldRetry: false,
    errorCode: MAILCHIMP_ERROR_TYPES.UNKNOWN_ERROR,
  };
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const errorResult = parseMailchimpError(error);

      // Don't retry if the error shouldn't be retried
      if (!errorResult.shouldRetry || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = errorResult.retryAfter
        ? errorResult.retryAfter * 1000
        : baseDelay * Math.pow(2, attempt);

      console.warn(
        `Mailchimp API call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
        {
          error: errorResult.error,
          shouldRetry: errorResult.shouldRetry,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Validate email format client-side before API calls
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Log errors for monitoring
export function logMailchimpError(
  operation: string,
  error: any,
  context?: any
): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    operation,
    error: {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.constructor.name,
    },
    context,
  };

  // In production, this would go to a logging service
  console.error('[Mailchimp Error]', errorInfo);

  // You could add integration with error monitoring services here
  // e.g., Sentry, DataDog, etc.
}
