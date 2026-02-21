'use client';

import { useEffect, useRef, useState } from 'react';
import { useCodeBlockEnhancement } from '@/hooks/useCodeBlockEnhancement';
import {
  trackReadingEvent,
  trackAffiliateClick,
  trackEngagement,
} from '@/lib/analytics';

interface ArticleContentProps {
  html: string;
  error?: string;
  rawContent?: string;
  articleId?: string;
  articleTitle?: string;
}

export default function ArticleContent({
  html,
  error,
  rawContent,
  articleId,
  articleTitle: _articleTitle,
}: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [_hasStartedReading, setHasStartedReading] = useState(false);
  const [_readingProgress, setReadingProgress] = useState(0);

  // Enhance code blocks with copy functionality
  useCodeBlockEnhancement();

  // Track reading events
  useEffect(() => {
    if (!articleId || error) return;

    let hasTrackedStart = false;
    let hasTracked25 = false;
    let hasTracked50 = false;
    let hasTracked75 = false;
    let hasTrackedComplete = false;

    const handleScroll = () => {
      const content = contentRef.current;
      if (!content) return;

      const contentHeight = content.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const contentTop = content.offsetTop;

      // Calculate how much of the content is visible
      const visibleTop = Math.max(0, scrollTop - contentTop);
      const visibleBottom = Math.min(
        contentHeight,
        scrollTop + windowHeight - contentTop
      );
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const progress = Math.min(100, (visibleHeight / contentHeight) * 100);

      setReadingProgress(progress);

      // Track reading start
      if (!hasTrackedStart && progress > 5) {
        trackReadingEvent('start', articleId);
        setHasStartedReading(true);
        hasTrackedStart = true;
      }

      // Track reading milestones
      if (!hasTracked25 && progress >= 25) {
        trackReadingEvent('progress', `${articleId}_25`);
        hasTracked25 = true;
      }

      if (!hasTracked50 && progress >= 50) {
        trackReadingEvent('progress', `${articleId}_50`);
        hasTracked50 = true;
      }

      if (!hasTracked75 && progress >= 75) {
        trackReadingEvent('progress', `${articleId}_75`);
        hasTracked75 = true;
      }

      if (!hasTrackedComplete && progress >= 90) {
        trackReadingEvent('complete', articleId);
        hasTrackedComplete = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [articleId, error]);

  // Re-run enhancement when content changes and add link tracking
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const event = new CustomEvent('enhanceCodeBlocks');
      document.dispatchEvent(event);

      // Add click tracking to external links
      if (contentRef.current) {
        const links = contentRef.current.querySelectorAll('a[href^="http"]');

        links.forEach((link) => {
          const anchor = link as HTMLAnchorElement;
          const href = anchor.href;

          // Remove existing listeners to avoid duplicates
          anchor.removeEventListener('click', handleLinkClick);

          // Add click tracking
          anchor.addEventListener('click', handleLinkClick);

          // Mark as affiliate link if it contains common affiliate patterns
          if (isAffiliateLink(href)) {
            anchor.setAttribute('data-affiliate', 'true');
            anchor.classList.add('affiliate-link');
          }
        });
      }
    }, 100);

    const handleLinkClick = (event: Event) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const href = target.href;
      const isAffiliate =
        target.getAttribute('data-affiliate') === 'true' ||
        isAffiliateLink(href);

      if (isAffiliate) {
        trackAffiliateClick(href, 'article-content');
      } else {
        trackEngagement('external_link_click', href);
      }
    };

    const isAffiliateLink = (url: string): boolean => {
      const affiliatePatterns = [
        'amazon.com',
        'amzn.to',
        'affiliate',
        'ref=',
        'tag=',
        'aff_',
        'affiliate_id',
        'partner',
        'reflink',
        'referral',
      ];

      return affiliatePatterns.some((pattern) =>
        url.toLowerCase().includes(pattern)
      );
    };

    return () => clearTimeout(timer);
  }, [html]);

  if (error) {
    return (
      <div
        className={`border rounded-lg p-6 mb-6 ${'bg-red-900/20 border-red-800'}`}
      >
        <h3 className={`text-lg font-semibold mb-2 ${'text-red-400'}`}>
          Error Processing Content
        </h3>
        <p className={`mb-4 ${'text-red-300'}`}>
          There was an error processing the markdown content: {error}
        </p>
        <details className="text-sm">
          <summary className={`cursor-pointer ${'text-red-400'}`}>
            Show raw content
          </summary>
          <pre
            className={`mt-2 whitespace-pre-wrap overflow-x-auto p-4 rounded ${'bg-neutral-900'}`}
          >
            {rawContent}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      dangerouslySetInnerHTML={{ __html: html }}
      className="article-content"
    />
  );
}
