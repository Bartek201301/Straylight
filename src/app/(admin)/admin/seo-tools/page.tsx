import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import Container from '@/components/layout/Container';
import Link from 'next/link';

export const metadata: Metadata = createMetadata({
  title: 'SEO Tools | Admin Dashboard - StrayLight',
  description:
    'Administrative SEO tools for managing Open Graph tags, sitemaps, and structured data schemas.',
  path: '/admin/seo-tools',
});

const seoTools = [
  {
    title: 'Open Graph Tester',
    description:
      'Test and preview Open Graph meta tags for social media sharing on Facebook, Twitter, and LinkedIn.',
    href: '/admin/seo-tools/opengraph',
    icon: '🔗',
    features: [
      'Social media preview',
      'Meta tag validation',
      'Real-time testing',
    ],
  },
  {
    title: 'Sitemap Validator',
    description:
      'Validate XML sitemap generation and verify SEO optimization for search engine crawling.',
    href: '/admin/seo-tools/sitemap',
    icon: '🗺️',
    features: [
      'XML sitemap validation',
      'URL structure analysis',
      'Crawl optimization',
    ],
  },
  {
    title: 'Schema Validator',
    description:
      'Test and validate JSON-LD structured data schemas for enhanced search engine understanding.',
    href: '/admin/seo-tools/schema',
    icon: '📋',
    features: [
      'JSON-LD validation',
      'Rich results preview',
      'Schema.org compliance',
    ],
  },
];

export default function SEOToolsPage() {
  return (
    <Container>
      <div className="py-12">
        <div className="max-w-6xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4">SEO Tools</h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Administrative tools for managing and testing SEO optimization
              features.
            </p>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seoTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200 p-6"
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{tool.icon}</span>
                  <h3 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {tool.description}
                </p>

                <div className="space-y-2">
                  {tool.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  Open Tool →
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              SEO Best Practices
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Open Graph Tags
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Use compelling titles (50-60 characters)</li>
                  <li>• Write engaging descriptions (150-160 characters)</li>
                  <li>• Include high-quality images (1200x630px)</li>
                  <li>• Test across different platforms</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Structured Data
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Follow Schema.org guidelines</li>
                  <li>• Validate JSON-LD syntax</li>
                  <li>• Use appropriate schema types</li>
                  <li>• Monitor rich results in Search Console</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
