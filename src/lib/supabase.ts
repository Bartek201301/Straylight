import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Optimized client for frontend/authenticated operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'straylight-web',
      'x-client-version': '1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Limit realtime events for performance
    },
  },
});

// Admin client for server-side operations (bypasses RLS)
// Only create if service key is available (to avoid errors during client-side rendering)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'straylight-admin',
          'x-client-version': '1.0.0',
        },
      },
      realtime: {
        // Disable realtime for admin client to save resources
        params: {
          eventsPerSecond: 0,
        },
      },
    })
  : null;

// Function to ensure admin client is available
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. This should only be called server-side.'
    );
  }
  return supabaseAdmin;
}

// Database type definitions (will be expanded as we add more tables)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          handle: string;
          role: 'admin' | 'moderator' | 'member';
          xp: number;
          badges: any[];
          bio: string | null;
          social_links: any;
          avatar_url: string | null;
          display_name: string | null;
          website: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          role?: 'admin' | 'moderator' | 'member';
          xp?: number;
          badges?: any[];
          bio?: string | null;
          social_links?: any;
          avatar_url?: string | null;
          display_name?: string | null;
          website?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          role?: 'admin' | 'moderator' | 'member';
          xp?: number;
          badges?: any[];
          bio?: string | null;
          social_links?: any;
          avatar_url?: string | null;
          display_name?: string | null;
          website?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          slug: string;
          body_md: string;
          status: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
          tags: string[];
          excerpt: string | null;
          cover_image_url: string | null;
          view_count: number;
          is_featured: boolean;
          featured_order: number | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          slug?: string;
          body_md: string;
          status?: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
          tags?: string[];
          excerpt?: string | null;
          cover_image_url?: string | null;
          view_count?: number;
          is_featured?: boolean;
          featured_order?: number | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          slug?: string;
          body_md?: string;
          status?: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
          tags?: string[];
          excerpt?: string | null;
          cover_image_url?: string | null;
          view_count?: number;
          is_featured?: boolean;
          featured_order?: number | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      library_items: {
        Row: {
          id: string;
          submitter_id: string;
          title: string;
          description: string | null;
          url: string | null;
          author: string | null;
          item_type:
            | 'paper'
            | 'book'
            | 'video'
            | 'article'
            | 'website'
            | 'tool'
            | 'dataset';
          tags: string[];
          doi: string | null;
          isbn: string | null;
          publication_year: number | null;
          journal: string | null;
          submission_status: 'pending' | 'approved' | 'rejected';
          view_count: number;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          submitter_id: string;
          title: string;
          description?: string | null;
          url?: string | null;
          author?: string | null;
          item_type:
            | 'paper'
            | 'book'
            | 'video'
            | 'article'
            | 'website'
            | 'tool'
            | 'dataset';
          tags?: string[];
          doi?: string | null;
          isbn?: string | null;
          publication_year?: number | null;
          journal?: string | null;
          submission_status?: 'pending' | 'approved' | 'rejected';
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
        };
        Update: {
          id?: string;
          submitter_id?: string;
          title?: string;
          description?: string | null;
          url?: string | null;
          author?: string | null;
          item_type?:
            | 'paper'
            | 'book'
            | 'video'
            | 'article'
            | 'website'
            | 'tool'
            | 'dataset';
          tags?: string[];
          doi?: string | null;
          isbn?: string | null;
          publication_year?: number | null;
          journal?: string | null;
          submission_status?: 'pending' | 'approved' | 'rejected';
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
        };
      };
      votes: {
        Row: {
          user_id: string;
          item_id: string;
          item_type: 'article' | 'library_item';
          vote_type: 'upvote' | 'downvote';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_id: string;
          item_type: 'article' | 'library_item';
          vote_type: 'upvote' | 'downvote';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          item_id?: string;
          item_type?: 'article' | 'library_item';
          vote_type?: 'upvote' | 'downvote';
          created_at?: string;
          updated_at?: string;
        };
      };
      affiliate_library: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: 'book' | 'tool';
          author: string | null;
          rating: number | null;
          affiliate_url: string;
          image_url: string | null;
          tags: string[];
          isbn: string | null;
          publisher: string | null;
          publication_year: number | null;
          price_range:
            | 'free'
            | 'under-50'
            | '50-100'
            | '100-200'
            | 'over-200'
            | null;
          click_count: number;
          is_active: boolean;
          is_featured: boolean;
          featured_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: 'book' | 'tool';
          author?: string | null;
          rating?: number | null;
          affiliate_url: string;
          image_url?: string | null;
          tags?: string[];
          isbn?: string | null;
          publisher?: string | null;
          publication_year?: number | null;
          price_range?:
            | 'free'
            | 'under-50'
            | '50-100'
            | '100-200'
            | 'over-200'
            | null;
          click_count?: number;
          is_active?: boolean;
          is_featured?: boolean;
          featured_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?: 'book' | 'tool';
          author?: string | null;
          rating?: number | null;
          affiliate_url?: string;
          image_url?: string | null;
          tags?: string[];
          isbn?: string | null;
          publisher?: string | null;
          publication_year?: number | null;
          price_range?:
            | 'free'
            | 'under-50'
            | '50-100'
            | '100-200'
            | 'over-200'
            | null;
          click_count?: number;
          is_active?: boolean;
          is_featured?: boolean;
          featured_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletter_subscriptions: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          career_focus: string[];
          experience_level: string | null;
          frequency: 'weekly' | 'biweekly' | 'monthly';
          status: 'pending' | 'confirmed' | 'unsubscribed';
          created_at: string;
          confirmed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          career_focus?: string[];
          experience_level?: string | null;
          frequency?: 'weekly' | 'biweekly' | 'monthly';
          status?: 'pending' | 'confirmed' | 'unsubscribed';
          created_at?: string;
          confirmed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          career_focus?: string[];
          experience_level?: string | null;
          frequency?: 'weekly' | 'biweekly' | 'monthly';
          status?: 'pending' | 'confirmed' | 'unsubscribed';
          created_at?: string;
          confirmed_at?: string | null;
          updated_at?: string;
        };
      };
      resource_suggestions: {
        Row: {
          id: string;
          resource_name: string;
          resource_type:
            | 'book'
            | 'tool'
            | 'course'
            | 'podcast'
            | 'dataset'
            | 'website'
            | 'paper'
            | 'other';
          url: string | null;
          author: string | null;
          description: string;
          categories: string[];
          target_audience:
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'all'
            | null;
          submitter_name: string | null;
          submitter_email: string;
          recommendation: string | null;
          relationship: string[];
          pricing: 'free' | 'freemium' | 'paid' | 'subscription' | null;
          time_investment: string | null;
          prerequisites: string | null;
          additional_notes: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          resource_name: string;
          resource_type:
            | 'book'
            | 'tool'
            | 'course'
            | 'podcast'
            | 'dataset'
            | 'website'
            | 'paper'
            | 'other';
          url?: string | null;
          author?: string | null;
          description: string;
          categories?: string[];
          target_audience?:
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'all'
            | null;
          submitter_name?: string | null;
          submitter_email: string;
          recommendation?: string | null;
          relationship?: string[];
          pricing?: 'free' | 'freemium' | 'paid' | 'subscription' | null;
          time_investment?: string | null;
          prerequisites?: string | null;
          additional_notes?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          resource_name?: string;
          resource_type?:
            | 'book'
            | 'tool'
            | 'course'
            | 'podcast'
            | 'dataset'
            | 'website'
            | 'paper'
            | 'other';
          url?: string | null;
          author?: string | null;
          description?: string;
          categories?: string[];
          target_audience?:
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'all'
            | null;
          submitter_name?: string | null;
          submitter_email?: string;
          recommendation?: string | null;
          relationship?: string[];
          pricing?: 'free' | 'freemium' | 'paid' | 'subscription' | null;
          time_investment?: string | null;
          prerequisites?: string | null;
          additional_notes?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
      };
    };
    Views: {
      article_vote_counts: {
        Row: {
          article_id: string;
          upvotes: number;
          downvotes: number;
          net_votes: number;
          total_votes: number;
        };
      };
      library_item_vote_counts: {
        Row: {
          library_item_id: string;
          upvotes: number;
          downvotes: number;
          net_votes: number;
          total_votes: number;
        };
      };
      public_article_vote_counts: {
        Row: {
          article_id: string;
          upvotes: number;
          downvotes: number;
          net_votes: number;
          total_votes: number;
          title: string;
          status: string;
          author_id: string;
        };
      };
      public_library_item_vote_counts: {
        Row: {
          library_item_id: string;
          upvotes: number;
          downvotes: number;
          net_votes: number;
          total_votes: number;
          title: string;
          submission_status: string;
          submitter_id: string;
        };
      };
    };
    Functions: {
      get_user_vote: {
        Args: {
          p_user_id: string;
          p_item_id: string;
          p_item_type: 'article' | 'library_item';
        };
        Returns: 'upvote' | 'downvote' | null;
      };
      cast_vote: {
        Args: {
          p_user_id: string;
          p_item_id: string;
          p_item_type: 'article' | 'library_item';
          p_vote_type: 'upvote' | 'downvote';
        };
        Returns: undefined;
      };
      remove_vote: {
        Args: {
          p_user_id: string;
          p_item_id: string;
          p_item_type: 'article' | 'library_item';
        };
        Returns: boolean;
      };
      get_vote_summary: {
        Args: {
          p_item_id: string;
          p_item_type: 'article' | 'library_item';
        };
        Returns: {
          upvotes: number;
          downvotes: number;
          net_votes: number;
          total_votes: number;
        }[];
      };
    };
  };
};

// Helper types for user roles
export type UserRole = 'admin' | 'moderator' | 'member';

// Helper types for article status
type _ArticleStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'archived'
  | 'rejected';

// Helper types for library item types and status
type _LibraryItemType =
  | 'paper'
  | 'book'
  | 'video'
  | 'article'
  | 'website'
  | 'tool'
  | 'dataset';
type _LibraryItemStatus = 'pending' | 'approved' | 'rejected';

// Helper types for voting
type _VoteType = 'upvote' | 'downvote';
type _VotableItemType = 'article' | 'library_item';

// Helper types for database rows
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Article = Database['public']['Tables']['articles']['Row'];
type _ArticleInsert = Database['public']['Tables']['articles']['Insert'];
type _ArticleUpdate = Database['public']['Tables']['articles']['Update'];
type _LibraryItem = Database['public']['Tables']['library_items']['Row'];
type _LibraryItemInsert =
  Database['public']['Tables']['library_items']['Insert'];
type _LibraryItemUpdate =
  Database['public']['Tables']['library_items']['Update'];
type _Vote = Database['public']['Tables']['votes']['Row'];
type _VoteInsert = Database['public']['Tables']['votes']['Insert'];
type _VoteUpdate = Database['public']['Tables']['votes']['Update'];
export type AffiliateLibraryItem =
  Database['public']['Tables']['affiliate_library']['Row'];
type _AffiliateLibraryInsert =
  Database['public']['Tables']['affiliate_library']['Insert'];
type _AffiliateLibraryUpdate =
  Database['public']['Tables']['affiliate_library']['Update'];
type _NewsletterSubscription =
  Database['public']['Tables']['newsletter_subscriptions']['Row'];
export type NewsletterSubscriptionInsert =
  Database['public']['Tables']['newsletter_subscriptions']['Insert'];
type _NewsletterSubscriptionUpdate =
  Database['public']['Tables']['newsletter_subscriptions']['Update'];
type _ResourceSuggestion =
  Database['public']['Tables']['resource_suggestions']['Row'];
export type ResourceSuggestionInsert =
  Database['public']['Tables']['resource_suggestions']['Insert'];
type _ResourceSuggestionUpdate =
  Database['public']['Tables']['resource_suggestions']['Update'];

// Helper types for views
type _ArticleVoteCount =
  Database['public']['Views']['article_vote_counts']['Row'];
type _LibraryItemVoteCount =
  Database['public']['Views']['library_item_vote_counts']['Row'];
type _PublicArticleVoteCount =
  Database['public']['Views']['public_article_vote_counts']['Row'];
type _PublicLibraryItemVoteCount =
  Database['public']['Views']['public_library_item_vote_counts']['Row'];

// =============================================================================
// AUTHENTICATION TYPES & CONFIGURATION
// =============================================================================

// Import additional types for authentication from Supabase
import type { User, Session } from '@supabase/supabase-js';

// Re-export Supabase auth types for easier imports

// Custom auth types for our application
export interface AuthUser extends User {
  // Extend the User type with any custom properties if needed
  role?: UserRole;
  profile?: UserProfile;
  // Additional profile fields for convenience
  handle?: string | null;
  xp?: number;
  badges?: any[];
}

export interface AuthSession extends Session {
  user: AuthUser;
}

// Auth state types for context/hooks
export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: Error | null;
}

// Auth method return types
export interface SignUpResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: Error | null;
}

export interface SignInResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: Error | null;
}

// Form data types for auth forms
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  handle?: string; // Optional user handle for our custom users table
}

export interface SignInFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Password reset types
export interface PasswordResetData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
  confirmPassword: string;
}

// Auth error types specific to our application
export type AuthErrorType =
  | 'invalid_credentials'
  | 'email_already_exists'
  | 'weak_password'
  | 'email_not_confirmed'
  | 'invalid_email'
  | 'network_error'
  | 'too_many_requests'
  | 'signup_disabled'
  | 'invalid_request'
  | 'unauthorized'
  | 'unknown_error';

// Auth configuration options
export interface AuthOptions {
  redirectTo?: string;
  captchaToken?: string;
}

// Auth event types for listeners
export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export interface AuthChangeEvent {
  event: AuthEventType;
  session: AuthSession | null;
  user: AuthUser | null;
}

// Auth route protection types
interface _ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole;
  redirectTo?: string;
}

// Auth context provider props
export interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: AuthSession | null;
}

// Utility types for auth hooks
/* eslint-disable no-unused-vars */
export interface UseAuthReturn extends AuthState {
  signUp: (
    data: SignUpFormData,
    options?: AuthOptions
  ) => Promise<SignUpResponse>;
  signIn: (
    data: SignInFormData,
    options?: AuthOptions
  ) => Promise<SignInResponse>;
  signInWithGoogle: (options?: AuthOptions) => Promise<SignInResponse>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (data: PasswordResetData) => Promise<{ error: Error | null }>;
  updatePassword: (
    data: UpdatePasswordData
  ) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  resendVerificationEmail: (email?: string) => Promise<{ error: Error | null }>;
  refreshUserProfile: () => Promise<{ error: Error | null }>;
}
/* eslint-enable no-unused-vars */

// Auth validation schemas (can be used with libraries like Zod)
interface AuthValidationRules {
  email: {
    required: boolean;
    pattern: RegExp;
  };
  password: {
    required: boolean;
    minLength: number;
    requireUppercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
  handle: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
}

// Default auth validation rules
const _AUTH_VALIDATION_RULES: AuthValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  handle: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
};

// =============================================================================
// PUBLIC PROFILE TYPES
// =============================================================================

// Social media links type
export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  [key: string]: string | undefined;
}

// Public profile type (for profile pages)
export interface PublicProfile {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  social_links: SocialLinks;
  role: UserRole;
  xp: number;
  badges: any[];
  created_at: string;
  article_count?: number;
  total_views?: number;
  total_likes?: number;
}

// Profile form data type
interface _ProfileFormData {
  handle?: string;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  social_links?: SocialLinks;
}

// Profile statistics type
interface _ProfileStats {
  article_count: number;
  total_views: number;
  total_likes: number;
  member_since: string;
}

// Auth constants
const _AUTH_ROUTES = {
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/auth/sign-up',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  EMAIL_CONFIRM: '/auth/confirm',
} as const;

const _AUTH_STORAGE_KEYS = {
  SESSION: 'supabase.auth.token',
  REMEMBER_ME: 'auth.remember_me',
  REDIRECT_URL: 'auth.redirect_url',
} as const;

// =============================================================================
// FEATURED CONTENT TYPES
// =============================================================================

// Featured article with author info (from database function)
export interface FeaturedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  cover_image_url: string | null;
  tags: string[];
  view_count: number;
  created_at: string;
  published_at: string;
  author_handle: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  featured_order: number;
}

// Featured tool with full info (from database function)
export interface FeaturedTool {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  affiliate_url: string;
  type: string;
  tags: string[];
  rating: number | null;
  price_range: string | null;
  click_count: number;
  author: string | null;
  is_active: boolean;
  created_at: string;
  featured_order: number;
}

// Popular article with rank and like count (from database function)
export interface PopularArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  cover_image_url: string | null;
  tags: string[];
  view_count: number;
  like_count: number;
  created_at: string;
  published_at: string;
  author_handle: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  rank_position: number;
}

// Extended article type with user info for cards
export interface ArticleWithAuthor extends Article {
  users?: {
    handle: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}
