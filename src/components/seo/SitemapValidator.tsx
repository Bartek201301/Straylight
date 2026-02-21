'use client';

import { useState, useEffect } from 'react';
import {
  validateSitemap,
  getSitemapStats,
  type SitemapValidationResult,
} from '@/lib/seo/sitemap-utils';

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: string;
  priority: number;
}

/**
 * Component to validate and display sitemap information
 */
export default function SitemapValidator() {
  const [sitemapData, setSitemapData] = useState<SitemapEntry[] | null>(null);
  const [validation, setValidation] = useState<SitemapValidationResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSitemapData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/sitemap.xml');
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.status}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for XML parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format in sitemap');
      }

      const urlElements = xmlDoc.querySelectorAll('url');
      const entries: SitemapEntry[] = Array.from(urlElements).map(
        (urlElement) => {
          const loc = urlElement.querySelector('loc')?.textContent || '';
          const lastmod =
            urlElement.querySelector('lastmod')?.textContent ||
            new Date().toISOString();
          const changefreq =
            urlElement.querySelector('changefreq')?.textContent || 'weekly';
          const priority = parseFloat(
            urlElement.querySelector('priority')?.textContent || '0.5'
          );

          return {
            url: loc,
            lastModified: lastmod,
            changeFrequency: changefreq,
            priority,
          };
        }
      );

      setSitemapData(entries);

      // Convert to format expected by validation function
      const validationEntries = entries.map((entry) => ({
        url: entry.url,
        lastModified: new Date(entry.lastModified),
        changeFrequency: entry.changeFrequency as any,
        priority: entry.priority,
      }));

      const validationResult = validateSitemap(validationEntries);
      setValidation(validationResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch sitemap data';
      setError(errorMessage);
      console.error('Sitemap validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitemapData();
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
          <div className="h-32 bg-gray-300 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-6 bg-red-50">
        <h3 className="text-red-800 font-semibold mb-2">
          Error Loading Sitemap
        </h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchSitemapData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sitemapData || !validation) {
    return (
      <div className="border rounded-lg p-6">
        <p className="text-gray-500">No sitemap data available</p>
      </div>
    );
  }

  const stats = getSitemapStats(
    sitemapData.map((entry) => ({
      url: entry.url,
      lastModified: new Date(entry.lastModified),
      changeFrequency: entry.changeFrequency as any,
      priority: entry.priority,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div
            className={`w-4 h-4 rounded-full mr-3 ${
              validation.isValid ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <h3
            className={`text-lg font-semibold ${
              validation.isValid ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {validation.isValid ? 'Sitemap Valid' : 'Sitemap Issues Found'}
          </h3>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {validation.stats.totalUrls}
            </div>
            <div className="text-xs text-blue-600">Total URLs</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {validation.stats.staticPages}
            </div>
            <div className="text-xs text-green-600">Static Pages</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {validation.stats.dynamicPages}
            </div>
            <div className="text-xs text-purple-600">Dynamic Pages</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {validation.stats.averagePriority}
            </div>
            <div className="text-xs text-orange-600">Avg Priority</div>
          </div>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-red-700 mb-2">Errors:</h4>
            <ul className="text-sm text-red-600 space-y-1 bg-red-50 p-3 rounded">
              {validation.errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2 flex-shrink-0">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-yellow-700 mb-2">Warnings:</h4>
            <ul className="text-sm text-yellow-600 space-y-1 bg-yellow-50 p-3 rounded">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2 flex-shrink-0">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Priority Distribution */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded">
            <div className="text-xl font-bold text-red-600">
              {stats.byPriority.high}
            </div>
            <div className="text-sm text-gray-600">High Priority (≥0.8)</div>
          </div>
          <div className="text-center p-4 border rounded">
            <div className="text-xl font-bold text-yellow-600">
              {stats.byPriority.medium}
            </div>
            <div className="text-sm text-gray-600">
              Medium Priority (0.5-0.8)
            </div>
          </div>
          <div className="text-center p-4 border rounded">
            <div className="text-xl font-bold text-blue-600">
              {stats.byPriority.low}
            </div>
            <div className="text-sm text-gray-600">Low Priority (&lt;0.5)</div>
          </div>
        </div>
      </div>

      {/* Change Frequency Distribution */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Change Frequency Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded">
            <div className="text-lg font-bold text-green-600">
              {stats.byFrequency.daily}
            </div>
            <div className="text-sm text-gray-600">Daily</div>
          </div>
          <div className="text-center p-3 border rounded">
            <div className="text-lg font-bold text-blue-600">
              {stats.byFrequency.weekly}
            </div>
            <div className="text-sm text-gray-600">Weekly</div>
          </div>
          <div className="text-center p-3 border rounded">
            <div className="text-lg font-bold text-orange-600">
              {stats.byFrequency.monthly}
            </div>
            <div className="text-sm text-gray-600">Monthly</div>
          </div>
          <div className="text-center p-3 border rounded">
            <div className="text-lg font-bold text-gray-600">
              {stats.byFrequency.other}
            </div>
            <div className="text-sm text-gray-600">Other</div>
          </div>
        </div>
      </div>

      {/* Sample URLs */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Sample URLs</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sitemapData.slice(0, 10).map((entry, index) => (
            <div key={index} className="text-sm border rounded p-3">
              <div className="font-mono text-blue-600 mb-1">{entry.url}</div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span>Priority: {entry.priority}</span>
                <span>Frequency: {entry.changeFrequency}</span>
                <span>
                  Modified: {new Date(entry.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {sitemapData.length > 10 && (
            <div className="text-sm text-gray-500 text-center py-2">
              ... and {sitemapData.length - 10} more URLs
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchSitemapData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Validation
        </button>
      </div>
    </div>
  );
}
