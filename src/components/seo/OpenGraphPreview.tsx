'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  validateOpenGraphMetadata,
  getOpenGraphDebugInfo,
} from '@/lib/seo/opengraph';

interface OpenGraphPreviewProps {
  url: string;
  title?: string;
  className?: string;
}

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  type?: string;
}

/**
 * Component to preview and validate Open Graph metadata
 * Useful for testing social media sharing appearance
 */
export default function OpenGraphPreview({
  url,
  title = 'Open Graph Preview',
  className = '',
}: OpenGraphPreviewProps) {
  const [ogData, setOgData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const fetchOpenGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you might fetch the actual HTML and parse OG tags
      // For now, we'll simulate the data based on the current page
      const response = await fetch(url, {
        method: 'HEAD',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      // Simulate OG data extraction (in production, parse actual meta tags)
      const mockOgData: OpenGraphData = {
        title: document.title || title,
        description:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute('content') || 'No description available',
        image: '/og-default.jpg',
        url: window.location.href,
        siteName: 'StrayLight',
        type: 'website',
      };

      setOgData(mockOgData);

      // Validate the data
      const validationResult = validateOpenGraphMetadata(mockOgData);
      setValidation(validationResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch Open Graph data'
      );
    } finally {
      setLoading(false);
    }
  }, [url, title]);

  useEffect(() => {
    fetchOpenGraphData();
  }, [url, fetchOpenGraphData]);

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
          Error Loading Preview
        </h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchOpenGraphData}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!ogData) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <p className="text-gray-500">No Open Graph data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Social Media Preview */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        </div>

        {/* Facebook-style preview */}
        <div className="p-0">
          {ogData.image && (
            <div className="aspect-[1.91/1] bg-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogData.image}
                alt={ogData.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/og-default.jpg';
                }}
              />
            </div>
          )}

          <div className="p-4 bg-white">
            <div className="text-xs text-gray-500 uppercase mb-1">
              {ogData.siteName || 'Website'}
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
              {ogData.title}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {ogData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Twitter-style preview */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-3 py-2 border-b">
          <h3 className="font-semibold text-sm text-gray-700">
            Twitter Card Preview
          </h3>
        </div>

        <div className="p-4 bg-white">
          <div className="border rounded-lg overflow-hidden">
            {ogData.image && (
              <div className="aspect-[2/1] bg-gray-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ogData.image}
                  alt={ogData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-3">
              <div className="text-xs text-gray-500 mb-1">
                {ogData.url?.replace(/^https?:\/\//, '') || 'website.com'}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                {ogData.title}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                {ogData.description}
              </p>
            </div>
          </div>
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
              {validation.isValid ? 'Valid' : 'Invalid'}
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
          Debug Information
        </summary>
        <div className="p-4 bg-white">
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {getOpenGraphDebugInfo(ogData).join('\n')}
          </pre>
        </div>
      </details>
    </div>
  );
}
