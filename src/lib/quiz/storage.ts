'use client';

import { QuizState, QuizAnswers } from '@/lib/types/quiz';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';
import { QUIZ_STORAGE_KEY, QUIZ_STATE_TTL } from './constants';

/**
 * Quiz State Storage Utilities
 *
 * This file contains all localStorage operations for the quiz system.
 * All functions are SSR-safe and include proper error handling.
 */

// =============================================================================
// STORAGE OPERATIONS
// =============================================================================

/**
 * Save complete quiz state to localStorage
 * @param state - Quiz state to save
 */
function saveQuizState(state: QuizState): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(QUIZ_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save quiz state to localStorage:', error);
  }
}

/**
 * Retrieve quiz state from localStorage
 * @returns Quiz state or null if not found/invalid
 */
export function getQuizState(): QuizState | null {
  if (typeof window === 'undefined') return null;

  try {
    const serialized = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!serialized) return null;

    const state = JSON.parse(serialized) as QuizState;

    // Validate structure
    if (!state.lastUpdated) return null;

    // Check if expired
    if (isQuizStateExpired(state)) {
      clearQuizState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to retrieve quiz state from localStorage:', error);
    return null;
  }
}

/**
 * Save only quiz answers (partial state update)
 * @param answers - Quiz answers to save
 *
 * IMPORTANT: If answers have changed from previously saved ones,
 * this will clear recommendations to force fresh fetch
 */
export function saveQuizAnswers(answers: QuizAnswers): void {
  if (typeof window === 'undefined') return;

  try {
    const existingState = getQuizState() || {
      answers: null,
      recommendations: null,
      completedAt: null,
      lastUpdated: new Date().toISOString(),
    };

    // Check if answers have changed - if so, clear recommendations
    const answersChanged = !areAnswersEqual(existingState.answers, answers);

    const updatedState: QuizState = {
      ...existingState,
      answers,
      lastUpdated: new Date().toISOString(),
      // Clear recommendations if answers changed to force fresh API fetch
      recommendations: answersChanged ? null : existingState.recommendations,
      personalized_guidance: answersChanged
        ? undefined
        : existingState.personalized_guidance,
      completedAt: answersChanged ? null : existingState.completedAt,
    };

    if (answersChanged) {
      console.log('🔄 Quiz answers changed - clearing cached recommendations');
    }

    saveQuizState(updatedState);
  } catch (error) {
    console.error('Failed to save quiz answers:', error);
  }
}

/**
 * Save quiz recommendations and mark quiz as completed
 * @param recommendations - Array of recommended tools
 * @param answers - Quiz answers that generated these recommendations
 * @param personalizedGuidance - Optional map of tool_id to personalized guidance text
 */
export function saveQuizRecommendations(
  recommendations: AffiliateLibraryRow[],
  answers: QuizAnswers,
  personalizedGuidance?: Record<string, string>
): void {
  if (typeof window === 'undefined') return;

  try {
    const now = new Date().toISOString();

    const state: QuizState = {
      answers,
      recommendations,
      personalized_guidance: personalizedGuidance,
      completedAt: now,
      lastUpdated: now,
    };

    saveQuizState(state);
  } catch (error) {
    console.error('Failed to save quiz recommendations:', error);
  }
}

/**
 * Clear all quiz state from localStorage
 */
export function clearQuizState(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear quiz state:', error);
  }
}

// =============================================================================
// QUERY OPERATIONS
// =============================================================================

/**
 * Check if user has completed the quiz
 * @returns True if quiz is completed, false otherwise
 */
export function hasCompletedQuiz(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const state = getQuizState();
    return state?.completedAt !== null && state?.completedAt !== undefined;
  } catch (error) {
    console.error('Failed to check quiz completion status:', error);
    return false;
  }
}

/**
 * Get saved quiz recommendations
 * @returns Array of recommendations or null if not available/expired
 */
export function getQuizRecommendations(): AffiliateLibraryRow[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const state = getQuizState();
    if (!state || !state.recommendations) return null;

    // Check if recommendations are expired
    if (isQuizStateExpired(state)) {
      clearQuizState();
      return null;
    }

    return state.recommendations;
  } catch (error) {
    console.error('Failed to retrieve quiz recommendations:', error);
    return null;
  }
}

/**
 * Get saved quiz answers
 * @returns Quiz answers or null if not available
 */
export function getQuizAnswers(): QuizAnswers | null {
  if (typeof window === 'undefined') return null;

  try {
    const state = getQuizState();
    return state?.answers || null;
  } catch (error) {
    console.error('Failed to retrieve quiz answers:', error);
    return null;
  }
}

/**
 * Get saved personalized guidance for recommended tools
 * @returns Map of tool_id to guidance text, or null if not available
 */
export function getPersonalizedGuidance(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;

  try {
    const state = getQuizState();
    if (!state || !state.personalized_guidance) return null;

    // Check if state is expired
    if (isQuizStateExpired(state)) {
      clearQuizState();
      return null;
    }

    return state.personalized_guidance;
  } catch (error) {
    console.error('Failed to retrieve personalized guidance:', error);
    return null;
  }
}

// =============================================================================
// VALIDATION OPERATIONS
// =============================================================================

/**
 * Check if quiz state is expired (older than TTL)
 * @param state - Quiz state to check
 * @returns True if expired, false otherwise
 */
function isQuizStateExpired(state: QuizState): boolean {
  try {
    const lastUpdated = new Date(state.lastUpdated).getTime();
    const now = Date.now();
    const age = now - lastUpdated;

    return age > QUIZ_STATE_TTL;
  } catch (error) {
    console.error('Failed to check quiz state expiration:', error);
    return true; // Consider expired if error
  }
}

/**
 * Get time remaining until quiz state expires (in milliseconds)
 * @returns Milliseconds until expiration, or 0 if already expired
 */
function getTimeUntilExpiration(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const state = getQuizState();
    if (!state) return 0;

    const lastUpdated = new Date(state.lastUpdated).getTime();
    const expiresAt = lastUpdated + QUIZ_STATE_TTL;
    const now = Date.now();
    const remaining = expiresAt - now;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Failed to calculate time until expiration:', error);
    return 0;
  }
}

/**
 * Get formatted time remaining until expiration
 * @returns Human-readable string (e.g., "23 hours") or null if expired/unavailable
 */
function _getFormattedTimeUntilExpiration(): string | null {
  const ms = getTimeUntilExpiration();
  if (ms === 0) return null;

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'godzina' : 'godzin'}`;
  }
  return `${minutes} ${minutes === 1 ? 'minuta' : 'minut'}`;
}

// =============================================================================
// PENDING QUIZ OPERATIONS (SessionStorage for pre-login state)
// =============================================================================

/**
 * Store pending quiz answers in sessionStorage before signup/signin
 * Used to preserve quiz state when user needs to authenticate
 * @param answers - Quiz answers to store temporarily
 */
export function setPendingQuizAnswers(answers: QuizAnswers): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(answers);
    window.sessionStorage.setItem('pending_quiz_answers', serialized);
    console.log('✅ Pending quiz answers stored in sessionStorage');
  } catch (error) {
    console.error('Failed to store pending quiz answers:', error);
  }
}

/**
 * Retrieve pending quiz answers from sessionStorage
 * @returns Pending quiz answers or null if not found
 */
export function getPendingQuizAnswers(): QuizAnswers | null {
  if (typeof window === 'undefined') return null;

  try {
    const serialized = window.sessionStorage.getItem('pending_quiz_answers');
    if (!serialized) return null;

    return JSON.parse(serialized) as QuizAnswers;
  } catch (error) {
    console.error('Failed to retrieve pending quiz answers:', error);
    return null;
  }
}

/**
 * Clear pending quiz answers from sessionStorage
 */
export function clearPendingQuizAnswers(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem('pending_quiz_answers');
    console.log('✅ Pending quiz answers cleared');
  } catch (error) {
    console.error('Failed to clear pending quiz answers:', error);
  }
}

// =============================================================================
// USER ASSOCIATION OPERATIONS
// =============================================================================

/**
 * Check if quiz state is valid for the current user
 * Invalidates quiz state if it belongs to a different user
 * @param userId - Current user's ID (null if not logged in)
 * @returns True if quiz state is valid for this user
 */
function _isQuizStateValidForUser(userId: string | null): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const state = getQuizState();
    if (!state) return false;

    // If state has user_id, it must match current user
    if (state.user_id && state.user_id !== userId) {
      console.log(
        `⚠️ Quiz state belongs to different user (${state.user_id} !== ${userId}). Invalidating.`
      );
      clearQuizState();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to validate quiz state for user:', error);
    return false;
  }
}

/**
 * Associate quiz state with current user
 * Updates existing quiz state to include user_id
 * @param userId - User ID to associate with quiz state
 */
export function associateQuizStateWithUser(userId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const state = getQuizState();
    if (!state) {
      console.warn('No quiz state found to associate with user');
      return;
    }

    // Update state with user_id
    const updatedState: QuizState = {
      ...state,
      user_id: userId,
      lastUpdated: new Date().toISOString(),
    };

    saveQuizState(updatedState);
    console.log(`✅ Quiz state associated with user: ${userId}`);
  } catch (error) {
    console.error('Failed to associate quiz state with user:', error);
  }
}

// =============================================================================
// ANSWER COMPARISON OPERATIONS
// =============================================================================

/**
 * Compare two quiz answer objects to check if they are identical
 * Used to determine if fresh recommendations are needed
 * @param answers1 - First quiz answers object (can be null)
 * @param answers2 - Second quiz answers object (can be null)
 * @returns True if answers are identical, false otherwise
 */
function areAnswersEqual(
  answers1: QuizAnswers | null | undefined,
  answers2: QuizAnswers | null | undefined
): boolean {
  // Handle null/undefined cases
  if (!answers1 || !answers2) return false;

  try {
    // Compare all answer fields
    const fields: (keyof QuizAnswers)[] = [
      'role',
      'primary_goal',
      'pain_point',
      'workflow',
      'time_investment',
      'team_context',
      'experience_level',
      'budget',
      'integrations',
      'specific_challenge',
    ];

    for (const field of fields) {
      const val1 = answers1[field];
      const val2 = answers2[field];

      // Special handling for integrations array
      if (field === 'integrations') {
        if (!Array.isArray(val1) || !Array.isArray(val2)) return false;
        if (val1.length !== val2.length) return false;
        // Compare sorted arrays to handle order differences
        const sorted1 = [...val1].sort();
        const sorted2 = [...val2].sort();
        if (JSON.stringify(sorted1) !== JSON.stringify(sorted2)) return false;
      } else {
        // Simple string comparison for other fields
        if (val1 !== val2) return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to compare quiz answers:', error);
    return false; // Consider different if comparison fails
  }
}
