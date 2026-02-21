// Database types for affiliate_library table
export type AffiliateItemType =
  | 'book'
  | 'tool'
  | 'course'
  | 'podcast'
  | 'dataset'
  | 'website'
  | 'paper'
  | 'other';
export type PriceRange =
  | 'free'
  | 'under-50'
  | '50-100'
  | '100-200'
  | 'over-200';

// Main database row type
export interface AffiliateLibraryRow {
  id: string;
  title: string;
  description: string | null;
  type: AffiliateItemType;
  author: string | null;
  rating: number | null;
  affiliate_url: string;
  image_url: string | null;
  tags: string[];
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  price_range: PriceRange | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Type for inserting new records (excludes auto-generated fields)
export interface AffiliateLibraryInsert {
  title: string;
  description?: string | null;
  type: AffiliateItemType;
  author?: string | null;
  rating?: number | null;
  affiliate_url: string;
  image_url?: string | null;
  tags?: string[];
  isbn?: string | null;
  publisher?: string | null;
  publication_year?: number | null;
  price_range?: PriceRange | null;
  is_active?: boolean;
}

// Type for updating records (all fields optional except id)
export interface AffiliateLibraryUpdate {
  title?: string;
  description?: string | null;
  type?: AffiliateItemType;
  author?: string | null;
  rating?: number | null;
  affiliate_url?: string;
  image_url?: string | null;
  tags?: string[];
  isbn?: string | null;
  publisher?: string | null;
  publication_year?: number | null;
  price_range?: PriceRange | null;
  click_count?: number;
  is_active?: boolean;
}

// Query parameters for filtering and sorting
interface _AffiliateLibraryQueryParams {
  type?: AffiliateItemType;
  rating_min?: number;
  rating_max?: number;
  tags?: string[];
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'rating' | 'created_at' | 'title' | 'click_count';
  sort_order?: 'asc' | 'desc';
}

// Response type for API endpoints
interface _AffiliateLibraryResponse {
  data: AffiliateLibraryRow[];
  count: number;
  limit: number;
  offset: number;
}

// Detailed item with additional computed fields
interface _AffiliateLibraryItemWithMeta extends AffiliateLibraryRow {
  formatted_rating?: string;
  tag_count: number;
  days_since_created: number;
}

// Enum constants for use in components
export const AFFILIATE_ITEM_TYPES: Record<AffiliateItemType, string> = {
  book: 'Book',
  tool: 'AI Tool',
  course: 'Online Course',
  podcast: 'Podcast',
  dataset: 'Dataset',
  website: 'Website/Blog',
  paper: 'Research Paper',
  other: 'Other',
};

const PRICE_RANGES: Record<PriceRange, string> = {
  free: 'Free',
  'under-50': 'Under $50',
  '50-100': '$50 - $100',
  '100-200': '$100 - $200',
  'over-200': 'Over $200',
};

// Helper function to format price range for display
const _formatPriceRange = (priceRange: PriceRange | null): string => {
  if (!priceRange) return 'Price not specified';
  return PRICE_RANGES[priceRange];
};

// Helper function to format rating for display
const _formatRating = (rating: number | null): string => {
  if (!rating) return 'Not rated';
  return `${rating.toFixed(1)}/5.0`;
};

// Helper function to generate star rating display
const _getStarRating = (rating: number | null): string => {
  if (!rating) return '☆☆☆☆☆';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars)
  );
};

// Helper function to validate item type
const _isValidItemType = (type: string): type is AffiliateItemType => {
  return [
    'book',
    'tool',
    'course',
    'podcast',
    'dataset',
    'website',
    'paper',
    'other',
  ].includes(type);
};

// Helper function to validate price range
const _isValidPriceRange = (range: string): range is PriceRange => {
  return ['free', 'under-50', '50-100', '100-200', 'over-200'].includes(range);
};

// Error types for affiliate library operations
interface _AffiliateLibraryError {
  code: string;
  message: string;
  details?: any;
}

// Success response type
interface _AffiliateLibrarySuccess<T = AffiliateLibraryRow> {
  data: T;
  message?: string;
}
