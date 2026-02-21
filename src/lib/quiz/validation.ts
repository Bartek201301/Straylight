import { QuizAnswers, QuizValidationResult, QuizStep } from '@/lib/types/quiz';
import { MAX_ANSWER_LENGTH } from './constants';

/**
 * Quiz Validation Utilities
 *
 * This file contains pure validation functions for quiz data.
 * All functions are side-effect free and return boolean or validation results.
 * Updated for 10-question quiz with new field structure.
 */

// =============================================================================
// SINGLE ANSWER VALIDATION
// =============================================================================

/**
 * Validate a single quiz answer
 * @param answer - Answer string to validate
 * @returns True if answer is valid (1-500 characters after trim)
 */
function isValidQuizAnswer(answer: string): boolean {
  if (typeof answer !== 'string') return false;

  const trimmed = answer.trim();

  // Check minimum length
  if (trimmed.length === 0) return false;

  // Check maximum length
  if (trimmed.length > MAX_ANSWER_LENGTH) return false;

  return true;
}

/**
 * Validate answer length
 * @param answer - Answer string to validate
 * @param minLength - Minimum required length (default: 1)
 * @param maxLength - Maximum allowed length (default: MAX_ANSWER_LENGTH)
 * @returns True if answer length is within bounds
 */
function _isValidAnswerLength(
  answer: string,
  minLength: number = 1,
  maxLength: number = MAX_ANSWER_LENGTH
): boolean {
  const trimmed = answer.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Validate integrations array
 * @param integrations - Array of integration values
 * @returns True if array has at least one valid string
 */
function isValidIntegrationsArray(
  integrations: unknown
): integrations is string[] {
  if (!Array.isArray(integrations)) return false;
  if (integrations.length === 0) return false;

  // All items must be non-empty strings
  return integrations.every(
    (item) => typeof item === 'string' && item.trim().length > 0
  );
}

// =============================================================================
// QUIZ ANSWERS VALIDATION
// =============================================================================

/**
 * Check if all quiz questions have been answered
 * @param answers - Partial quiz answers to check
 * @returns True if all 9 required fields are present (specific_challenge is optional)
 */
export function areAllQuestionsAnswered(
  answers: Partial<QuizAnswers>
): answers is QuizAnswers {
  // Required fields (all except specific_challenge)
  const requiredStringFields: (keyof QuizAnswers)[] = [
    'role',
    'primary_goal',
    'pain_point',
    'workflow',
    'time_investment',
    'team_context',
    'experience_level',
    'budget',
  ];

  // Check all required string fields
  for (const field of requiredStringFields) {
    const value = answers[field];

    // Check if field exists and is a non-empty string
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return false;
    }
  }

  // Check integrations (required array field)
  if (
    !answers.integrations ||
    !isValidIntegrationsArray(answers.integrations)
  ) {
    return false;
  }

  // specific_challenge is optional, so we don't check it
  return true;
}

/**
 * Validate complete quiz answers object
 * @param answers - Quiz answers to validate
 * @returns Validation result with valid flag and error messages
 */
function _validateQuizAnswers(answers: QuizAnswers): QuizValidationResult {
  const errors: string[] = [];

  // Validate role
  if (!answers.role || typeof answers.role !== 'string') {
    errors.push("Pole 'rola' jest wymagane");
  } else if (!isValidQuizAnswer(answers.role)) {
    errors.push(`Pole 'rola' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`);
  }

  // Validate primary_goal
  if (!answers.primary_goal || typeof answers.primary_goal !== 'string') {
    errors.push("Pole 'cel główny' jest wymagane");
  } else if (!isValidQuizAnswer(answers.primary_goal)) {
    errors.push(
      `Pole 'cel główny' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`
    );
  }

  // Validate pain_point
  if (!answers.pain_point || typeof answers.pain_point !== 'string') {
    errors.push("Pole 'problem' jest wymagane");
  } else if (!isValidQuizAnswer(answers.pain_point)) {
    errors.push(`Pole 'problem' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`);
  }

  // Validate workflow
  if (!answers.workflow || typeof answers.workflow !== 'string') {
    errors.push("Pole 'workflow' jest wymagane");
  } else if (!isValidQuizAnswer(answers.workflow)) {
    errors.push(
      `Pole 'workflow' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`
    );
  }

  // Validate time_investment
  if (!answers.time_investment || typeof answers.time_investment !== 'string') {
    errors.push("Pole 'czas' jest wymagane");
  } else if (!isValidQuizAnswer(answers.time_investment)) {
    errors.push(`Pole 'czas' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`);
  }

  // Validate team_context
  if (!answers.team_context || typeof answers.team_context !== 'string') {
    errors.push("Pole 'kontekst zespołowy' jest wymagane");
  } else if (!isValidQuizAnswer(answers.team_context)) {
    errors.push(
      `Pole 'kontekst zespołowy' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`
    );
  }

  // Validate experience_level
  if (
    !answers.experience_level ||
    typeof answers.experience_level !== 'string'
  ) {
    errors.push("Pole 'poziom doświadczenia' jest wymagane");
  } else if (!isValidQuizAnswer(answers.experience_level)) {
    errors.push(
      `Pole 'poziom doświadczenia' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`
    );
  }

  // Validate budget
  if (!answers.budget || typeof answers.budget !== 'string') {
    errors.push("Pole 'budżet' jest wymagane");
  } else if (!isValidQuizAnswer(answers.budget)) {
    errors.push(`Pole 'budżet' musi mieć od 1 do ${MAX_ANSWER_LENGTH} znaków`);
  }

  // Validate integrations (required array)
  if (!isValidIntegrationsArray(answers.integrations)) {
    errors.push(
      "Musisz wybrać przynajmniej jedno narzędzie (lub 'Żadne z powyższych')"
    );
  }

  // Validate specific_challenge (optional)
  if (answers.specific_challenge !== undefined) {
    if (typeof answers.specific_challenge !== 'string') {
      errors.push("Pole 'konkretne wyzwanie' musi być tekstem");
    } else if (answers.specific_challenge.trim().length > MAX_ANSWER_LENGTH) {
      errors.push(
        `Pole 'konkretne wyzwanie' może mieć maksymalnie ${MAX_ANSWER_LENGTH} znaków`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if answers object has any valid data
 * @param answers - Partial quiz answers to check
 * @returns True if at least one field is filled
 */
function _hasAnyAnswers(answers: Partial<QuizAnswers>): boolean {
  return (
    !!answers.role ||
    !!answers.primary_goal ||
    !!answers.pain_point ||
    !!answers.workflow ||
    !!answers.time_investment ||
    !!answers.team_context ||
    !!answers.experience_level ||
    !!answers.budget ||
    (!!answers.integrations && answers.integrations.length > 0) ||
    !!answers.specific_challenge
  );
}

// =============================================================================
// STEP VALIDATION
// =============================================================================

/**
 * Type guard to check if a number is a valid quiz step
 * @param step - Step number to validate
 * @returns True if step is 0-9
 */
function _isQuizStepValid(step: number): step is QuizStep {
  return Number.isInteger(step) && step >= 0 && step <= 9;
}

/**
 * Validate step index
 * @param step - Step number to validate
 * @param totalSteps - Total number of steps (default: 10)
 * @returns True if step is within valid range
 */
function _isValidStepIndex(step: number, totalSteps: number = 10): boolean {
  return Number.isInteger(step) && step >= 0 && step < totalSteps;
}

// =============================================================================
// FIELD VALIDATION
// =============================================================================

/**
 * Check if a string is a valid quiz field name
 * @param field - Field name to validate
 * @returns True if field is a valid QuizAnswers key
 */
function _isValidQuizField(field: string): field is keyof QuizAnswers {
  const validFields: string[] = [
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
  return validFields.includes(field);
}

/**
 * Get missing quiz fields
 * @param answers - Partial quiz answers
 * @returns Array of missing field names (in Polish)
 */
function _getMissingFields(answers: Partial<QuizAnswers>): string[] {
  const missing: string[] = [];

  if (!answers.role || !isValidQuizAnswer(answers.role)) {
    missing.push('rola');
  }
  if (!answers.primary_goal || !isValidQuizAnswer(answers.primary_goal)) {
    missing.push('cel główny');
  }
  if (!answers.pain_point || !isValidQuizAnswer(answers.pain_point)) {
    missing.push('problem');
  }
  if (!answers.workflow || !isValidQuizAnswer(answers.workflow)) {
    missing.push('workflow');
  }
  if (!answers.time_investment || !isValidQuizAnswer(answers.time_investment)) {
    missing.push('czas');
  }
  if (!answers.team_context || !isValidQuizAnswer(answers.team_context)) {
    missing.push('kontekst zespołowy');
  }
  if (
    !answers.experience_level ||
    !isValidQuizAnswer(answers.experience_level)
  ) {
    missing.push('poziom doświadczenia');
  }
  if (!answers.budget || !isValidQuizAnswer(answers.budget)) {
    missing.push('budżet');
  }
  if (
    !answers.integrations ||
    !isValidIntegrationsArray(answers.integrations)
  ) {
    missing.push('narzędzia');
  }
  // specific_challenge is optional, so we don't check it

  return missing;
}

/**
 * Get field display name in Polish
 * @param field - Field key
 * @returns Polish display name
 */
function _getFieldDisplayName(field: keyof QuizAnswers): string {
  const displayNames: Record<keyof QuizAnswers, string> = {
    role: 'Rola zawodowa',
    primary_goal: 'Główny cel',
    pain_point: 'Problem',
    workflow: 'Obecny workflow',
    time_investment: 'Czas na naukę',
    team_context: 'Kontekst zespołowy',
    experience_level: 'Poziom doświadczenia',
    budget: 'Budżet',
    integrations: 'Używane narzędzia',
    specific_challenge: 'Konkretne wyzwanie',
  };

  return displayNames[field];
}
