/**
 * Error message classification and user-friendly messaging system
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'success';
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'validation'
  | 'authorization'
  | 'server'
  | 'client'
  | 'database'
  | 'external';

export interface ErrorContext {
  action?: string; // What the user was trying to do
  resource?: string; // What resource was involved
  location?: string; // Where the error occurred
  userId?: string; // User identifier for logging
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ErrorSuggestion {
  action: string;
  description: string;
  priority: 'primary' | 'secondary';
  type: 'retry' | 'navigation' | 'contact' | 'documentation' | 'settings';
  link?: string;
}

export interface UserFriendlyError {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  title: string;
  message: string;
  technicalMessage?: string;
  suggestions: ErrorSuggestion[];
  isRetryable: boolean;
  shouldLog: boolean;
  context?: ErrorContext;
}

/**
 * Error classification patterns
 */
const ERROR_PATTERNS = {
  // Network errors
  NETWORK_TIMEOUT: /timeout|timed out/i,
  NETWORK_OFFLINE: /offline|network|connection/i,
  NETWORK_REFUSED: /refused|ECONNREFUSED/i,

  // Authentication errors
  AUTH_EXPIRED: /expired|session|token/i,
  AUTH_INVALID: /invalid.*credentials|unauthorized|401/i,
  AUTH_REQUIRED: /authentication.*required|login.*required/i,

  // Validation errors
  VALIDATION_REQUIRED: /required|missing/i,
  VALIDATION_FORMAT: /format|invalid.*format|pattern/i,
  VALIDATION_LENGTH: /length|too.*long|too.*short/i,

  // Server errors
  SERVER_ERROR: /500|internal.*server|server.*error/i,
  SERVER_OVERLOAD: /503|service.*unavailable|server.*busy/i,
  SERVER_GATEWAY: /502|bad.*gateway|504|gateway.*timeout/i,

  // Database errors
  DATABASE_CONNECTION: /database.*connection|db.*connection/i,
  DATABASE_CONSTRAINT: /constraint|duplicate|unique/i,
  DATABASE_QUERY: /query|sql/i,

  // Rate limiting
  RATE_LIMIT: /429|too.*many.*requests|rate.*limit/i,

  // File/Upload errors
  FILE_SIZE: /file.*size|too.*large|size.*limit/i,
  FILE_TYPE: /file.*type|unsupported.*format|invalid.*file/i,

  // External service errors
  EXTERNAL_API: /api.*error|external.*service|third.*party/i,
};

/**
 * Classify error based on patterns and context
 */
function classifyError(
  error: Error | string,
  _context?: ErrorContext
): {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
} {
  const message = typeof error === 'string' ? error : error.message;
  const errorString = message.toLowerCase();

  // Network errors
  if (
    ERROR_PATTERNS.NETWORK_TIMEOUT.test(errorString) ||
    ERROR_PATTERNS.NETWORK_OFFLINE.test(errorString) ||
    ERROR_PATTERNS.NETWORK_REFUSED.test(errorString)
  ) {
    return { category: 'network', severity: 'error', isRetryable: true };
  }

  // Authentication errors
  if (ERROR_PATTERNS.AUTH_EXPIRED.test(errorString)) {
    return {
      category: 'authentication',
      severity: 'warning',
      isRetryable: false,
    };
  }
  if (
    ERROR_PATTERNS.AUTH_INVALID.test(errorString) ||
    ERROR_PATTERNS.AUTH_REQUIRED.test(errorString)
  ) {
    return {
      category: 'authentication',
      severity: 'error',
      isRetryable: false,
    };
  }

  // Validation errors
  if (
    ERROR_PATTERNS.VALIDATION_REQUIRED.test(errorString) ||
    ERROR_PATTERNS.VALIDATION_FORMAT.test(errorString) ||
    ERROR_PATTERNS.VALIDATION_LENGTH.test(errorString)
  ) {
    return { category: 'validation', severity: 'error', isRetryable: false };
  }

  // Server errors
  if (ERROR_PATTERNS.SERVER_ERROR.test(errorString)) {
    return { category: 'server', severity: 'error', isRetryable: true };
  }
  if (ERROR_PATTERNS.SERVER_OVERLOAD.test(errorString)) {
    return { category: 'server', severity: 'warning', isRetryable: true };
  }
  if (ERROR_PATTERNS.SERVER_GATEWAY.test(errorString)) {
    return { category: 'server', severity: 'error', isRetryable: true };
  }

  // Database errors
  if (
    ERROR_PATTERNS.DATABASE_CONNECTION.test(errorString) ||
    ERROR_PATTERNS.DATABASE_QUERY.test(errorString)
  ) {
    return { category: 'database', severity: 'error', isRetryable: true };
  }
  if (ERROR_PATTERNS.DATABASE_CONSTRAINT.test(errorString)) {
    return { category: 'database', severity: 'error', isRetryable: false };
  }

  // Rate limiting
  if (ERROR_PATTERNS.RATE_LIMIT.test(errorString)) {
    return { category: 'server', severity: 'warning', isRetryable: true };
  }

  // File errors
  if (
    ERROR_PATTERNS.FILE_SIZE.test(errorString) ||
    ERROR_PATTERNS.FILE_TYPE.test(errorString)
  ) {
    return { category: 'validation', severity: 'error', isRetryable: false };
  }

  // External API errors
  if (ERROR_PATTERNS.EXTERNAL_API.test(errorString)) {
    return { category: 'external', severity: 'error', isRetryable: true };
  }

  // Default classification
  return { category: 'client', severity: 'error', isRetryable: false };
}

/**
 * Generate user-friendly error message
 */
export function createUserFriendlyError(
  error: Error | string,
  context?: ErrorContext
): UserFriendlyError {
  const originalMessage = typeof error === 'string' ? error : error.message;
  const classification = classifyError(error, context);
  const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let title: string;
  let message: string;
  let suggestions: ErrorSuggestion[] = [];

  switch (classification.category) {
    case 'network':
      title = 'Connection Problem';
      message =
        "We're having trouble connecting to our servers. Please check your internet connection and try again.";
      suggestions = [
        {
          action: 'Try Again',
          description: 'Retry the operation',
          priority: 'primary',
          type: 'retry',
        },
        {
          action: 'Check Connection',
          description: 'Verify your internet connection',
          priority: 'secondary',
          type: 'settings',
        },
        {
          action: 'Contact Support',
          description: 'Get help if the problem persists',
          priority: 'secondary',
          type: 'contact',
          link: '/contact',
        },
      ];
      break;

    case 'authentication':
      title = 'Authentication Required';
      message = 'You need to sign in to access this feature.';
      if (ERROR_PATTERNS.AUTH_EXPIRED.test(originalMessage)) {
        title = 'Session Expired';
        message =
          'Your session has expired for security reasons. Please sign in again.';
      }
      suggestions = [
        {
          action: 'Sign In',
          description: 'Sign in to your account',
          priority: 'primary',
          type: 'navigation',
          link: '/auth/signin',
        },
        {
          action: 'Create Account',
          description: 'Create a new account',
          priority: 'secondary',
          type: 'navigation',
          link: '/auth/signup',
        },
      ];
      break;

    case 'validation':
      title = 'Invalid Input';
      message = 'Please check your input and try again.';
      if (ERROR_PATTERNS.VALIDATION_REQUIRED.test(originalMessage)) {
        message =
          'Some required fields are missing. Please fill them out and try again.';
      } else if (ERROR_PATTERNS.FILE_SIZE.test(originalMessage)) {
        title = 'File Too Large';
        message =
          'The file you selected is too large. Please choose a smaller file.';
      } else if (ERROR_PATTERNS.FILE_TYPE.test(originalMessage)) {
        title = 'Unsupported File Type';
        message =
          'The file type you selected is not supported. Please choose a different file.';
      }
      suggestions = [
        {
          action: 'Review Form',
          description: 'Check your input and try again',
          priority: 'primary',
          type: 'retry',
        },
        {
          action: 'View Guidelines',
          description: 'See input requirements',
          priority: 'secondary',
          type: 'documentation',
          link: '/help/guidelines',
        },
      ];
      break;

    case 'authorization':
      title = 'Access Denied';
      message = "You don't have permission to perform this action.";
      suggestions = [
        {
          action: 'Contact Admin',
          description: 'Request access from an administrator',
          priority: 'primary',
          type: 'contact',
        },
        {
          action: 'Go Back',
          description: 'Return to the previous page',
          priority: 'secondary',
          type: 'navigation',
        },
      ];
      break;

    case 'server':
      title = 'Server Error';
      message = 'Something went wrong on our end. Our team has been notified.';
      if (ERROR_PATTERNS.SERVER_OVERLOAD.test(originalMessage)) {
        title = 'Server Busy';
        message =
          'Our servers are currently busy. Please try again in a few moments.';
      } else if (ERROR_PATTERNS.RATE_LIMIT.test(originalMessage)) {
        title = 'Too Many Requests';
        message =
          "You're making requests too quickly. Please wait a moment before trying again.";
      }
      suggestions = [
        {
          action: 'Try Again',
          description: 'Retry the operation',
          priority: 'primary',
          type: 'retry',
        },
        {
          action: 'Report Issue',
          description: 'Let us know about this problem',
          priority: 'secondary',
          type: 'contact',
          link: '/contact',
        },
      ];
      break;

    case 'database':
      title = 'Data Error';
      message = 'There was a problem saving your data. Please try again.';
      if (ERROR_PATTERNS.DATABASE_CONSTRAINT.test(originalMessage)) {
        title = 'Duplicate Data';
        message = 'This data already exists. Please use different values.';
      }
      suggestions = [
        {
          action: 'Try Again',
          description: 'Retry the operation',
          priority: 'primary',
          type: 'retry',
        },
        {
          action: 'Contact Support',
          description: 'Get help with this issue',
          priority: 'secondary',
          type: 'contact',
          link: '/contact',
        },
      ];
      break;

    case 'external':
      title = 'External Service Error';
      message =
        'A third-party service is currently unavailable. Please try again later.';
      suggestions = [
        {
          action: 'Try Again',
          description: 'Retry the operation',
          priority: 'primary',
          type: 'retry',
        },
        {
          action: 'Check Status',
          description: 'View service status page',
          priority: 'secondary',
          type: 'documentation',
          link: '/status',
        },
      ];
      break;

    default:
      title = 'Something Went Wrong';
      message =
        'An unexpected error occurred. Please try again or contact support if the problem persists.';
      suggestions = [
        {
          action: 'Try Again',
          description: 'Retry the operation',
          priority: 'primary',
          type: 'retry',
        },
        {
          action: 'Refresh Page',
          description: 'Reload the current page',
          priority: 'secondary',
          type: 'navigation',
        },
        {
          action: 'Contact Support',
          description: 'Get help from our team',
          priority: 'secondary',
          type: 'contact',
          link: '/contact',
        },
      ];
      break;
  }

  // Add context-specific suggestions
  if (context?.action) {
    const actionSuggestion: ErrorSuggestion = {
      action: `Retry ${context.action}`,
      description: `Try to ${context.action.toLowerCase()} again`,
      priority: 'primary',
      type: 'retry',
    };
    suggestions.unshift(actionSuggestion);
  }

  return {
    id: errorId,
    severity: classification.severity,
    category: classification.category,
    title,
    message,
    technicalMessage: originalMessage,
    suggestions,
    isRetryable: classification.isRetryable,
    shouldLog:
      classification.severity === 'error' ||
      classification.category === 'server',
    context: {
      ...context,
      timestamp: new Date(),
    },
  };
}

/**
 * Get contextual help message based on error and location
 */
function _getContextualHelp(
  error: UserFriendlyError,
  currentPath?: string
): string | null {
  const { category } = error;

  if (currentPath?.includes('/auth/') && category === 'authentication') {
    return "Having trouble signing in? Make sure you're using the correct email and password, or try resetting your password.";
  }

  if (currentPath?.includes('/upload') && category === 'validation') {
    return 'File upload issues? Check that your file is under 10MB and in a supported format (JPG, PNG, PDF).';
  }

  if (category === 'network') {
    return 'Network problems can often be resolved by checking your WiFi connection or trying a different network.';
  }

  if (category === 'server' && error.isRetryable) {
    return 'Server issues are usually temporary. Waiting a few seconds before retrying often resolves the problem.';
  }

  return null;
}

/**
 * Format error for logging
 */
function _formatErrorForLogging(error: UserFriendlyError): Record<string, any> {
  return {
    errorId: error.id,
    severity: error.severity,
    category: error.category,
    title: error.title,
    message: error.message,
    technicalMessage: error.technicalMessage,
    isRetryable: error.isRetryable,
    context: error.context,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
}
