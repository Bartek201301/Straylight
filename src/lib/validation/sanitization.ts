/**
 * Content Sanitization Utilities
 *
 * Provides comprehensive data sanitization to prevent XSS, injection attacks,
 * and ensure data integrity throughout the application.
 */

// Note: In a production environment, you should install and use DOMPurify
// npm install isomorphic-dompurify @types/dompurify
// For now, we'll use basic sanitization without external dependencies

// Configuration for different sanitization contexts
const SANITIZATION_CONFIGS = {
  // Basic text sanitization - removes HTML and dangerous characters
  text: {
    allowedTags: [],
    allowedAttributes: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  },

  // Rich text sanitization - allows safe HTML tags
  richText: {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  },

  // URL sanitization - validates and cleans URLs
  url: {
    allowedSchemes: ['http', 'https'],
    allowedDomains: [], // Empty means all domains allowed
    removeTracking: true,
  },
} as const;

/**
 * Basic HTML sanitization (strips all HTML tags)
 */
function basicHtmlSanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Sanitize plain text content
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and dangerous characters
  const cleaned = basicHtmlSanitize(input);

  // Additional sanitization
  return cleaned
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Sanitize rich text content (allows safe HTML)
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Basic rich text sanitization (for production, use DOMPurify)
  let cleaned = input;

  // Remove dangerous script tags and events
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');

  return cleaned.trim();
}

/**
 * Sanitize and validate URLs
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  try {
    // Parse the URL to validate structure
    const url = new URL(input.trim());

    // Check allowed schemes
    const protocol = url.protocol.slice(0, -1) as 'http' | 'https';
    if (!SANITIZATION_CONFIGS.url.allowedSchemes.includes(protocol)) {
      throw new Error('Invalid URL scheme');
    }

    // Remove common tracking parameters
    if (SANITIZATION_CONFIGS.url.removeTracking) {
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'gclid',
        'fbclid',
        'msclkid',
        'twclid',
        '_ga',
        '_gl',
        'mc_cid',
        'mc_eid',
        'ref',
        'referrer',
      ];

      trackingParams.forEach((param) => {
        url.searchParams.delete(param);
      });
    }

    // Return the cleaned URL string
    return url.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize tags array
 */
export function sanitizeTags(input: string[] | null | undefined): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalize = (raw: string): string => {
    if (!raw || typeof raw !== 'string') return '';
    // strip HTML/control chars
    let s = sanitizeText(raw);
    // remove diacritics
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // replace any whitespace runs with single hyphen
    s = s.replace(/\s+/g, '-');
    // keep only allowed chars (a-z, 0-9, hyphen, underscore)
    s = s.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    // collapse multiple hyphens
    s = s.replace(/-+/g, '-');
    // trim leading/trailing hyphens/underscores
    s = s.replace(/^[-_]+|[-_]+$/g, '');
    return s;
  };

  const result = input
    .filter((tag) => typeof tag === 'string')
    .map((tag) => normalize(tag))
    .filter((tag) => tag.length > 0 && tag.length <= 50) // sensible limits
    .filter((tag, index, array) => array.indexOf(tag) === index) // dedupe
    .slice(0, 20);

  return result;
}

/**
 * Sanitize ISBN
 */
function sanitizeIsbn(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const cleaned = input
    .replace(/[^\d\-X]/gi, '') // Keep only digits, hyphens, and X
    .toUpperCase()
    .trim();

  // Validate ISBN format (basic check)
  if (
    !/^(?:\d{9}[\dX]|\d{13})$|^(?:\d{1,5}\-\d{1,7}\-\d{1,7}\-[\dX])$/.test(
      cleaned
    )
  ) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize numeric rating
 */
function sanitizeRating(
  input: number | string | null | undefined
): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Clamp between 1.0 and 5.0, round to 1 decimal place
  const clamped = Math.max(1.0, Math.min(5.0, num));
  return Math.round(clamped * 10) / 10;
}

/**
 * Sanitize publication year
 */
function sanitizePublicationYear(
  input: number | string | null | undefined
): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const num = typeof input === 'string' ? parseInt(input, 10) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const minYear = 1900;
  const maxYear = currentYear + 2;

  if (num < minYear || num > maxYear) {
    return null;
  }

  return num;
}

/**
 * Comprehensive data sanitization for affiliate library items
 */
export interface SanitizeOptions {
  preserveRichText?: boolean;
  strictMode?: boolean;
  removeEmptyFields?: boolean;
}

function sanitizeAffiliateLibraryData(
  data: Record<string, any>,
  options: SanitizeOptions = {}
): Record<string, any> {
  const {
    preserveRichText = false,
    strictMode = true,
    removeEmptyFields = true,
  } = options;

  // Start with a shallow copy so we DON'T drop unknown fields (e.g. body_md, author_id)
  // This function is reused by multiple endpoints beyond affiliate items
  // and must preserve required fields for their Zod schemas.
  const sanitized: Record<string, any> = { ...data };

  // Sanitize each field based on its type and requirements
  if (data.title !== undefined) {
    const sanitizedTitle = sanitizeText(data.title);
    if (sanitizedTitle || !removeEmptyFields) {
      sanitized.title = sanitizedTitle;
    }
  }

  if (data.description !== undefined) {
    const sanitizedDesc = preserveRichText
      ? sanitizeRichText(data.description)
      : sanitizeText(data.description);
    if (sanitizedDesc || !removeEmptyFields) {
      sanitized.description = sanitizedDesc || null;
    }
  }

  if (data.author !== undefined) {
    const sanitizedAuthor = sanitizeText(data.author);
    if (sanitizedAuthor || !removeEmptyFields) {
      sanitized.author = sanitizedAuthor || null;
    }
  }

  if (data.publisher !== undefined) {
    const sanitizedPublisher = sanitizeText(data.publisher);
    if (sanitizedPublisher || !removeEmptyFields) {
      sanitized.publisher = sanitizedPublisher || null;
    }
  }

  if (data.affiliate_url !== undefined) {
    const sanitizedUrl = sanitizeUrl(data.affiliate_url);
    if (sanitizedUrl) {
      sanitized.affiliate_url = sanitizedUrl;
    } else if (strictMode) {
      throw new Error('Invalid affiliate URL provided');
    }
  }

  if (data.image_url !== undefined) {
    const sanitizedImageUrl = sanitizeUrl(data.image_url);
    if (sanitizedImageUrl || !removeEmptyFields) {
      sanitized.image_url = sanitizedImageUrl;
    }
  }

  if (data.tags !== undefined) {
    const sanitizedTags = sanitizeTags(data.tags);
    if (sanitizedTags.length > 0 || !removeEmptyFields) {
      sanitized.tags = sanitizedTags;
    }
  }

  if (data.isbn !== undefined) {
    const sanitizedIsbn = sanitizeIsbn(data.isbn);
    if (sanitizedIsbn || !removeEmptyFields) {
      sanitized.isbn = sanitizedIsbn;
    }
  }

  if (data.rating !== undefined) {
    const sanitizedRating = sanitizeRating(data.rating);
    if (sanitizedRating !== null || !removeEmptyFields) {
      sanitized.rating = sanitizedRating;
    }
  }

  if (data.publication_year !== undefined) {
    const sanitizedYear = sanitizePublicationYear(data.publication_year);
    if (sanitizedYear !== null || !removeEmptyFields) {
      sanitized.publication_year = sanitizedYear;
    }
  }

  // Pass through enum values and other safe fields
  const safeFields = ['type', 'price_range', 'is_active', 'click_count'];
  safeFields.forEach((field) => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });

  return sanitized;
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  return sanitizeText(query)
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 200) // Limit search query length
    .trim();
}

/**
 * Security-focused validation for user inputs
 */
function detectMaliciousContent(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Common XSS patterns
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
  ];

  // Note: We intentionally avoid aggressive SQL pattern checks here to prevent
  // false positives for legitimate Markdown content (e.g., `---` for HR) or
  // code snippets that may contain SQL-like syntax. Our database layer uses
  // parameterized queries via Supabase, so XSS remains the primary concern.

  // Check for malicious patterns (XSS-focused)
  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limiting data for input validation
 */
interface ValidationAttempt {
  ip: string;
  timestamp: number;
  attempts: number;
}

const validationAttempts = new Map<string, ValidationAttempt>();

/**
 * Check rate limiting for validation attempts
 */
export function checkValidationRateLimit(
  ip: string,
  maxAttempts: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = ip;

  const existing = validationAttempts.get(key);

  if (!existing) {
    validationAttempts.set(key, { ip, timestamp: now, attempts: 1 });
    return true;
  }

  // Reset if window has expired
  if (now - existing.timestamp > windowMs) {
    validationAttempts.set(key, { ip, timestamp: now, attempts: 1 });
    return true;
  }

  // Check if limit exceeded
  if (existing.attempts >= maxAttempts) {
    return false;
  }

  // Increment attempts
  existing.attempts++;
  validationAttempts.set(key, existing);

  return true;
}

/**
 * Comprehensive validation result
 */
export interface ValidationResult {
  isValid: boolean;
  data: any;
  errors: string[];
  warnings: string[];
  sanitized: boolean;
}

/**
 * Comprehensive validation pipeline
 */
export function validateAndSanitizeData(
  input: unknown,
  schema: any,
  options: SanitizeOptions & { clientIP?: string } = {}
): ValidationResult {
  const { clientIP, ...sanitizeOptions } = options;
  const result: ValidationResult = {
    isValid: false,
    data: null,
    errors: [],
    warnings: [],
    sanitized: false,
  };

  try {
    // Rate limiting check
    if (clientIP && !checkValidationRateLimit(clientIP)) {
      result.errors.push('Rate limit exceeded for validation requests');
      return result;
    }

    // Type check
    if (!input || typeof input !== 'object') {
      result.errors.push('Input must be a valid object');
      return result;
    }

    // Malicious content detection
    const inputStr = JSON.stringify(input);
    if (detectMaliciousContent(inputStr)) {
      result.errors.push('Potentially malicious content detected');
      return result;
    }

    // Sanitize the data
    const sanitized = sanitizeAffiliateLibraryData(
      input as Record<string, any>,
      sanitizeOptions
    );
    result.sanitized = JSON.stringify(sanitized) !== JSON.stringify(input);

    if (result.sanitized) {
      result.warnings.push('Input data was sanitized for security');
    }

    // Validate with schema
    const validation = schema.safeParse(sanitized);

    if (validation.success) {
      result.isValid = true;
      result.data = validation.data;
    } else {
      // Zod exposes errors via `issues`
      result.errors = validation.error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      );
    }
  } catch (error) {
    result.errors.push(
      `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}
