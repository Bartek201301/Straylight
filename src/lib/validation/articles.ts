import { z } from 'zod';

// Base UUID validation schema
export const uuidSchema = z.string().uuid('Must be a valid UUID');

// Article status enum validation
const articleStatusSchema = z.enum(
  ['draft', 'pending', 'published', 'archived', 'rejected'],
  {
    message:
      'Status must be one of: draft, pending, published, archived, rejected',
  }
);

// Tag validation - single tag (alphanumeric, hyphens, underscores)
const tagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag cannot be longer than 50 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Tag can only contain letters, numbers, hyphens, and underscores'
  );

// Tags array validation
const tagsSchema = z
  .array(tagSchema)
  .max(10, 'Maximum 10 tags allowed')
  .default([]);

// Slug validation
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug cannot be longer than 100 characters')
  .regex(
    /^[a-z0-9-]+$/,
    'Slug can only contain lowercase letters, numbers, and hyphens'
  )
  .regex(
    /^[a-z0-9].*[a-z0-9]$|^[a-z0-9]$/,
    'Slug must start and end with alphanumeric characters'
  );

// Base article validation schema
const baseArticleSchema = {
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot be longer than 200 characters')
    .trim(),

  body_md: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content cannot be longer than 50,000 characters'),

  excerpt: z
    .string()
    .max(500, 'Excerpt cannot be longer than 500 characters')
    .optional(),

  status: articleStatusSchema.default('draft'),

  tags: tagsSchema,

  author_id: uuidSchema,

  // Optional cover image URL used on listing cards
  cover_image_url: z
    .string()
    .url('Cover image must be a valid URL')
    .or(z.string().regex(/^data:/, 'Cover image must be a valid data URL'))
    .optional(),
};

// CREATE article validation (POST)
export const createArticleSchema = z
  .object({
    ...baseArticleSchema,
    // Optional fields for creation (will be auto-generated if not provided)
    slug: slugSchema.optional(),
    excerpt: z
      .string()
      .max(500, 'Excerpt cannot be longer than 500 characters')
      .optional(),
  })
  .strict(); // Reject unknown fields

// UPDATE article validation (PUT)
export const updateArticleSchema = z
  .object({
    title: baseArticleSchema.title.optional(),
    body_md: baseArticleSchema.body_md.optional(),
    excerpt: baseArticleSchema.excerpt,
    status: baseArticleSchema.status.optional(),
    tags: baseArticleSchema.tags.optional(),
    cover_image_url: z
      .string()
      .url('Cover image must be a valid URL')
      .or(z.string().regex(/^data:/, 'Cover image must be a valid data URL'))
      .optional(),
    // Note: author_id and slug changes are handled separately with special logic
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Query parameters validation for GET requests
export const getArticlesQuerySchema = z.object({
  status: articleStatusSchema.optional(),
  author_id: uuidSchema.optional(),
  search: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query cannot be longer than 100 characters')
    .optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot be more than 100')
    .default(10),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .default(0),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for TypeScript
type _CreateArticleInput = z.infer<typeof createArticleSchema>;
type _UpdateArticleInput = z.infer<typeof updateArticleSchema>;
type _GetArticlesQuery = z.infer<typeof getArticlesQuerySchema>;
type _ArticleStatus = z.infer<typeof articleStatusSchema>;
