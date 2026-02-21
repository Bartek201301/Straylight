/**
 * Structured Data Schema Generation for SEO
 * Implements JSON-LD markup for rich search results
 */

import { DEFAULT_METADATA } from './metadata';

// ============================================================================
// SCHEMA TYPES AND INTERFACES
// ============================================================================

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleSchema {
  title: string;
  description: string;
  author: string | string[];
  publishedAt: string;
  modifiedAt?: string;
  image?: string;
  url: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
  wordCount?: number;
}

interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  foundingDate?: string;
  founders?: string[];
  sameAs?: string[];
  contactPoint?: {
    email?: string;
    telephone?: string;
    contactType: string;
  };
}

interface WebsiteSchema {
  name: string;
  url: string;
  description: string;
  inLanguage?: string;
  publisher?: string;
  potentialAction?: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

interface PersonSchema {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: string;
  sameAs?: string[];
  description?: string;
}

// ============================================================================
// CORE STRUCTURED DATA FUNCTIONS
// ============================================================================

/**
 * Generate Organization schema markup
 */
export function generateOrganizationSchema(
  overrides: Partial<OrganizationSchema> = {}
) {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: DEFAULT_METADATA.siteName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: DEFAULT_METADATA.defaultDescription,
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: DEFAULT_METADATA.creator,
      },
    ],
    sameAs: [
      'https://twitter.com/straylight_dev',
      'https://linkedin.com/company/straylight-ai',
      'https://github.com/straylight-ai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@straylight.ai',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    ...overrides,
  };

  return organization;
}

/**
 * Generate Website schema markup
 */
export function generateWebsiteSchema(overrides: Partial<WebsiteSchema> = {}) {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_METADATA.siteName,
    url: baseUrl,
    description: DEFAULT_METADATA.defaultDescription,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_METADATA.siteName,
      url: baseUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    ...overrides,
  };

  return website;
}

/**
 * Generate Article schema markup
 */
export function generateArticleSchema({
  title,
  description,
  author,
  publishedAt,
  modifiedAt,
  image,
  url,
  tags = [],
  category,
  readingTime,
  wordCount,
}: ArticleSchema) {
  const baseUrl = DEFAULT_METADATA.baseUrl;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const imageUrl = image?.startsWith('http')
    ? image
    : `${baseUrl}${image || '/og-default.jpg'}`;

  // Handle multiple authors
  const authorData = Array.isArray(author)
    ? author.map((name) => ({
        '@type': 'Person',
        name,
        url: `${baseUrl}/authors/${name.toLowerCase().replace(/\s+/g, '-')}`,
      }))
    : {
        '@type': 'Person',
        name: author,
        url: `${baseUrl}/authors/${author.toLowerCase().replace(/\s+/g, '-')}`,
      };

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    author: authorData,
    publisher: {
      '@type': 'Organization',
      name: DEFAULT_METADATA.siteName,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    url: fullUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
    ...(category && {
      articleSection: category,
      about: {
        '@type': 'Thing',
        name: category,
      },
    }),
    ...(tags.length > 0 && {
      keywords: tags,
      mentions: tags.map((tag) => ({
        '@type': 'Thing',
        name: tag,
      })),
    }),
    ...(readingTime && {
      timeRequired: `PT${readingTime}M`,
    }),
    ...(wordCount && {
      wordCount,
    }),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    creativeWorkStatus: 'Published',
  };

  return article;
}

/**
 * Generate Person schema markup
 */
function _generatePersonSchema({
  name,
  url,
  image,
  jobTitle,
  worksFor,
  sameAs = [],
  description,
}: PersonSchema) {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image.startsWith('http') ? image : `${baseUrl}${image}`,
      },
    }),
    ...(jobTitle && { jobTitle }),
    ...(worksFor && {
      worksFor: {
        '@type': 'Organization',
        name: worksFor,
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(description && { description }),
  };

  return person;
}

/**
 * Generate BreadcrumbList schema markup
 */
export function generateBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`,
    })),
  };

  return breadcrumbList;
}

/**
 * Generate FAQ schema markup
 */
function _generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  const faqPage = {
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

  return faqPage;
}

/**
 * Generate Course schema markup (for educational content)
 */
function _generateCourseSchema({
  name,
  description,
  provider,
  url,
  image,
  datePublished,
  author,
}: {
  name: string;
  description: string;
  provider: string;
  url: string;
  image?: string;
  datePublished: string;
  author: string;
}) {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
      url: baseUrl,
    },
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
    ...(image && {
      image: image.startsWith('http') ? image : `${baseUrl}${image}`,
    }),
    datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };

  return course;
}

/**
 * Generate JobPosting schema markup
 */
function _generateJobPostingSchema({
  title,
  description,
  company,
  location,
  employmentType,
  datePosted,
  validThrough,
  url,
  salary,
}: {
  title: string;
  description: string;
  company: string;
  location: string;
  employmentType: string;
  datePosted: string;
  validThrough?: string;
  url: string;
  salary?: {
    currency: string;
    minValue: number;
    maxValue: number;
  };
}) {
  const baseUrl = DEFAULT_METADATA.baseUrl;

  const jobPosting = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    hiringOrganization: {
      '@type': 'Organization',
      name: company,
      url: baseUrl,
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
    ...(validThrough && { validThrough }),
    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
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

  return jobPosting;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Combine multiple schemas into a single JSON-LD script
 */
export function combineSchemas(schemas: any[]): string {
  const validSchemas = schemas.filter(
    (schema) => schema && typeof schema === 'object'
  );

  if (validSchemas.length === 0) {
    return '';
  }

  if (validSchemas.length === 1) {
    return JSON.stringify(validSchemas[0], null, 0);
  }

  // Multiple schemas - use @graph
  const combined = {
    '@context': 'https://schema.org',
    '@graph': validSchemas,
  };

  return JSON.stringify(combined, null, 0);
}

/**
 * Generate script tag with structured data
 */
function _generateStructuredDataScript(schemas: any[]): string {
  const jsonLd = combineSchemas(schemas);

  if (!jsonLd) {
    return '';
  }

  return `<script type="application/ld+json">${jsonLd}</script>`;
}

/**
 * Validate structured data schema
 */
export function validateSchema(schema: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema must be a valid object');
    return { isValid: false, errors, warnings };
  }

  if (!schema['@context']) {
    errors.push('Missing @context property');
  }

  if (!schema['@type']) {
    errors.push('Missing @type property');
  }

  // Type-specific validation
  if (schema['@type'] === 'Article') {
    if (!schema.headline) errors.push('Article missing headline');
    if (!schema.author) errors.push('Article missing author');
    if (!schema.datePublished) errors.push('Article missing datePublished');
    if (!schema.publisher) errors.push('Article missing publisher');

    if (schema.headline && schema.headline.length > 110) {
      warnings.push(
        'Article headline is longer than recommended 110 characters'
      );
    }
  }

  if (schema['@type'] === 'Organization') {
    if (!schema.name) errors.push('Organization missing name');
    if (!schema.url) errors.push('Organization missing url');
  }

  if (schema['@type'] === 'BreadcrumbList') {
    if (!Array.isArray(schema.itemListElement)) {
      errors.push('BreadcrumbList missing itemListElement array');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate structured data for common page types
 */
function _generatePageStructuredData({
  pageType,
  breadcrumbs = [],
  article,
}: {
  pageType: 'home' | 'article' | 'category' | 'about' | 'contact';
  title: string;
  description: string;
  url: string;
  breadcrumbs?: BreadcrumbItem[];
  article?: ArticleSchema;
}) {
  const schemas: any[] = [];

  // Always include organization and website
  schemas.push(generateOrganizationSchema());
  schemas.push(generateWebsiteSchema());

  // Add breadcrumbs if provided
  if (breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs));
  }

  // Add page-specific schemas
  switch (pageType) {
    case 'article':
      if (article) {
        schemas.push(generateArticleSchema(article));
      }
      break;

    case 'home':
      // Homepage might include additional schemas like search action
      break;

    case 'category':
      // Category pages might include collection schemas
      break;
  }

  return schemas;
}

/**
 * Create breadcrumbs from URL path
 */
export function createBreadcrumbsFromPath(
  path: string,
  customLabels: Record<string, string> = {}
): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', url: '/' }];

  let currentPath = '';

  segments.forEach((segment, _index) => {
    currentPath += `/${segment}`;

    // Use custom label if provided, otherwise format segment
    const name =
      customLabels[segment] ||
      segment.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    breadcrumbs.push({
      name,
      url: currentPath,
    });
  });

  return breadcrumbs;
}
