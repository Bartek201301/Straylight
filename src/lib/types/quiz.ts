import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';

// =============================================================================
// CORE QUIZ TYPES
// =============================================================================

/**
 * Represents a single answer field in the quiz
 */
interface _QuizAnswer {
  field: keyof QuizAnswers;
  value: string;
}

/**
 * Complete set of quiz answers from all 10 questions
 */
export interface QuizAnswers {
  /** Q1: Professional role/industry */
  role: string;
  /** Q2: Primary goal/objective with AI */
  primary_goal: string;
  /** Q3: Current pain point or challenge */
  pain_point: string;
  /** Q4: Current workflow state (manual, basic tools, AI user, advanced) */
  workflow: string;
  /** Q5: Time willing to invest in learning/using AI */
  time_investment: string;
  /** Q6: Team context (solo, small team, large team, client work) */
  team_context: string;
  /** Q7: Experience level with AI tools */
  experience_level: string;
  /** Q8: Budget for AI tools */
  budget: string;
  /** Q9: Existing tools/integrations (multi-select array) */
  integrations: string[];
  /** Q10: Optional free-text description of specific challenge */
  specific_challenge?: string;
}

/**
 * Option for a quiz question
 */
export interface QuizOption {
  /** Internal value (snake_case or camelCase) */
  value: string;
  /** Display label (Polish, user-friendly) */
  label: string;
  /** Optional icon identifier */
  icon?: string;
  /** Optional description for the option */
  description?: string;
}

/**
 * Structure of a single quiz question
 */
export interface QuizQuestion {
  /** Unique identifier for the question */
  id: string;
  /** Question text displayed to user (Polish) */
  question: string;
  /** Which answer field this question populates */
  field: keyof QuizAnswers;
  /** Available options for this question */
  options: QuizOption[];
}

/**
 * Quiz step number (0-based index)
 * 0 = first question, 9 = last question (10 total)
 */
export type QuizStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Complete quiz state stored in localStorage
 */
export interface QuizState {
  /** User's answers (null if quiz not started) */
  answers: QuizAnswers | null;
  /** AI-generated tool recommendations (null if not completed) */
  recommendations: AffiliateLibraryRow[] | null;
  /** Personalized guidance for each tool (tool_id -> guidance text) */
  personalized_guidance?: Record<string, string>;
  /** Timestamp when quiz was completed (ISO string, null if not completed) */
  completedAt: string | null;
  /** Timestamp of last state update (ISO string) */
  lastUpdated: string;
  /** User ID associated with this quiz (null for guest users) */
  user_id?: string | null;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Response from the /api/quiz/recommendations endpoint
 */
interface _QuizRecommendationsResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data: {
    /** Array of 3 recommended tools */
    recommendations: AffiliateLibraryRow[];
    /** The quiz answers that generated these recommendations */
    quiz_answers: QuizAnswers;
  };
  /** Success/error message */
  message: string;
  /** ISO timestamp of the response */
  timestamp?: string;
  /** Request ID for tracking */
  requestId?: string;
}

/**
 * Error response from the quiz API
 */
interface _QuizAPIError {
  /** Whether the request was successful (always false) */
  success: false;
  /** Error code */
  error: string;
  /** User-friendly error message */
  message: string;
  /** Additional error details (dev only) */
  details?: any;
  /** ISO timestamp of the error */
  timestamp: string;
  /** Request ID for tracking */
  requestId?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Partial quiz answers (used during quiz progression)
 */
export type PartialQuizAnswers = Partial<QuizAnswers>;

/**
 * Quiz field names as a union type
 */
type _QuizField = keyof QuizAnswers;

/**
 * Validation result for quiz answers
 */
export interface QuizValidationResult {
  /** Whether all answers are valid */
  valid: boolean;
  /** List of validation error messages (empty if valid) */
  errors: string[];
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

/**
 * Re-export AffiliateLibraryRow for convenience
 */
export type { AffiliateLibraryRow };
