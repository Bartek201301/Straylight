'use client';

import { supabase } from '@/lib/supabase';
// Generate UUID v4 without external dependency
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Response types for admin article operations
 */
interface AdminArticleResponse {
  success: boolean;
  approved?: number;
  rejected?: number;
  skipped?: number;
  articles?: Array<{
    id: string;
    title: string;
    status: string;
    published_at?: string;
    updated_at?: string;
  }>;
  message: string;
  timestamp: string;
}

export interface AdminArticleError {
  error: string;
  code: string;
  details?: string[];
  timestamp: string;
}

/**
 * Request options for admin operations
 */
interface AdminOperationOptions {
  reason?: string;
  requestId?: string;
}

/**
 * Custom error class for admin operations
 */
export class AdminArticleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string[],
    public status?: number
  ) {
    super(message);
    this.name = 'AdminArticleError';
  }
}

/**
 * Secure service for admin article operations
 * Handles all communication with admin API endpoints
 */
class AdminArticleService {
  private readonly baseUrl = '/api/admin/articles';

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      // Note: Authentication is handled by httpOnly cookies
      // The middleware will validate the session
    };
  }

  /**
   * Make authenticated API request with error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      // Dołącz token Supabase w nagłówku Authorization (Bearer)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authHeader: HeadersInit = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
          ...authHeader,
        },
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as AdminArticleError;
        throw new AdminArticleError(
          errorData.error || 'Operation failed',
          errorData.code || 'UNKNOWN_ERROR',
          errorData.details,
          response.status
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof AdminArticleError) {
        throw error;
      }

      // Network or parsing errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AdminArticleError(
          'Network error. Please check your connection.',
          'NETWORK_ERROR',
          undefined,
          0
        );
      }

      throw new AdminArticleError(
        'An unexpected error occurred',
        'UNKNOWN_ERROR',
        undefined,
        500
      );
    }
  }

  /**
   * Approve one or more articles
   */
  async approveArticles(
    articleIds: string[],
    options: AdminOperationOptions = {}
  ): Promise<AdminArticleResponse> {
    // Input validation
    if (!articleIds || articleIds.length === 0) {
      throw new AdminArticleError(
        'No articles selected for approval',
        'VALIDATION_ERROR',
        ['At least one article must be selected']
      );
    }

    if (articleIds.length > 100) {
      throw new AdminArticleError(
        'Too many articles selected',
        'VALIDATION_ERROR',
        ['Maximum 100 articles can be processed at once']
      );
    }

    // Validate UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = articleIds.filter((id) => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      throw new AdminArticleError(
        'Invalid article IDs detected',
        'VALIDATION_ERROR',
        ['All article IDs must be valid UUIDs']
      );
    }

    const requestPayload = {
      articleIds,
      reason: options.reason,
      requestId: options.requestId || generateUUID(),
    };

    return this.makeRequest<AdminArticleResponse>('/approve', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    });
  }

  /**
   * Reject one or more articles
   */
  async rejectArticles(
    articleIds: string[],
    reason: string,
    options: Omit<AdminOperationOptions, 'reason'> = {}
  ): Promise<AdminArticleResponse> {
    // Input validation
    if (!articleIds || articleIds.length === 0) {
      throw new AdminArticleError(
        'No articles selected for rejection',
        'VALIDATION_ERROR',
        ['At least one article must be selected']
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new AdminArticleError(
        'Rejection reason is required',
        'VALIDATION_ERROR',
        ['Please provide a reason for rejecting these articles']
      );
    }

    if (reason.length > 500) {
      throw new AdminArticleError(
        'Rejection reason is too long',
        'VALIDATION_ERROR',
        ['Reason must be 500 characters or less']
      );
    }

    if (articleIds.length > 100) {
      throw new AdminArticleError(
        'Too many articles selected',
        'VALIDATION_ERROR',
        ['Maximum 100 articles can be processed at once']
      );
    }

    // Validate UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = articleIds.filter((id) => !uuidRegex.test(id));
    if (invalidIds.length > 0) {
      throw new AdminArticleError(
        'Invalid article IDs detected',
        'VALIDATION_ERROR',
        ['All article IDs must be valid UUIDs']
      );
    }

    const requestPayload = {
      articleIds,
      reason: reason.trim(),
      requestId: options.requestId || generateUUID(),
    };

    return this.makeRequest<AdminArticleResponse>('/reject', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    });
  }

  /**
   * Get operation status (for potential future use with async operations)
   */
  async getOperationStatus(
    _requestId: string
  ): Promise<{ status: string; result?: any }> {
    // This could be implemented if you need to track long-running operations
    throw new Error('Not implemented yet');
  }
}

/**
 * Singleton instance of the admin article service
 */
const adminArticleService = new AdminArticleService();

/**
 * React hook for admin article operations
 * Provides a clean interface for components to use the service
 */
export function useAdminArticleService() {
  return {
    approveArticles:
      adminArticleService.approveArticles.bind(adminArticleService),
    rejectArticles:
      adminArticleService.rejectArticles.bind(adminArticleService),
    AdminArticleError,
  };
}
