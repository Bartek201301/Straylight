import { z } from 'zod';

// Enum for affiliate item types
const AffiliateItemType = z.enum([
  'book',
  'tool',
  'course',
  'podcast',
  'dataset',
  'website',
  'paper',
  'other',
]);

// Enum for price ranges (for tools)
const PriceRange = z.enum([
  'free',
  'under-50',
  '50-100',
  '100-200',
  'over-200',
]);

// Base schema for affiliate library items
const AffiliateLibraryItemSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must not exceed 300 characters')
    .trim(),

  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .optional()
    .nullable(),

  type: AffiliateItemType,

  author: z
    .string()
    .max(200, 'Author must not exceed 200 characters')
    .trim()
    .optional()
    .nullable(),

  rating: z
    .number()
    .min(1.0, 'Rating must be at least 1.0')
    .max(5.0, 'Rating must not exceed 5.0')
    .multipleOf(0.1, 'Rating must have at most one decimal place')
    .optional()
    .nullable(),

  affiliate_url: z
    .string()
    .url('Affiliate URL must be a valid URL')
    .regex(/^https?:\/\//, 'Affiliate URL must use HTTP or HTTPS'),

  image_url: z
    .string()
    .url('Image URL must be a valid URL')
    .regex(/^https?:\/\//, 'Image URL must use HTTP or HTTPS')
    .optional()
    .nullable(),

  tags: z
    .array(z.string().trim().min(1))
    .default([])
    .refine(
      (tags) => tags.length === new Set(tags).size,
      'Tags must be unique'
    ),

  // Book-specific fields
  isbn: z
    .string()
    .max(20, 'ISBN must not exceed 20 characters')
    .regex(/^[0-9\-X]*$/, 'ISBN must contain only numbers, hyphens, and X')
    .trim()
    .optional()
    .nullable(),

  publisher: z
    .string()
    .max(200, 'Publisher must not exceed 200 characters')
    .trim()
    .optional()
    .nullable(),

  publication_year: z
    .number()
    .int('Publication year must be an integer')
    .min(1900, 'Publication year must be 1900 or later')
    .max(
      new Date().getFullYear() + 2,
      'Publication year cannot be more than 2 years in the future'
    )
    .optional()
    .nullable(),

  // Tool-specific fields
  price_range: PriceRange.optional().nullable(),

  // Metrics and status
  click_count: z.number().int().min(0).default(0).optional(),
  is_active: z.boolean().default(true).optional(),

  // Timestamps
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Schema for creating new affiliate library items
export const CreateAffiliateLibraryItemSchema = AffiliateLibraryItemSchema.omit(
  {
    id: true,
    click_count: true,
    created_at: true,
    updated_at: true,
  }
);

// Schema for updating affiliate library items
export const UpdateAffiliateLibraryItemSchema = AffiliateLibraryItemSchema.omit(
  {
    id: true,
    created_at: true,
    updated_at: true,
  }
)
  .partial()
  .refine(
    (data) => {
      // If type is provided and is 'book', ensure author is also provided if not already set
      if (data.type === 'book' && data.author !== undefined) {
        return data.author && data.author.length > 0;
      }
      return true;
    },
    {
      message: 'Books must have an author',
      path: ['author'],
    }
  );

// Schema for query parameters (filtering)
export const AffiliateLibraryQuerySchema = z
  .object({
    type: AffiliateItemType.optional(),
    rating_min: z.number().min(1.0).max(5.0).optional(),
    rating_max: z.number().min(1.0).max(5.0).optional(),
    tags: z.array(z.string()).optional(),
    search: z.string().optional(),
    is_active: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(20).optional(),
    offset: z.number().int().min(0).default(0).optional(),
    sort_by: z
      .enum(['rating', 'created_at', 'title', 'click_count'])
      .default('rating')
      .optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc').optional(),
  })
  .refine(
    (data) => {
      // Ensure rating_min is not greater than rating_max
      if (data.rating_min && data.rating_max) {
        return data.rating_min <= data.rating_max;
      }
      return true;
    },
    {
      message: 'Minimum rating cannot be greater than maximum rating',
      path: ['rating_min'],
    }
  );

// Type exports
type _AffiliateLibraryItem = z.infer<typeof AffiliateLibraryItemSchema>;
type _CreateAffiliateLibraryItem = z.infer<
  typeof CreateAffiliateLibraryItemSchema
>;
type _UpdateAffiliateLibraryItem = z.infer<
  typeof UpdateAffiliateLibraryItemSchema
>;
type _AffiliateLibraryQuery = z.infer<typeof AffiliateLibraryQuerySchema>;
type _AffiliateItemTypeEnum = z.infer<typeof AffiliateItemType>;
type _PriceRangeEnum = z.infer<typeof PriceRange>;

// Utility functions for validation
const _validateAffiliateLibraryItem = (data: unknown) => {
  return AffiliateLibraryItemSchema.safeParse(data);
};

const _validateCreateAffiliateLibraryItem = (data: unknown) => {
  return CreateAffiliateLibraryItemSchema.safeParse(data);
};

const _validateUpdateAffiliateLibraryItem = (data: unknown) => {
  return UpdateAffiliateLibraryItemSchema.safeParse(data);
};

const _validateAffiliateLibraryQuery = (data: unknown) => {
  return AffiliateLibraryQuerySchema.safeParse(data);
};
