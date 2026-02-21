/**
 * Quiz Configuration Constants
 *
 * This file contains all constant values used throughout the LightTool quiz system.
 */

// =============================================================================
// QUIZ CONFIGURATION
// =============================================================================

/**
 * Total number of steps/questions in the quiz
 */
export const TOTAL_QUIZ_STEPS = 10;

/**
 * Minimum number of tool recommendations to return
 */
const _MIN_RECOMMENDATIONS = 3;

/**
 * Maximum length for quiz answer text (used for free-text Q10)
 */
export const MAX_ANSWER_LENGTH = 500;

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

/**
 * localStorage key for quiz state persistence
 */
export const QUIZ_STORAGE_KEY = 'lighttool_quiz_state';

/**
 * Time-to-live for quiz state in localStorage (24 hours in milliseconds)
 * After this time, stored quiz results are considered expired
 */
export const QUIZ_STATE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// =============================================================================
// API CONFIGURATION
// =============================================================================

/**
 * API endpoint for generating quiz recommendations
 */
export const API_ENDPOINT = '/api/quiz/recommendations';

/**
 * Timeout for API requests (in milliseconds)
 */
const _API_TIMEOUT = 15000; // 15 seconds

// =============================================================================
// ROUTING CONFIGURATION
// =============================================================================

/**
 * Quiz-related route paths
 */
export const QUIZ_ROUTES = {
  /** Landing page - quiz introduction */
  landing: '/quiz',
  /** Quiz questions page - interactive quiz */
  questions: '/quiz/questions',
  /** Results page - recommendations display */
  results: '/quiz/results',
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

/**
 * Animation duration for transitions (in milliseconds)
 */
const _ANIMATION_DURATION = 300;

/**
 * Delay before auto-advancing after answer selection (in milliseconds)
 */
const _AUTO_ADVANCE_DELAY = 500;
