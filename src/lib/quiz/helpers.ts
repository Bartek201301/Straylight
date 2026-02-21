import { QuizStep, QuizAnswers, QuizState } from '@/lib/types/quiz';
import { TOTAL_QUIZ_STEPS } from './constants';

/**
 * Quiz Helper Functions
 *
 * This file contains utility functions and type guards for quiz operations.
 * All functions are pure and side-effect free.
 * Updated for 10-question quiz with new field structure.
 */

// =============================================================================
// STEP NAVIGATION
// =============================================================================

/**
 * Get the next quiz step
 * @param currentStep - Current step (0-9)
 * @returns Next step or null if already at last step
 */
export function getNextStep(currentStep: QuizStep): QuizStep | null {
  if (currentStep >= 9) return null;
  return (currentStep + 1) as QuizStep;
}

/**
 * Get the previous quiz step
 * @param currentStep - Current step (0-9)
 * @returns Previous step or null if already at first step
 */
export function getPreviousStep(currentStep: QuizStep): QuizStep | null {
  if (currentStep <= 0) return null;
  return (currentStep - 1) as QuizStep;
}

/**
 * Check if step is the first step
 * @param step - Step to check
 * @returns True if step is 0
 */
function _isFirstStep(step: QuizStep): boolean {
  return step === 0;
}

/**
 * Check if step is the last step
 * @param step - Step to check
 * @returns True if step is 9
 */
function _isLastStep(step: QuizStep): boolean {
  return step === 9;
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

/**
 * Calculate quiz progress as a percentage
 * @param currentStep - Current step (0-9)
 * @returns Progress percentage (0-100)
 */
function _getStepProgress(currentStep: QuizStep): number {
  const progress = ((currentStep + 1) / TOTAL_QUIZ_STEPS) * 100;
  return Math.round(progress);
}

/**
 * Calculate number of completed steps
 * @param currentStep - Current step (0-9)
 * @returns Number of completed steps (1-10)
 */
function _getCompletedSteps(currentStep: QuizStep): number {
  return currentStep + 1;
}

/**
 * Calculate number of remaining steps
 * @param currentStep - Current step (0-9)
 * @returns Number of remaining steps (0-9)
 */
function _getRemainingSteps(currentStep: QuizStep): number {
  return TOTAL_QUIZ_STEPS - (currentStep + 1);
}

// =============================================================================
// DATA FORMATTING
// =============================================================================

/**
 * Format quiz answers for API submission
 * Trims whitespace and ensures proper structure
 * @param answers - Quiz answers to format
 * @returns Formatted answers object
 */
function _formatQuizAnswersForAPI(answers: QuizAnswers): QuizAnswers {
  return {
    role: answers.role.trim(),
    primary_goal: answers.primary_goal.trim(),
    pain_point: answers.pain_point.trim(),
    workflow: answers.workflow.trim(),
    time_investment: answers.time_investment.trim(),
    team_context: answers.team_context.trim(),
    experience_level: answers.experience_level.trim(),
    budget: answers.budget.trim(),
    integrations: answers.integrations.map((i) => i.trim()),
    specific_challenge: answers.specific_challenge?.trim(),
  };
}

/**
 * Sanitize quiz answer text
 * Removes extra whitespace and control characters
 * Note: Do NOT escape quotes - JSON.stringify handles that automatically
 * @param answer - Answer text to sanitize
 * @returns Sanitized answer text safe for JSON.stringify
 */
function sanitizeAnswer(answer: string): string {
  return answer
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[\r\n\t]/g, ' ') // Replace control chars with space
    .replace(/\s+/g, ' ') // Collapse spaces again after replacement
    .trim(); // Final trim
}

/**
 * Sanitize all quiz answers
 * @param answers - Quiz answers to sanitize
 * @returns Sanitized answers object
 */
export function sanitizeQuizAnswers(answers: QuizAnswers): QuizAnswers {
  return {
    role: sanitizeAnswer(answers.role),
    primary_goal: sanitizeAnswer(answers.primary_goal),
    pain_point: sanitizeAnswer(answers.pain_point),
    workflow: sanitizeAnswer(answers.workflow),
    time_investment: sanitizeAnswer(answers.time_investment),
    team_context: sanitizeAnswer(answers.team_context),
    experience_level: sanitizeAnswer(answers.experience_level),
    budget: sanitizeAnswer(answers.budget),
    integrations: answers.integrations.map((i) => sanitizeAnswer(i)),
    specific_challenge: answers.specific_challenge
      ? sanitizeAnswer(answers.specific_challenge)
      : undefined,
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if object is a valid QuizState
 * @param state - Object to validate
 * @returns True if state matches QuizState structure
 */
function _isQuizStateValid(state: unknown): state is QuizState {
  if (!state || typeof state !== 'object') return false;

  const s = state as Record<string, unknown>;

  // Check required fields
  if (typeof s.lastUpdated !== 'string') return false;

  // Check optional fields have correct types if present
  if (s.answers !== null && s.answers !== undefined) {
    if (typeof s.answers !== 'object') return false;

    const answers = s.answers as Record<string, unknown>;

    // Check all required fields
    if (
      typeof answers.role !== 'string' ||
      typeof answers.primary_goal !== 'string' ||
      typeof answers.pain_point !== 'string' ||
      typeof answers.workflow !== 'string' ||
      typeof answers.time_investment !== 'string' ||
      typeof answers.team_context !== 'string' ||
      typeof answers.experience_level !== 'string' ||
      typeof answers.budget !== 'string' ||
      !Array.isArray(answers.integrations)
    ) {
      return false;
    }

    // specific_challenge is optional
    if (
      answers.specific_challenge !== undefined &&
      typeof answers.specific_challenge !== 'string'
    ) {
      return false;
    }
  }

  if (
    s.recommendations !== null &&
    s.recommendations !== undefined &&
    !Array.isArray(s.recommendations)
  ) {
    return false;
  }

  if (
    s.completedAt !== null &&
    s.completedAt !== undefined &&
    typeof s.completedAt !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if object is valid QuizAnswers
 * @param answers - Object to validate
 * @returns True if answers matches QuizAnswers structure
 */
function _isQuizAnswersValid(answers: unknown): answers is QuizAnswers {
  if (!answers || typeof answers !== 'object') return false;

  const a = answers as Record<string, unknown>;

  // Check all required fields
  const hasRequiredFields =
    typeof a.role === 'string' &&
    typeof a.primary_goal === 'string' &&
    typeof a.pain_point === 'string' &&
    typeof a.workflow === 'string' &&
    typeof a.time_investment === 'string' &&
    typeof a.team_context === 'string' &&
    typeof a.experience_level === 'string' &&
    typeof a.budget === 'string' &&
    Array.isArray(a.integrations) &&
    a.integrations.length > 0;

  if (!hasRequiredFields) return false;

  // specific_challenge is optional
  if (
    a.specific_challenge !== undefined &&
    typeof a.specific_challenge !== 'string'
  ) {
    return false;
  }

  return true;
}

// =============================================================================
// CONVERSION HELPERS
// =============================================================================

/**
 * Convert step number to step name
 * @param step - Step number (0-9)
 * @returns Step name (role, primary_goal, etc.)
 */
export function getStepName(step: QuizStep): keyof QuizAnswers {
  const stepNames: Record<QuizStep, keyof QuizAnswers> = {
    0: 'role',
    1: 'primary_goal',
    2: 'pain_point',
    3: 'workflow',
    4: 'time_investment',
    5: 'team_context',
    6: 'experience_level',
    7: 'budget',
    8: 'integrations',
    9: 'specific_challenge',
  };

  return stepNames[step];
}

/**
 * Convert step name to step number
 * @param stepName - Step name
 * @returns Step number (0-9) or null if invalid
 */
function _getStepNumber(stepName: keyof QuizAnswers): QuizStep | null {
  const stepNumbers: Record<keyof QuizAnswers, QuizStep> = {
    role: 0,
    primary_goal: 1,
    pain_point: 2,
    workflow: 3,
    time_investment: 4,
    team_context: 5,
    experience_level: 6,
    budget: 7,
    integrations: 8,
    specific_challenge: 9,
  };

  return stepNumbers[stepName] ?? null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create initial empty quiz state
 * @returns New empty quiz state
 */
function _createInitialQuizState(): QuizState {
  return {
    answers: null,
    recommendations: null,
    completedAt: null,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Create partial quiz answers object
 * @returns Empty partial answers
 */
function _createPartialAnswers(): Partial<QuizAnswers> {
  return {};
}

/**
 * Merge partial answers into complete answers
 * @param existing - Existing partial answers
 * @param updates - Updates to merge
 * @returns Merged partial answers
 */
function _mergePartialAnswers(
  existing: Partial<QuizAnswers>,
  updates: Partial<QuizAnswers>
): Partial<QuizAnswers> {
  return {
    ...existing,
    ...updates,
  };
}

/**
 * Check if partial answers can be converted to complete answers
 * All fields except specific_challenge are required
 * @param partial - Partial answers to check
 * @returns True if all required fields are present
 */
function _canConvertToCompleteAnswers(
  partial: Partial<QuizAnswers>
): partial is QuizAnswers {
  return (
    !!partial.role &&
    !!partial.primary_goal &&
    !!partial.pain_point &&
    !!partial.workflow &&
    !!partial.time_investment &&
    !!partial.team_context &&
    !!partial.experience_level &&
    !!partial.budget &&
    !!partial.integrations &&
    Array.isArray(partial.integrations) &&
    partial.integrations.length > 0
    // specific_challenge is optional
  );
}
