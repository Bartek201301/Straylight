import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import Container from '@/components/layout/Container';
import OpenGraphPreview from '@/components/seo/OpenGraphPreview';
import TwitterCardPreview from '@/components/seo/TwitterCardPreview';

export const metadata: Metadata = createMetadata({
  title: 'Open Graph Tester | Admin SEO Tools - StrayLight',
  description:
    'Administrative tool to test and preview Open Graph meta tags for social media sharing on Facebook, Twitter, LinkedIn and other platforms.',
  keywords: [
    'Open Graph',
    'social media sharing',
    'meta tags',
    'Facebook sharing',
    'Twitter cards',
    'social preview',
    'admin tools',
  ],
  path: '/admin/seo-tools/opengraph',
});

export default function OpenGraphTestPage() {
  const testUrls = [
    {
      url: '/',
      title: 'Homepage',
      description: 'Test the main website Open Graph tags',
    },
    {
      url: '/about',
      title: 'About Page',
      description: 'Test the about page Open Graph tags',
    },
    {
      url: '/articles',
      title: 'Articles Listing',
      description: 'Test the articles listing Open Graph tags',
    },
    {
      url: '/library',
      title: 'Library Page',
      description: 'Test the library page Open Graph tags',
    },
  ];

  return (
    <Container>
      <div className="py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Open Graph Testing</h1>
            <p className="text-xl text-neutral-400 mb-6">
              Preview how your pages appear when shared on social media
              platforms like Facebook, Twitter, LinkedIn, and others.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                🧪 Development Testing Tool
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This page helps developers test and validate Open Graph metadata
                implementation across different page types. Use the social media
                debuggers linked below for production testing.
              </p>
            </div>
          </header>

          {/* Twitter Card Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Twitter Card Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Summary Large Image</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/twitter-card?title=AI Career Development Guide&card=summary_large_image&author=StrayLight Team&category=Technology&tags=AI,Career,Development"
                  alt="Twitter Summary Large Image Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Large image card (1200x630) for rich visual content
                </p>
              </div>

              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Summary Card</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/twitter-card?title=StrayLight Platform&card=summary&category=Career Guidance"
                  alt="Twitter Summary Card Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Default summary card (120x120) with square image
                </p>
              </div>

              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">App Card</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/twitter-card?title=StrayLight Mobile App&card=app&category=Mobile App"
                  alt="Twitter App Card Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  App promotion card for mobile applications
                </p>
              </div>

              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Player Card</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/twitter-card?title=AI Career Webinar&card=player&author=Expert Speaker"
                  alt="Twitter Player Card Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Video/audio player card for media content
                </p>
              </div>
            </div>
          </section>

          {/* Dynamic OG Image Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Dynamic Open Graph Images
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Article Type</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/og?title=AI Career Guidance for Developers&type=og-article&author=StrayLight Team&category=Technology&tags=AI,Career,Development"
                  alt="Article OG Image Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Dynamic image for article pages with title, author, and tags
                </p>
              </div>

              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Website Type</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/og?title=StrayLight Platform&type=og-website&category=Career Guidance"
                  alt="Website OG Image Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Dynamic image for general website pages
                </p>
              </div>

              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Library Type</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/og?title=Curated Resources&type=og-book&tags=Books,Tools,Resources"
                  alt="Library OG Image Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Dynamic image for library and resource pages
                </p>
              </div>

              <div className="card-base p-4">
                <h3 className="font-semibold mb-2">Profile Type</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/og?title=Professional Profile&type=og-profile&author=John Doe"
                  alt="Profile OG Image Example"
                  className="w-full rounded border"
                />
                <p className="text-sm text-neutral-500 mt-2">
                  Dynamic image for profile and author pages
                </p>
              </div>
            </div>
          </section>

          {/* Page Previews */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Page Social Media Previews
            </h2>
            <div className="space-y-8">
              {testUrls.map((test, index) => (
                <div key={index} className="card-base p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{test.title}</h3>
                    <p className="text-neutral-500 text-sm">
                      {test.description}
                    </p>
                    <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded mt-1 inline-block">
                      {test.url}
                    </code>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Open Graph Preview</h4>
                      <OpenGraphPreview
                        url={test.url}
                        title={`${test.title} OG Preview`}
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">
                        Twitter Card Preview
                      </h4>
                      <TwitterCardPreview
                        url={test.url}
                        title={`${test.title} Twitter Preview`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* External Testing Tools */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">External Testing Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="https://developers.facebook.com/tools/debug/"
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-blue-600 mb-2">
                  Facebook Debugger
                </h3>
                <p className="text-sm text-neutral-600">
                  Test how your pages appear when shared on Facebook and other
                  Meta platforms.
                </p>
                <div className="text-xs text-neutral-500 mt-2">
                  developers.facebook.com/tools/debug/
                </div>
              </a>

              <a
                href="https://cards-dev.twitter.com/validator"
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-blue-400 mb-2">
                  Twitter Card Validator
                </h3>
                <p className="text-sm text-neutral-600">
                  Validate and preview Twitter Cards for your website pages.
                </p>
                <div className="text-xs text-neutral-500 mt-2">
                  cards-dev.twitter.com/validator
                </div>
              </a>

              <a
                href="https://www.linkedin.com/post-inspector/"
                target="_blank"
                rel="noopener noreferrer"
                className="card-base p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-blue-700 mb-2">
                  LinkedIn Inspector
                </h3>
                <p className="text-sm text-neutral-600">
                  Preview how your content appears when shared on LinkedIn.
                </p>
                <div className="text-xs text-neutral-500 mt-2">
                  linkedin.com/post-inspector/
                </div>
              </a>
            </div>
          </section>

          {/* Implementation Guide */}
          <section className="card-base p-6">
            <h2 className="text-2xl font-bold mb-4">Implementation Guide</h2>
            <div className="prose prose-sm max-w-none">
              <h3>Features Implemented:</h3>
              <ul>
                <li>
                  <strong>Dynamic Image Generation:</strong> Automatic OG and
                  Twitter Card image creation
                </li>
                <li>
                  <strong>Type-Specific Metadata:</strong> Different properties
                  for articles, websites, etc.
                </li>
                <li>
                  <strong>Twitter Card Types:</strong> Summary, Summary Large
                  Image, App, and Player cards
                </li>
                <li>
                  <strong>Fallback Images:</strong> Default images when dynamic
                  generation fails
                </li>
                <li>
                  <strong>Comprehensive Tags:</strong> All essential OpenGraph
                  and Twitter Card meta tags
                </li>
                <li>
                  <strong>Validation:</strong> Built-in validation for metadata
                  completeness
                </li>
                <li>
                  <strong>Platform Optimization:</strong> Optimized content for
                  Twitter&apos;s character limits
                </li>
              </ul>

              <h3>Key Components:</h3>
              <ul>
                <li>
                  <code>/lib/opengraph.ts</code> - OpenGraph utilities and image
                  generation
                </li>
                <li>
                  <code>/lib/twitter-cards.ts</code> - Twitter Card utilities
                  and validation
                </li>
                <li>
                  <code>/app/api/og/route.ts</code> - Dynamic OG image API
                  endpoint
                </li>
                <li>
                  <code>/app/api/twitter-card/route.ts</code> - Twitter Card
                  image API endpoint
                </li>
                <li>
                  <code>/lib/metadata.ts</code> - Enhanced metadata creation
                  functions
                </li>
                <li>
                  <code>/components/OpenGraphPreview.tsx</code> - OG preview and
                  testing component
                </li>
                <li>
                  <code>/components/TwitterCardPreview.tsx</code> - Twitter Card
                  preview component
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}
