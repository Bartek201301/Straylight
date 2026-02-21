/**
 * Enhanced Structured Data Components
 * Integrates with the comprehensive structured data utilities
 */

import {
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
  combineSchemas,
  createBreadcrumbsFromPath,
  type ArticleSchema,
  type BreadcrumbItem,
} from '@/lib/seo/structured-data';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body_md?: string; // Optional for article lists
  status: string;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string;
}

/**
 * Generic structured data component
 */
interface StructuredDataComponentProps {
  schemas: any[];
  className?: string;
}

function StructuredDataComponent({
  schemas,
  className = '',
}: StructuredDataComponentProps) {
  const jsonLd = combineSchemas(schemas);

  if (!jsonLd) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      className={className}
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}

interface ArticleListStructuredDataProps {
  articles: Article[];
}

interface SingleArticleStructuredDataProps {
  article: Article & {
    body_md: string; // Required for single article
  };
}

// Article List Structured Data for the articles listing page
export function ArticleListStructuredData({
  articles,
}: ArticleListStructuredDataProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://straylight.dev';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'StrayLight Articles - AI Career Guidance & Technology Insights',
    description:
      'A collection of expert insights and guidance on navigating the AI-driven future of work, covering career development, technology trends, and professional growth.',
    url: `${baseUrl}/articles`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          '@id': `${baseUrl}/articles/${article.slug}`,
          headline: article.title,
          description:
            article.excerpt || `Read "${article.title}" on StrayLight`,
          url: `${baseUrl}/articles/${article.slug}`,
          datePublished: article.published_at || article.created_at,
          dateModified: article.updated_at,
          author: {
            '@type': 'Organization',
            name: 'StrayLight Team',
            url: baseUrl,
          },
          publisher: {
            '@type': 'Organization',
            name: 'StrayLight',
            url: baseUrl,
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`,
              width: 400,
              height: 400,
            },
          },
          keywords: article.tags.join(', '),
        },
      })),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Articles',
          item: `${baseUrl}/articles`,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

// Single Article Structured Data for individual article pages
export function SingleArticleStructuredData({
  article,
}: SingleArticleStructuredDataProps) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://straylight.dev';

  // Calculate reading time
  const wordCount = article.body_md?.split(/\s+/).length || 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Extract description
  const description =
    article.excerpt ||
    article.body_md
      ?.slice(0, 155)
      .replace(/[#*`\[\]]/g, '')
      .trim() + '...' ||
    `Read "${article.title}" on StrayLight`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${baseUrl}/articles/${article.slug}#article`,
    headline: article.title,
    name: article.title,
    description: description,
    url: `${baseUrl}/articles/${article.slug}`,
    identifier: `${baseUrl}/articles/${article.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/articles/${article.slug}`,
      url: `${baseUrl}/articles/${article.slug}`,
      name: article.title,
      description: description,
      inLanguage: 'en-US',
      isAccessibleForFree: true,
    },
    author: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'StrayLight',
      url: baseUrl,
      description: 'Empowering Gen-Z professionals for the AI-driven future',
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'StrayLight',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 400,
        height: 400,
        caption: 'StrayLight Logo',
      },
      description:
        'Empowering Gen-Z professionals for the AI-driven future through expert insights and career guidance',
    },
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.created_at,
    dateCreated: article.created_at,
    inLanguage: 'en-US',
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    copyrightYear: new Date(article.created_at).getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'StrayLight',
    },
    license: 'All Rights Reserved',
    keywords:
      article.tags?.join(', ') ||
      'AI, technology, career, professional development',
    about: [
      {
        '@type': 'Thing',
        name: 'Artificial Intelligence',
        sameAs: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
        description: 'Technology that simulates human intelligence',
      },
      {
        '@type': 'Thing',
        name: 'Career Development',
        sameAs: 'https://en.wikipedia.org/wiki/Career_development',
        description: 'The process of managing life, learning and work',
      },
      {
        '@type': 'Thing',
        name: 'Professional Development',
        sameAs: 'https://en.wikipedia.org/wiki/Professional_development',
        description: 'Learning to earn or maintain professional credentials',
      },
    ],
    mentions: [
      {
        '@type': 'Thing',
        name: 'Generation Z',
        sameAs: 'https://en.wikipedia.org/wiki/Generation_Z',
        description: 'Demographic cohort born between 1997 and 2012',
      },
    ],
    // Reading time and engagement metrics
    timeRequired: `PT${readingTimeMinutes}M`,
    wordCount: wordCount,
    articleSection: 'Technology',
    genre: [
      'Technology',
      'Career Guidance',
      'Professional Development',
      'Education',
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Gen-Z Professionals',
      geographicArea: 'Global',
      suggestedMinAge: 18,
      suggestedMaxAge: 35,
    },
    // Engagement and interaction data
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ReadAction',
        userInteractionCount: article.view_count || 0,
      },
    ],
    // Breadcrumb navigation
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Articles',
          item: `${baseUrl}/articles`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `${baseUrl}/articles/${article.slug}`,
        },
      ],
    },
    // Website and organization context
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}#website`,
      name: 'StrayLight',
      url: baseUrl,
      description: 'Empowering Gen-Z professionals for the AI-driven future',
      inLanguage: 'en-US',
      publisher: {
        '@id': `${baseUrl}#organization`,
      },
    },
    // Article taxonomy
    articleBody: article.body_md,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [
        '.article-content h1',
        '.article-content h2',
        '.article-content p',
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  );
}

// Organization Structured Data for the main website
export function OrganizationStructuredData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://straylight.dev';

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'StrayLight',
    alternateName: ['Stray Light', 'StrayLight Platform'],
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      '@id': `${baseUrl}#logo`,
      url: `${baseUrl}/logo.png`,
      contentUrl: `${baseUrl}/logo.png`,
      width: 400,
      height: 400,
      caption: 'StrayLight - Empowering Gen-Z for the AI-driven future',
    },
    image: {
      '@type': 'ImageObject',
      url: `${baseUrl}/og-image.jpg`,
      width: 1200,
      height: 630,
      caption: 'StrayLight Platform',
    },
    description:
      'Empowering Gen-Z professionals for the AI-driven future through expert insights, career guidance, and curated resources.',
    slogan: 'Navigate the AI-driven future',
    foundingDate: '2024',
    foundingLocation: {
      '@type': 'Place',
      name: 'Remote-First Organization',
    },
    mission:
      'Bridge the gap between dense research and practical career guidance for Gen-Z professionals entering the AI-driven job market.',
    keywords:
      'AI career guidance, Gen-Z professionals, technology trends, artificial intelligence, career development, professional skills, education technology',
    industry: 'Education Technology',
    sector: 'Technology',
    naics: '611710', // Educational Support Services
    knowsAbout: [
      'Artificial Intelligence',
      'Career Development',
      'Technology Trends',
      'Professional Skills Development',
      'Generation Z Workforce',
      'Future of Work',
      'Digital Transformation',
      'Professional Education',
    ],
    serviceArea: {
      '@type': 'Place',
      name: 'Global',
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Gen-Z Professionals',
      geographicArea: 'Global',
      suggestedMinAge: 18,
      suggestedMaxAge: 35,
    },
    memberOf: {
      '@type': 'Organization',
      name: 'EdTech Community',
    },
    // Social media and external profiles
    sameAs: [
      'https://twitter.com/straylight_dev',
      'https://linkedin.com/company/straylight',
    ],
    // Contact information
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['English'],
        areaServed: 'Global',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'Technical Support',
        availableLanguage: ['English'],
        areaServed: 'Global',
      },
    ],
    // Business model and offerings
    offers: [
      {
        '@type': 'Service',
        name: 'Career Guidance Articles',
        description: 'Expert insights on navigating AI-driven career paths',
        provider: {
          '@id': `${baseUrl}#organization`,
        },
      },
      {
        '@type': 'Service',
        name: 'Technology Resources',
        description: 'Curated library of AI tools and educational resources',
        provider: {
          '@id': `${baseUrl}#organization`,
        },
      },
    ],
    // Geographic and operational details
    location: {
      '@type': 'VirtualLocation',
      name: 'Remote-First Platform',
    },
    // Additional organizational details
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      name: 'Small Team',
    },
    organizationType: 'Educational Platform',
    parentOrganization: null,
    subOrganization: [],
    // Awards and recognition (placeholder for future)
    award: [],
    // Financial information (if applicable)
    founders: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationData, null, 2),
      }}
    />
  );
}

// Website Structured Data for the main site
export function WebsiteStructuredData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://straylight.dev';

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    name: 'StrayLight',
    alternateName: 'StrayLight Platform',
    url: baseUrl,
    description:
      'Empowering Gen-Z professionals for the AI-driven future through expert insights, career guidance, and curated resources.',
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@id': `${baseUrl}#organization`,
    },
    publisher: {
      '@id': `${baseUrl}#organization`,
    },
    mainEntity: {
      '@id': `${baseUrl}#organization`,
    },
    // Site navigation
    hasPart: [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/articles`,
        name: 'Articles',
        description: 'Expert insights on AI and career development',
        url: `${baseUrl}/articles`,
      },
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/library`,
        name: 'Library',
        description: 'Curated resources and tools for professional development',
        url: `${baseUrl}/library`,
      },
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/research`,
        name: 'Research',
        description: 'Latest research and insights on AI and future of work',
        url: `${baseUrl}/research`,
      },
    ],
    // Search functionality
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    // Audience and targeting
    audience: {
      '@type': 'Audience',
      audienceType: 'Gen-Z Professionals',
      geographicArea: 'Global',
    },
    about: {
      '@type': 'Thing',
      name: 'AI Career Development',
      description:
        'Resources and guidance for navigating AI-driven career paths',
    },
    keywords:
      'AI careers, technology trends, professional development, Gen-Z workforce, future of work',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData, null, 2) }}
    />
  );
}

// ============================================================================
// ENHANCED STRUCTURED DATA COMPONENTS
// ============================================================================

/**
 * Enhanced Article structured data using new utilities
 */
function _EnhancedArticleStructuredData({
  article,
  breadcrumbs = [],
}: {
  article: Article & { body_md: string };
  breadcrumbs?: BreadcrumbItem[];
}) {
  const articleData: ArticleSchema = {
    title: article.title,
    description:
      article.excerpt ||
      article.body_md
        .slice(0, 160)
        .replace(/[#*`\[\]]/g, '')
        .trim() + '...',
    author: 'StrayLight Team',
    publishedAt: article.published_at || article.created_at,
    modifiedAt: article.updated_at,
    url: `/articles/${article.slug}`,
    tags: article.tags,
    category: 'Technology',
    readingTime: Math.max(
      1,
      Math.ceil((article.body_md?.split(/\s+/).length || 0) / 200)
    ),
    wordCount: article.body_md?.split(/\s+/).length || 0,
  };

  const schemas: any[] = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    generateArticleSchema(articleData),
    ...(breadcrumbs.length > 0 ? [generateBreadcrumbSchema(breadcrumbs)] : []),
  ];

  return <StructuredDataComponent schemas={schemas} />;
}

/**
 * Page-specific structured data generator
 */
export function PageStructuredData({
  pageType,
  title,
  description,
  path,
  customBreadcrumbs,
  article,
}: {
  pageType:
    | 'home'
    | 'articles'
    | 'research'
    | 'library'
    | 'about'
    | 'article'
    | 'newsletter'
    | 'suggest-resource'
    | 'legal';
  title: string;
  description: string;
  path: string;
  customBreadcrumbs?: BreadcrumbItem[];
  article?: Article & { body_md: string };
}) {
  const schemas: any[] = [
    generateOrganizationSchema(),
    generateWebsiteSchema({
      name: title,
      description,
    }),
  ];

  // Add breadcrumbs
  const breadcrumbs =
    customBreadcrumbs ||
    createBreadcrumbsFromPath(path, {
      articles: 'Articles',
      research: 'Research',
      library: 'Library',
      about: 'About',
    });

  if (breadcrumbs.length > 1) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs));
  }

  // Add page-specific schemas
  if (pageType === 'article' && article) {
    const articleData: ArticleSchema = {
      title: article.title,
      description:
        article.excerpt ||
        article.body_md
          .slice(0, 160)
          .replace(/[#*`\[\]]/g, '')
          .trim() + '...',
      author: 'StrayLight Team',
      publishedAt: article.published_at || article.created_at,
      modifiedAt: article.updated_at,
      url: `/articles/${article.slug}`,
      tags: article.tags,
      category: 'Technology',
      readingTime: Math.max(
        1,
        Math.ceil((article.body_md?.split(/\s+/).length || 0) / 200)
      ),
      wordCount: article.body_md?.split(/\s+/).length || 0,
    };

    schemas.push(generateArticleSchema(articleData));
  }

  return <StructuredDataComponent schemas={schemas} />;
}

/**
 * FAQ structured data component
 */
export function FAQStructuredData({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredDataComponent schemas={[faqSchema]} />;
}

/**
 * Search results structured data
 */
function _SearchResultsStructuredData({
  query,
  results,
  totalResults,
}: {
  query: string;
  results: Array<{
    title: string;
    description: string;
    url: string;
    type: 'article' | 'page';
  }>;
  totalResults: number;
}) {
  const searchResultsSchema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Search Results for "${query}"`,
    description: `Found ${totalResults} results for "${query}" on StrayLight`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: results.length,
      itemListElement: results.map((result, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': result.type === 'article' ? 'Article' : 'WebPage',
          name: result.title,
          description: result.description,
          url: result.url,
        },
      })),
    },
    breadcrumb: generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Search', url: '/search' },
    ]),
  };

  return <StructuredDataComponent schemas={[searchResultsSchema]} />;
}

/**
 * Job posting structured data (for career-related content)
 */
function _JobPostingStructuredData({
  title,
  description,
  company,
  location,
  employmentType,
  datePosted,
  salary,
  url,
}: {
  title: string;
  description: string;
  company: string;
  location: string;
  employmentType: string;
  datePosted: string;
  url: string;
  salary?: {
    currency: string;
    minValue: number;
    maxValue: number;
  };
}) {
  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
      },
    },
    employmentType,
    datePosted,
    url,
    ...(salary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: salary.currency,
        value: {
          '@type': 'QuantitativeValue',
          minValue: salary.minValue,
          maxValue: salary.maxValue,
          unitText: 'YEAR',
        },
      },
    }),
  };

  return <StructuredDataComponent schemas={[jobSchema]} />;
}

/**
 * Course/Educational content structured data
 */
export function CourseStructuredData({
  name,
  description,
  provider,
  url,
  author,
  datePublished,
  image,
}: {
  name: string;
  description: string;
  provider: string;
  url: string;
  author: string;
  datePublished: string;
  image?: string;
}) {
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
    },
    url,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    ...(image && { image }),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };

  return <StructuredDataComponent schemas={[courseSchema]} />;
}

// Main export for backward compatibility
function _StructuredData({ type }: { type: 'organization' }) {
  if (type === 'organization') {
    return <OrganizationStructuredData />;
  }
  return null;
}
