'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  validateTwitterCard,
  getTwitterCardDebugInfo,
  TWITTER_CARD_TYPES,
  TwitterCardType,
} from '@/lib/seo/twitter-cards';

interface TwitterCardPreviewProps {
  url: string;
  title?: string;
  className?: string;
}

interface TwitterCardData {
  card?: TwitterCardType;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
  images?: Array<{
    url: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
}

/**
 * Component to preview and validate Twitter Card metadata
 * Shows how the card will appear on Twitter
 */
export default function TwitterCardPreview({
  url,
  title = 'Twitter Card Preview',
  className = '',
}: TwitterCardPreviewProps) {
  const [cardData, setCardData] = useState<TwitterCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const fetchTwitterCardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, you'd fetch the actual HTML and parse Twitter Card meta tags
      // For now, we'll simulate based on current page metadata
      const mockCardData: TwitterCardData = {
        card: 'summary_large_image',
        title: document.title || title,
        description:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute('content') ||
          'Check out this great content on StrayLight',
        image:
          '/api/twitter-card?title=' +
          encodeURIComponent(document.title || title),
        site: '@straylight_dev',
        creator: '@straylight_dev',
        images: [
          {
            url:
              '/api/twitter-card?title=' +
              encodeURIComponent(document.title || title),
            alt: `${document.title || title} - StrayLight`,
            width: 1200,
            height: 630,
          },
        ],
      };

      setCardData(mockCardData);

      // Validate the data
      const validationResult = validateTwitterCard(mockCardData);
      setValidation(validationResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch Twitter Card data'
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, title]);

  useEffect(() => {
    fetchTwitterCardData();
  }, [url, fetchTwitterCardData]);

  if (loading) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`border border-red-300 rounded-lg p-4 bg-red-50 ${className}`}
      >
        <h3 className="text-red-800 font-semibold mb-2">
          Error Loading Twitter Card
        </h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchTwitterCardData}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <p className="text-gray-500">No Twitter Card data available</p>
      </div>
    );
  }

  const cardType = cardData.card || 'summary_large_image';
  const cardSpec = TWITTER_CARD_TYPES[cardType];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Twitter Card Preview */}
      <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
          <div className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
            {cardSpec.name}
          </div>
        </div>

        {/* Twitter-style card preview */}
        <div className="p-4 bg-white">
          <div className="max-w-md mx-auto border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            {/* Image for large image cards */}
            {cardType === 'summary_large_image' && cardData.images?.[0] && (
              <div className="aspect-[1.91/1] bg-gray-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardData.images[0].url}
                  alt={cardData.images[0].alt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      '/twitter-card-default.jpg';
                  }}
                />
              </div>
            )}

            <div className="p-3">
              {/* Small image for summary cards */}
              {cardType === 'summary' && cardData.images?.[0] && (
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardData.images[0].url}
                    alt={cardData.images[0].alt}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1">
                      {cardData.site?.replace('@', '') || 'straylight.ai'}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {cardData.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {cardData.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Content for large image cards */}
              {cardType === 'summary_large_image' && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    {cardData.site?.replace('@', '') || 'straylight.ai'}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                    {cardData.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {cardData.description}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Type Comparison */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Card Type Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(TWITTER_CARD_TYPES).map(([type, spec]) => (
            <div key={type} className="border rounded p-3 text-sm">
              <div className="font-medium text-blue-600 mb-1">{spec.name}</div>
              <div className="text-gray-600 text-xs mb-2">
                {spec.description}
              </div>
              <div className="text-xs text-gray-500">
                Dimensions: {spec.imageSize.width}×{spec.imageSize.height}px
              </div>
              {type === cardType && (
                <div className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Currently Active
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Validation Results</h3>

          <div className="flex items-center mb-2">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                validation.isValid ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span
              className={`font-medium ${
                validation.isValid ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {validation.isValid
                ? 'Valid Twitter Card'
                : 'Invalid Twitter Card'}
            </span>
          </div>

          {validation.errors.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-red-700 mb-1">Errors:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-1">Warnings:</h4>
              <ul className="text-sm text-yellow-600 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Debug Information */}
      <details className="border rounded-lg">
        <summary className="px-4 py-2 bg-gray-50 font-medium cursor-pointer">
          Twitter Card Debug Information
        </summary>
        <div className="p-4 bg-white">
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {getTwitterCardDebugInfo(cardData).join('\n')}
          </pre>
        </div>
      </details>

      {/* Testing Tools */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">External Testing</h3>
        <div className="space-y-2">
          <a
            href="https://cards-dev.twitter.com/validator"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <div className="font-medium text-blue-700">
              Twitter Card Validator
            </div>
            <div className="text-sm text-blue-600">
              Test your Twitter Cards with the official validator
            </div>
            <div className="text-xs text-blue-500 mt-1">
              cards-dev.twitter.com/validator
            </div>
          </a>

          <div className="p-3 bg-gray-50 border rounded">
            <div className="font-medium text-gray-700 mb-1">Test URL</div>
            <div className="text-sm text-gray-600 font-mono bg-white border px-2 py-1 rounded">
              {window.location.href}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Copy this URL and paste it into the Twitter Card Validator
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
