import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';

// Analytics tracking data structure
interface ClickTrackingData {
  itemId: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  ip?: string;
  sessionId?: string;
  source?: 'card' | 'list' | 'search' | 'recommendation';
  context?: {
    page?: string;
    position?: number;
    searchQuery?: string;
    filter?: string;
  };
}

interface ClickTrackingResult {
  success: boolean;
  itemId: string;
  affiliateUrl: string;
  clickCount: number;
  trackingId?: string;
  error?: string;
}

interface ClickTrackingOptions {
  timeout?: number;
  retryAttempts?: number;
  fallbackUrl?: string;
  source?: ClickTrackingData['source'];
  context?: ClickTrackingData['context'];
  onSuccess?: (result: ClickTrackingResult) => void;
  onError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
}

class AffiliateTracker {
  private defaultTimeout = 5000; // 5 seconds
  private defaultRetryAttempts = 2;
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    // Check if we're in a browser environment
    if (
      typeof window === 'undefined' ||
      typeof sessionStorage === 'undefined'
    ) {
      return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const key = 'affiliate_session_id';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
  }

  private collectTrackingData(
    itemId: string,
    options: ClickTrackingOptions = {}
  ): ClickTrackingData {
    return {
      itemId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || undefined,
      sessionId: this.sessionId,
      source: options.source || 'card',
      context: {
        page: window.location.pathname,
        ...options.context,
      },
    };
  }

  private async performTrackingRequest(
    trackingData: ClickTrackingData,
    options: ClickTrackingOptions
  ): Promise<ClickTrackingResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || this.defaultTimeout);

    try {
      const response = await fetch(
        `/api/affiliate-library/${trackingData.itemId}/click`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Tracking failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Tracking request failed');
      }

      return {
        success: true,
        itemId: trackingData.itemId,
        affiliateUrl: data.data.affiliate_url,
        clickCount: data.data.click_count,
        trackingId: data.data.tracking_id,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Tracking request timed out');
      }

      throw error;
    }
  }

  private async trackWithRetry(
    trackingData: ClickTrackingData,
    options: ClickTrackingOptions
  ): Promise<ClickTrackingResult> {
    const maxAttempts = options.retryAttempts ?? this.defaultRetryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts + 1; attempt++) {
      try {
        const result = await this.performTrackingRequest(trackingData, options);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt <= maxAttempts) {
          options.onRetry?.(attempt);
          // Exponential backoff: 500ms, 1s, 2s, etc.
          const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All tracking attempts failed');
  }

  /**
   * Track affiliate link click with comprehensive analytics
   */
  async trackClick(
    item: AffiliateLibraryRow,
    options: ClickTrackingOptions = {}
  ): Promise<ClickTrackingResult> {
    const trackingData = this.collectTrackingData(item.id, options);

    try {
      const result = await this.trackWithRetry(trackingData, options);

      // Store successful tracking in local storage for analytics
      this.storeLocalAnalytics(trackingData, result);

      // Call success callback
      options.onSuccess?.(result);

      return result;
    } catch (error) {
      const trackingError =
        error instanceof Error ? error : new Error('Tracking failed');

      // Call error callback
      options.onError?.(trackingError);

      // Return fallback result
      return {
        success: false,
        itemId: item.id,
        affiliateUrl: options.fallbackUrl || item.affiliate_url,
        clickCount: item.click_count || 0,
        error: trackingError.message,
      };
    }
  }

  /**
   * Open affiliate link with tracking
   */
  async openAffiliateLink(
    item: AffiliateLibraryRow,
    options: ClickTrackingOptions = {}
  ): Promise<void> {
    // Open affiliate URL immediately to provide instant user experience
    // This avoids popup blockers and browser security restrictions
    window.open(item.affiliate_url, '_blank', 'noopener,noreferrer');

    // Track click in background (fire and forget)
    // Don't await to avoid blocking user experience
    this.trackClick(item, options).catch((error) => {
      console.warn('Click tracking failed (non-blocking):', error);
      // Tracking failure doesn't affect user experience
    });
  }

  /**
   * Store analytics data locally for potential batch upload
   */
  private storeLocalAnalytics(
    trackingData: ClickTrackingData,
    result: ClickTrackingResult
  ): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const key = 'affiliate_analytics';
      const existing = localStorage.getItem(key);
      const analytics = existing ? JSON.parse(existing) : [];

      analytics.push({
        ...trackingData,
        result: {
          success: result.success,
          clickCount: result.clickCount,
          trackingId: result.trackingId,
        },
      });

      // Keep only last 100 entries
      if (analytics.length > 100) {
        analytics.splice(0, analytics.length - 100);
      }

      localStorage.setItem(key, JSON.stringify(analytics));
    } catch (error) {
      // Ignore localStorage errors
      console.warn('Failed to store local analytics:', error);
    }
  }

  /**
   * Get local analytics data
   */
  getLocalAnalytics(): any[] {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const data = localStorage.getItem('affiliate_analytics');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear local analytics data
   */
  clearLocalAnalytics(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem('affiliate_analytics');
    } catch (error) {
      console.warn('Failed to clear local analytics:', error);
    }
  }

  /**
   * Batch upload local analytics (for future implementation)
   */
  async uploadLocalAnalytics(): Promise<void> {
    const analytics = this.getLocalAnalytics();

    if (analytics.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/analytics/batch-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analytics }),
      });

      if (response.ok) {
        this.clearLocalAnalytics();
      }
    } catch (error) {
      console.warn('Failed to upload analytics:', error);
    }
  }
}

// Create singleton instance with lazy initialization
let _affiliateTracker: AffiliateTracker | null = null;

const affiliateTracker = {
  getInstance(): AffiliateTracker {
    if (!_affiliateTracker) {
      _affiliateTracker = new AffiliateTracker();
    }
    return _affiliateTracker;
  },

  trackClick: (item: AffiliateLibraryRow, options?: ClickTrackingOptions) => {
    return affiliateTracker.getInstance().trackClick(item, options);
  },

  openAffiliateLink: (
    item: AffiliateLibraryRow,
    options?: ClickTrackingOptions
  ) => {
    return affiliateTracker.getInstance().openAffiliateLink(item, options);
  },

  getLocalAnalytics: () => {
    return affiliateTracker.getInstance().getLocalAnalytics();
  },

  clearLocalAnalytics: () => {
    return affiliateTracker.getInstance().clearLocalAnalytics();
  },
};

// Convenience functions
const _trackAffiliateClick = (
  item: AffiliateLibraryRow,
  options?: ClickTrackingOptions
) => affiliateTracker.trackClick(item, options);

export const openAffiliateLink = (
  item: AffiliateLibraryRow,
  options?: ClickTrackingOptions
) => affiliateTracker.openAffiliateLink(item, options);
