'use client';

import { useState, useEffect } from 'react';
import { validateSchema } from '@/lib/seo/structured-data';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface StructuredDataEntry {
  type: string;
  data: any;
  validation: ValidationResult;
}

/**
 * Component to validate and display structured data
 */
export default function StructuredDataValidator() {
  const [structuredData, setStructuredData] = useState<StructuredDataEntry[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractStructuredData = () => {
    setLoading(true);
    setError(null);

    try {
      const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      const entries: StructuredDataEntry[] = [];

      scripts.forEach((script, index) => {
        try {
          const jsonData = JSON.parse(script.textContent || '');

          // Handle both single schemas and @graph arrays
          const schemas = jsonData['@graph'] ? jsonData['@graph'] : [jsonData];

          schemas.forEach((schema: any, _schemaIndex: number) => {
            const validation = validateSchema(schema);
            entries.push({
              type: schema['@type'] || 'Unknown',
              data: schema,
              validation,
            });
          });
        } catch (err) {
          console.error(`Error parsing structured data script ${index}:`, err);
          entries.push({
            type: 'Invalid JSON',
            data: script.textContent,
            validation: {
              isValid: false,
              errors: ['Invalid JSON format'],
              warnings: [],
            },
          });
        }
      });

      setStructuredData(entries);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to extract structured data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    extractStructuredData();
  }, []);

  const totalValid = structuredData.filter(
    (entry) => entry.validation.isValid
  ).length;
  const totalErrors = structuredData.reduce(
    (sum, entry) => sum + entry.validation.errors.length,
    0
  );
  const totalWarnings = structuredData.reduce(
    (sum, entry) => sum + entry.validation.warnings.length,
    0
  );

  if (loading) {
    return (
      <div className="border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-32 bg-gray-300 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-6 bg-red-50">
        <h3 className="text-red-800 font-semibold mb-2">
          Error Loading Structured Data
        </h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={extractStructuredData}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
          Structured Data Overview
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {structuredData.length}
            </div>
            <div className="text-xs text-blue-600">Total Schemas</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {totalValid}
            </div>
            <div className="text-xs text-green-600">Valid</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
            <div className="text-xs text-red-600">Errors</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {totalWarnings}
            </div>
            <div className="text-xs text-yellow-600">Warnings</div>
          </div>
        </div>

        {/* Schema Type Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(
            structuredData.reduce(
              (acc, entry) => {
                acc[entry.type] = (acc[entry.type] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            )
          ).map(([type, count]) => (
            <div key={type} className="text-center p-3 border rounded">
              <div className="text-lg font-bold text-gray-700">{count}</div>
              <div className="text-xs text-gray-600">{type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Schema Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Schema Details</h3>

        {structuredData.map((entry, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{entry.type}</h4>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    entry.validation.isValid ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span
                  className={`text-sm font-medium ${
                    entry.validation.isValid ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {entry.validation.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>

            {/* Errors */}
            {entry.validation.errors.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-red-700 mb-1">Errors:</h5>
                <ul className="text-sm text-red-600 space-y-1 bg-red-50 p-3 rounded">
                  {entry.validation.errors.map((error, errorIndex) => (
                    <li key={errorIndex} className="flex items-start">
                      <span className="text-red-500 mr-2 flex-shrink-0">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {entry.validation.warnings.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-yellow-700 mb-1">Warnings:</h5>
                <ul className="text-sm text-yellow-600 space-y-1 bg-yellow-50 p-3 rounded">
                  {entry.validation.warnings.map((warning, warningIndex) => (
                    <li key={warningIndex} className="flex items-start">
                      <span className="text-yellow-500 mr-2 flex-shrink-0">
                        •
                      </span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Schema Data Preview */}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                View Schema Data
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {/* External Validation Tools */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          External Validation Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded hover:shadow-md transition-shadow"
          >
            <h4 className="font-semibold text-blue-600 mb-2">
              Google Rich Results Test
            </h4>
            <p className="text-sm text-gray-600">
              Test your structured data with Google&apos;s official validation
              tool.
            </p>
            <div className="text-xs text-gray-500 mt-2">
              search.google.com/test/rich-results
            </div>
          </a>

          <a
            href="https://validator.schema.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded hover:shadow-md transition-shadow"
          >
            <h4 className="font-semibold text-green-600 mb-2">
              Schema.org Validator
            </h4>
            <p className="text-sm text-gray-600">
              Validate your structured data against Schema.org specifications.
            </p>
            <div className="text-xs text-gray-500 mt-2">
              validator.schema.org
            </div>
          </a>

          <a
            href="https://www.bing.com/toolbox/markup-validator"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded hover:shadow-md transition-shadow"
          >
            <h4 className="font-semibold text-orange-600 mb-2">
              Bing Markup Validator
            </h4>
            <p className="text-sm text-gray-600">
              Test structured data compatibility with Microsoft Bing.
            </p>
            <div className="text-xs text-gray-500 mt-2">
              bing.com/toolbox/markup-validator
            </div>
          </a>

          <a
            href="https://developers.facebook.com/tools/debug/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded hover:shadow-md transition-shadow"
          >
            <h4 className="font-semibold text-blue-700 mb-2">
              Facebook Debugger
            </h4>
            <p className="text-sm text-gray-600">
              Test Open Graph structured data for social media sharing.
            </p>
            <div className="text-xs text-gray-500 mt-2">
              developers.facebook.com/tools/debug
            </div>
          </a>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={extractStructuredData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Analysis
        </button>
      </div>
    </div>
  );
}
