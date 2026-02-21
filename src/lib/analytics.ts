// Google Analytics 4 tracking utilities
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, parameters?: any) => void;
    dataLayer?: any[];
  }
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track page views (automatically handled by GA4, but useful for SPAs)
function _trackPageView(url: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_location: url,
      page_title: title,
    });
  }
}

// Track reading events (scroll depth, time spent)
export function trackReadingEvent(
  action: 'start' | 'progress' | 'complete',
  articleId?: string
) {
  trackEvent(action, 'reading', articleId);
}

// Track affiliate link clicks
export function trackAffiliateClick(linkUrl: string, position?: string) {
  trackEvent('click', 'affiliate_link', linkUrl, undefined);

  // Also track as conversion event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'affiliate_click', {
      event_category: 'engagement',
      event_label: linkUrl,
      custom_parameters: {
        link_position: position,
      },
    });
  }
}

// Track user engagement
export function trackEngagement(action: string, element?: string) {
  trackEvent(action, 'engagement', element);
}

// Track search events
function _trackSearch(searchTerm: string, resultCount?: number) {
  trackEvent('search', 'site_search', searchTerm, resultCount);
}
