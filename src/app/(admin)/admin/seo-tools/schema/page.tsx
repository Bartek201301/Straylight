import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import Container from '@/components/layout/Container';
import StructuredDataValidator from '@/components/seo/StructuredDataValidator';
import {
  PageStructuredData,
  FAQStructuredData,
  CourseStructuredData,
} from '@/components/seo/StructuredData';

export const metadata: Metadata = createMetadata({
  title: 'Schema Validator | Admin SEO Tools - StrayLight',
  description:
    'Administrative tool to test and validate JSON-LD structured data schemas for enhanced search engine understanding and rich results display.',
  keywords: [
    'structured data',
    'JSON-LD',
    'schema.org',
    'rich results',
    'SEO schema',
    'search engine optimization',
    'schema markup',
    'admin tools',
  ],
  path: '/admin/seo-tools/schema',
});

// Sample FAQ data for testing
const sampleFAQs = [
  {
    question: 'What is structured data?',
    answer:
      'Structured data is a standardized format for providing information about a page and classifying the page content. It helps search engines understand your content better and can enable rich results in search.',
  },
  {
    question: 'Why is JSON-LD preferred for structured data?',
    answer:
      "JSON-LD is preferred because it separates structured data from HTML markup, making it easier to maintain and less prone to errors. It's also Google's recommended format for structured data.",
  },
  {
    question: 'How do I validate my structured data?',
    answer:
      "You can use Google's Rich Results Test, Schema.org validator, or other structured data testing tools to validate your JSON-LD markup and ensure it follows proper schema guidelines.",
  },
];

export default function StructuredDataTestPage() {
  return (
    <>
      {/* Page Structured Data */}
      <PageStructuredData
        pageType="about"
        title="Structured Data Testing"
        description="Test and validate JSON-LD structured data schemas"
        path="/test-structured-data"
      />

      {/* FAQ Structured Data */}
      <FAQStructuredData faqs={sampleFAQs} />

      {/* Course Structured Data (example) */}
      <CourseStructuredData
        name="Understanding Structured Data for SEO"
        description="Learn how to implement and validate structured data for better search engine visibility"
        provider="StrayLight"
        url="/test-structured-data"
        author="StrayLight Team"
        datePublished={new Date().toISOString()}
        image="/og-default.jpg"
      />

      <Container>
        <div className="py-12">
          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Structured Data Testing
              </h1>
              <p className="text-xl text-neutral-400 mb-6">
                Test and validate JSON-LD structured data schemas for enhanced
                search engine understanding and rich results display.
              </p>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h2 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
                  🎯 Task 26.5 Implementation
                </h2>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  This page demonstrates the comprehensive structured data
                  schema implementation with JSON-LD markup for articles,
                  organization, website, and other content types.
                </p>
              </div>
            </header>

            {/* Structured Data Validator */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                Structured Data Analysis
              </h2>
              <StructuredDataValidator />
            </section>

            {/* Schema Types Overview */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                Implemented Schema Types
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3 text-blue-600">
                    Organization
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Complete organization schema with contact info, social
                    profiles, and business details.
                  </p>
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    <strong>Properties:</strong> name, url, logo, description,
                    sameAs, contactPoint
                  </div>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3 text-green-600">
                    Article
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Rich article schema with author, publisher, reading time,
                    and engagement data.
                  </p>
                  <div className="text-xs bg-green-50 p-2 rounded">
                    <strong>Properties:</strong> headline, author,
                    datePublished, publisher, wordCount
                  </div>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3 text-purple-600">
                    WebSite
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Website schema with search functionality and site navigation
                    structure.
                  </p>
                  <div className="text-xs bg-purple-50 p-2 rounded">
                    <strong>Properties:</strong> name, url, potentialAction,
                    hasPart
                  </div>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3 text-orange-600">
                    BreadcrumbList
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Navigation breadcrumb schema for better site structure
                    understanding.
                  </p>
                  <div className="text-xs bg-orange-50 p-2 rounded">
                    <strong>Properties:</strong> itemListElement, position,
                    name, item
                  </div>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3 text-red-600">
                    FAQPage
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    FAQ schema for rich snippet display in search results.
                  </p>
                  <div className="text-xs bg-red-50 p-2 rounded">
                    <strong>Properties:</strong> mainEntity, Question,
                    acceptedAnswer
                  </div>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3 text-indigo-600">
                    Course
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Educational content schema for course and learning material
                    markup.
                  </p>
                  <div className="text-xs bg-indigo-50 p-2 rounded">
                    <strong>Properties:</strong> name, provider, author,
                    datePublished
                  </div>
                </div>
              </div>
            </section>

            {/* Sample FAQ Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                Sample FAQ (with FAQ Schema)
              </h2>
              <div className="space-y-4">
                {sampleFAQs.map((faq, index) => (
                  <details key={index} className="card-base p-4">
                    <summary className="font-semibold cursor-pointer hover:text-blue-600 transition-colors">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-neutral-600 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* SEO Benefits */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">SEO Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3">Rich Results</h3>
                  <ul className="text-sm text-neutral-600 space-y-2">
                    <li>• Enhanced search result snippets</li>
                    <li>• FAQ accordions in search results</li>
                    <li>• Article metadata display</li>
                    <li>• Breadcrumb navigation</li>
                    <li>• Organization knowledge panel</li>
                  </ul>
                </div>

                <div className="card-base p-6">
                  <h3 className="font-semibold text-lg mb-3">
                    Search Engine Understanding
                  </h3>
                  <ul className="text-sm text-neutral-600 space-y-2">
                    <li>• Better content categorization</li>
                    <li>• Enhanced topical authority</li>
                    <li>• Improved content relationships</li>
                    <li>• Clearer site structure</li>
                    <li>• Enhanced entity recognition</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Implementation Guide */}
            <section className="card-base p-6">
              <h2 className="text-2xl font-bold mb-4">
                Implementation Details
              </h2>
              <div className="prose prose-sm max-w-none">
                <h3>Core Features:</h3>
                <ul>
                  <li>
                    <strong>Comprehensive Schema Library:</strong> Organization,
                    Article, Website, BreadcrumbList, FAQ, Course, JobPosting
                  </li>
                  <li>
                    <strong>Dynamic Generation:</strong> Context-aware schema
                    generation based on page content
                  </li>
                  <li>
                    <strong>Validation System:</strong> Built-in validation for
                    schema correctness and best practices
                  </li>
                  <li>
                    <strong>Multiple Schema Support:</strong> Combines multiple
                    schemas using @graph structure
                  </li>
                  <li>
                    <strong>SEO Optimization:</strong> Follows Google&apos;s
                    structured data guidelines
                  </li>
                  <li>
                    <strong>Rich Results Ready:</strong> Optimized for rich
                    snippet display
                  </li>
                </ul>

                <h3>Key Components:</h3>
                <ul>
                  <li>
                    <code>/lib/structured-data.ts</code> - Core schema
                    generation utilities
                  </li>
                  <li>
                    <code>/components/StructuredData.tsx</code> - React
                    components for schema injection
                  </li>
                  <li>
                    <code>/components/StructuredDataValidator.tsx</code> -
                    Testing and validation component
                  </li>
                  <li>
                    <code>/app/test-structured-data/page.tsx</code> - This
                    comprehensive test page
                  </li>
                </ul>

                <h3>Schema Types Implemented:</h3>
                <ul>
                  <li>
                    <strong>Organization:</strong> Business information, contact
                    details, social profiles
                  </li>
                  <li>
                    <strong>Article:</strong> Content metadata, author info,
                    publishing dates, reading time
                  </li>
                  <li>
                    <strong>WebSite:</strong> Site information, search
                    functionality, navigation structure
                  </li>
                  <li>
                    <strong>BreadcrumbList:</strong> Navigation hierarchy for
                    better UX and SEO
                  </li>
                  <li>
                    <strong>FAQPage:</strong> Question-answer pairs for rich
                    snippet display
                  </li>
                  <li>
                    <strong>Course:</strong> Educational content markup for
                    learning materials
                  </li>
                  <li>
                    <strong>JobPosting:</strong> Career-related content with job
                    details and salary info
                  </li>
                  <li>
                    <strong>Person:</strong> Author and contributor information
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
