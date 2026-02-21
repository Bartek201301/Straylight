import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import { PageStructuredData } from '@/components/seo/StructuredData';
import ArticlesPageContent from '@/components/articles/ArticlesPageContent';

// Enhanced SEO metadata with structured data integration
export const metadata: Metadata = createMetadata({
  title: 'Articles | StrayLight - AI Career Guidance & Technology Insights',
  description:
    'Discover expert insights and guidance on navigating the AI-driven future of work. Read articles about career development, technology trends, and professional growth in the digital age.',
  keywords: [
    'AI career guidance',
    'technology articles',
    'career development',
    'artificial intelligence',
    'professional development',
    'tech industry insights',
    'future of work',
    'programming career',
    'software development',
    'technology trends',
  ],
  path: '/articles',
});

// Revalidate every hour
export const revalidate = 3600;

export default function ArticlesPage() {
  return (
    <>
      {/* Enhanced Structured Data */}
      <PageStructuredData
        pageType="articles"
        title="Articles | StrayLight - AI Career Guidance & Technology Insights"
        description="Discover expert insights and guidance on navigating the AI-driven future of work. Read articles about career development, technology trends, and professional growth in the digital age."
        path="/articles"
      />

      <ArticlesPageContent />
    </>
  );
}
