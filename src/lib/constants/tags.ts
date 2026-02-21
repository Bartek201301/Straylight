interface CategoryTag {
  label: string;
  slug: string;
}

export const CATEGORY_TAGS: CategoryTag[] = [
  { label: 'Machine Learning', slug: 'machine-learning' },
  { label: 'Deep Learning', slug: 'deep-learning' },
  { label: 'Natural Language Processing (NLP)', slug: 'nlp' },
  { label: 'Computer Vision', slug: 'computer-vision' },
  { label: 'Generative AI', slug: 'generative-ai' },
  { label: 'AI Ethics & Policy', slug: 'ai-ethics-policy' },
  { label: 'Data Engineering', slug: 'data-engineering' },
  { label: 'Cloud & Infrastructure', slug: 'cloud-infrastructure' },
  { label: 'Tools & Frameworks', slug: 'tools-frameworks' },
];

export const ALLOWED_TAG_SLUGS = new Set<string>(
  CATEGORY_TAGS.map((c) => c.slug)
);

const _TAG_SLUG_TO_LABEL: Record<string, string> = CATEGORY_TAGS.reduce(
  (acc, t) => {
    acc[t.slug] = t.label;
    return acc;
  },
  {} as Record<string, string>
);
