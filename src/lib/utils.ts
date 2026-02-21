import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SlugOptions {
  maxLength?: number;
  allowNumbers?: boolean;
  separator?: string;
}

/**
 * Generate alternative slugs when the preferred slug is taken
 */
export function generateSlugAlternatives(
  baseSlug: string,
  existingSlugs: string[],
  count: number = 5
): string[] {
  const suggestions: string[] = [];

  // Try numeric suffixes
  for (let i = 1; i <= count * 2 && suggestions.length < count; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existingSlugs.includes(candidate)) {
      suggestions.push(candidate);
    }
  }

  // If we still need more suggestions, try year/month suffixes
  if (suggestions.length < count) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const yearCandidate = `${baseSlug}-${year}`;
    const monthCandidate = `${baseSlug}-${year}-${month}`;

    if (
      !existingSlugs.includes(yearCandidate) &&
      !suggestions.includes(yearCandidate)
    ) {
      suggestions.push(yearCandidate);
    }

    if (
      !existingSlugs.includes(monthCandidate) &&
      !suggestions.includes(monthCandidate) &&
      suggestions.length < count
    ) {
      suggestions.push(monthCandidate);
    }
  }

  return suggestions.slice(0, count);
}

/**
 * Format a slug for display purposes (add proper spacing and capitalization)
 */
function _formatSlugForDisplay(slug: string): string {
  if (!slug) return '';

  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a URL-friendly slug from a title
 */
function _generateSlug(title: string, options?: SlugOptions): string {
  if (!title) return '';

  const {
    maxLength = 100,
    allowNumbers = true,
    separator = '-',
  } = options || {};

  let slug = title
    .toLowerCase()
    .trim()
    // Replace spaces and multiple whitespace with separator
    .replace(/\s+/g, separator)
    // Remove non-alphanumeric characters except separator
    .replace(
      allowNumbers
        ? new RegExp(
            `[^a-z0-9${separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
            'g'
          )
        : new RegExp(
            `[^a-z${separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
            'g'
          ),
      ''
    )
    // Remove consecutive separators
    .replace(new RegExp(`\\${separator}+`, 'g'), separator)
    // Remove leading and trailing separators
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, 'g'), '');

  // Truncate to maxLength if specified
  if (maxLength && slug.length > maxLength) {
    slug = slug
      .substring(0, maxLength)
      .replace(new RegExp(`\\${separator}$`), '');
  }

  return slug;
}

/**
 * Validate a slug format
 */
function _validateSlug(slug: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!slug) {
    errors.push('Slug is required');
  } else {
    if (slug.length < 3) {
      errors.push('Slug must be at least 3 characters long');
    }

    if (slug.length > 100) {
      errors.push('Slug must be less than 100 characters long');
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      errors.push(
        'Slug can only contain lowercase letters, numbers, and hyphens'
      );
    }

    if (slug.startsWith('-') || slug.endsWith('-')) {
      errors.push('Slug cannot start or end with a hyphen');
    }

    if (slug.includes('--')) {
      errors.push('Slug cannot contain consecutive hyphens');
    }

    // Add some warnings for best practices
    if (slug.length > 50) {
      warnings.push('Slug is quite long, consider shortening for better SEO');
    }

    if (slug.includes('_')) {
      warnings.push('Consider using hyphens instead of underscores');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a slug is available (not already taken)
 */
async function _checkSlugAvailability(
  slug: string,
  excludeId?: string
): Promise<{ isAvailable: boolean; suggestions?: string[]; error?: string }> {
  try {
    const response = await fetch('/api/articles/check-slug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug, excludeId }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || 'Failed to check slug availability';
      return {
        isAvailable: false,
        error: errorMessage,
      };
    }

    return {
      isAvailable: data.data.isAvailable,
      suggestions: data.data.suggestions,
    };
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return {
      isAvailable: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
