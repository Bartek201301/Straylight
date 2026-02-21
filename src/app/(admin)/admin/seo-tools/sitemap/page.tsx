import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import Container from '@/components/layout/Container';
import SitemapValidator from '@/components/seo/SitemapValidator';

export const metadata: Metadata = createMetadata({
  title: 'Sitemap Validator | Admin SEO Tools - StrayLight',
  description:
    'Administrative tool to test and validate XML sitemap generation, verify SEO optimization and sitemap structure for search engine crawling.',
  keywords: [
    'XML sitemap',
    'SEO testing',
    'sitemap validation',
    'search engine optimization',
    'sitemap structure',
    'crawling optimization',
    'admin tools',
  ],
  path: '/admin/seo-tools/sitemap',
});

export default function SitemapTestPage() {
  return (
    <Container>
      <div className="py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4">XML Sitemap Testing</h1>
            <p className="text-xl text-neutral-400 mb-6">
              Test and validate the XML sitemap generation system for SEO
              optimization and search engine crawling.
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h2 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                🚀 Task 26.4 Implementation
              </h2>
              <p className="text-sm text-green-700 dark:text-green-300">
                This page validates the XML Sitemap Generation System
                implementation with dynamic content inclusion, proper priority
                settings, and SEO optimization.
              </p>
            </div>
          </header>

          {/* Sitemap Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Sitemap Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-base p-6">
                <h3 className="font-semibold text-lg mb-3">XML Sitemap</h3>
                <p className="text-neutral-600 mb-4">
                  Main XML sitemap with all public pages and articles
                </p>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View Sitemap
                </a>
              </div>

              <div className="card-base p-6">
                <h3 className="font-semibold text-lg mb-3">Robots.txt</h3>
                <p className="text-neutral-600 mb-4">
                  Robots file with crawling rules and sitemap reference
                </p>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View Robots.txt
                </a>
              </div>
            </div>
          </section>

          {/* Sitemap Validator Component */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Sitemap Validation</h2>
            <SitemapValidator />
          </section>

          {/* External Validation Tools */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              External Validation Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="https://www.google.com/webmasters/tools/sitemap-list"
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">
                  Google Search Console
                </h3>
                <p className="text-sm text-neutral-600">
                  Submit and test your sitemap with Google Search Console for
                  indexing.
                </p>
                <div className="text-xs text-neutral-500 mt-2">
                  search.google.com/search-console
                </div>
              </a>

              <a
                href="https://www.bing.com/webmasters/"
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-orange-600 mb-2">
                  Bing Webmaster Tools
                </h3>
                <p className="text-sm text-neutral-600">
                  Submit your sitemap to Bing for indexing in Microsoft search.
                </p>
                <div className="text-xs text-neutral-500 mt-2">
                  bing.com/webmasters
                </div>
              </a>

              <a
                href="https://www.xml-sitemaps.com/validate-xml-sitemap.html"
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-purple-600 mb-2">
                  XML Sitemap Validator
                </h3>
                <p className="text-sm text-neutral-600">
                  Validate XML sitemap format and structure compliance.
                </p>
                <div className="text-xs text-neutral-500 mt-2">
                  xml-sitemaps.com/validate
                </div>
              </a>
            </div>
          </section>

          {/* Implementation Details */}
          <section className="card-base p-6">
            <h2 className="text-2xl font-bold mb-4">Implementation Features</h2>
            <div className="prose prose-sm max-w-none">
              <h3>Core Features:</h3>
              <ul>
                <li>
                  <strong>Dynamic Content:</strong> Automatically includes all
                  published articles
                </li>
                <li>
                  <strong>Smart Prioritization:</strong> Priority based on
                  content age and importance
                </li>
                <li>
                  <strong>Change Frequency:</strong> Calculated based on content
                  update patterns
                </li>
                <li>
                  <strong>Static Pages:</strong> All main application pages with
                  proper priorities
                </li>
                <li>
                  <strong>Error Handling:</strong> Graceful fallbacks for
                  database connection issues
                </li>
                <li>
                  <strong>Performance:</strong> Efficient queries and reasonable
                  limits
                </li>
                <li>
                  <strong>SEO Optimization:</strong> Follows Google sitemap best
                  practices
                </li>
              </ul>

              <h3>Robots.txt Features:</h3>
              <ul>
                <li>
                  <strong>Platform-Specific Rules:</strong> Tailored rules for
                  different crawlers
                </li>
                <li>
                  <strong>Social Media Support:</strong> Allows OG and Twitter
                  Card image access
                </li>
                <li>
                  <strong>AI Crawler Control:</strong> Specific rules for AI
                  training bots
                </li>
                <li>
                  <strong>Security:</strong> Blocks admin, auth, and private
                  areas
                </li>
              </ul>

              <h3>Key Files:</h3>
              <ul>
                <li>
                  <code>/app/sitemap.ts</code> - Dynamic XML sitemap generation
                </li>
                <li>
                  <code>/app/robots.ts</code> - Enhanced robots.txt with
                  platform rules
                </li>
                <li>
                  <code>/lib/sitemap-utils.ts</code> - Validation and utility
                  functions
                </li>
                <li>
                  <code>/components/SitemapValidator.tsx</code> - Testing and
                  validation UI
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}
