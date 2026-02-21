import { QuizQuestion } from '@/lib/types/quiz';

/**
 * Quiz Questions Configuration - Complete 10-Question Flow
 *
 * This file contains all questions for the enhanced LightTool quiz.
 * All text is in Polish for the target audience.
 *
 * Question Flow Logic:
 * 1. WHO (role) → 2. WHAT (goal) → 3. WHY (pain point) → 4. HOW (workflow)
 * → 5. WHEN (time) → 6. WHERE (team) → 7. WHICH (level) → 8. BUDGET
 * → 9. INTEGRATIONS → 10. SPECIFIC CHALLENGE (optional)
 */

// =============================================================================
// QUIZ QUESTIONS
// =============================================================================

/**
 * Complete array of 10 quiz questions
 * Each question maps to a field in QuizAnswers
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ============================================================================
  // Q1: WHO - Professional Role/Industry
  // ============================================================================
  {
    id: 'role',
    question: 'Kim jesteś zawodowo?',
    field: 'role',
    options: [
      {
        value: 'freelancer',
        label: 'Freelancer / Solopreneur',
      },
      {
        value: 'marketing_content',
        label: 'Marketing i Content Creation',
      },
      {
        value: 'developer',
        label: 'Programista / Developer',
      },
      {
        value: 'designer',
        label: 'Designer (UX/UI/Graphic)',
      },
      {
        value: 'business_management',
        label: 'Biznes i Management',
      },
      {
        value: 'student',
        label: 'Student / Osoba ucząca się',
      },
      {
        value: 'other',
        label: 'Inne',
      },
    ],
  },

  // ============================================================================
  // Q2: WHAT - Primary Goal
  // ============================================================================
  {
    id: 'primary_goal',
    question: 'Co chcesz osiągnąć dzięki AI?',
    field: 'primary_goal',
    options: [
      {
        value: 'content_creation',
        label: 'Przyspieszyć tworzenie treści',
      },
      {
        value: 'task_automation',
        label: 'Zautomatyzować powtarzalne zadania',
      },
      {
        value: 'learn_skills',
        label: 'Nauczyć się nowych umiejętności',
      },
      {
        value: 'team_productivity',
        label: 'Zwiększyć produktywność zespołu',
      },
      {
        value: 'ideas_inspiration',
        label: 'Generować pomysły i inspiracje',
      },
      {
        value: 'data_analysis',
        label: 'Analizować dane i tworzyć raporty',
      },
      {
        value: 'code_automation',
        label: 'Tworzyć kod i automatyzacje',
      },
    ],
  },

  // ============================================================================
  // Q3: WHY - Current Pain Point
  // ============================================================================
  {
    id: 'pain_point',
    question: 'Jaki jest Twój największy problem?',
    field: 'pain_point',
    options: [
      {
        value: 'too_much_time',
        label: 'Za dużo czasu na rutynowe zadania',
      },
      {
        value: 'dont_know_start',
        label: 'Brak wiedzy, od czego zacząć',
      },
      {
        value: 'underutilized_tools',
        label: 'Mam narzędzia, ale ich nie wykorzystuję',
      },
      {
        value: 'manual_work',
        label: 'Muszę robić wszystko ręcznie',
      },
      {
        value: 'better_results',
        label: 'Chcę lepszych wyników szybciej',
      },
      {
        value: 'need_inspiration',
        label: 'Potrzebuję inspiracji i pomysłów',
      },
    ],
  },

  // ============================================================================
  // Q4: HOW - Current Workflow State
  // ============================================================================
  {
    id: 'workflow',
    question: 'Jak obecnie pracujesz z AI?',
    field: 'workflow',
    options: [
      {
        value: 'manual_everything',
        label: 'Wszystko robię ręcznie (chcę zacząć z AI)',
      },
      {
        value: 'basic_tools',
        label: 'Używam podstawowych narzędzi (chcę upgrade)',
      },
      {
        value: 'testing_ai',
        label: 'Już testuję AI (chcę optymalizować)',
      },
      {
        value: 'advanced_user',
        label: 'Zaawansowane użytkowanie (szukam niszowych rozwiązań)',
      },
    ],
  },

  // ============================================================================
  // Q5: WHEN - Time Investment
  // ============================================================================
  {
    id: 'time_investment',
    question: 'Ile czasu możesz poświęcić na naukę/korzystanie?',
    field: 'time_investment',
    options: [
      {
        value: 'quick_wins',
        label: 'Szybkie wygrane (5-15 min dziennie)',
      },
      {
        value: 'moderate_learning',
        label: 'Umiarkowana nauka (30-60 min dziennie)',
      },
      {
        value: 'deep_learning',
        label: 'Głęboka nauka (2+ godz tygodniowo)',
      },
    ],
  },

  // ============================================================================
  // Q6: WHERE - Team Context
  // ============================================================================
  {
    id: 'team_context',
    question: 'W jakim kontekście będziesz używać AI?',
    field: 'team_context',
    options: [
      {
        value: 'solo',
        label: 'Pracuję solo',
      },
      {
        value: 'small_team',
        label: 'Mały zespół (2-5 osób)',
      },
      {
        value: 'large_team',
        label: 'Duży zespół (6+ osób)',
      },
      {
        value: 'client_agency',
        label: 'Klient/agencja (współpraca zewnętrzna)',
      },
    ],
  },

  // ============================================================================
  // Q7: WHICH - Experience Level
  // ============================================================================
  {
    id: 'experience_level',
    question: 'Jaki jest Twój poziom doświadczenia z AI?',
    field: 'experience_level',
    options: [
      {
        value: 'beginner',
        label: 'Początkujący (nigdy nie używałem AI)',
      },
      {
        value: 'basic',
        label: 'Podstawowy (używam ChatGPT czasami)',
      },
      {
        value: 'intermediate',
        label: 'Średniozaawansowany (używam regularnie)',
      },
      {
        value: 'advanced',
        label: 'Zaawansowany (tworzę własne workflow)',
      },
    ],
  },

  // ============================================================================
  // Q8: BUDGET - Price Constraints
  // ============================================================================
  {
    id: 'budget',
    question: 'Jaki masz budżet na narzędzia AI?',
    field: 'budget',
    options: [
      {
        value: 'free_only',
        label: 'Tylko darmowe narzędzia',
      },
      {
        value: 'up_to_50',
        label: 'Do 50 PLN/miesiąc',
      },
      {
        value: '50_to_200',
        label: '50-200 PLN/miesiąc',
      },
      {
        value: '200_to_500',
        label: '200-500 PLN/miesiąc',
      },
      {
        value: 'unlimited',
        label: 'Bez limitu',
      },
    ],
  },

  // ============================================================================
  // Q9: INTEGRATIONS - Existing Tools (Multi-Select)
  // ============================================================================
  {
    id: 'integrations',
    question: 'Jakich narzędzi już używasz?',
    field: 'integrations',
    options: [
      {
        value: 'google_workspace',
        label: 'Google Workspace (Docs, Sheets, Drive)',
      },
      {
        value: 'microsoft_365',
        label: 'Microsoft 365 (Word, Excel, Teams)',
      },
      {
        value: 'notion_obsidian',
        label: 'Notion / Obsidian',
      },
      {
        value: 'slack_discord',
        label: 'Slack / Discord',
      },
      {
        value: 'figma_adobe',
        label: 'Figma / Adobe Creative',
      },
      {
        value: 'github_gitlab',
        label: 'GitHub / GitLab',
      },
      {
        value: 'wordpress_cms',
        label: 'WordPress / CMS',
      },
      {
        value: 'salesforce_hubspot',
        label: 'Salesforce / HubSpot',
      },
      {
        value: 'none',
        label: 'Żadne z powyższych',
      },
    ],
  },

  // ============================================================================
  // Q10: SPECIFIC CHALLENGE - Free-Text (Optional)
  // ============================================================================
  {
    id: 'specific_challenge',
    question: 'Opisz konkretne wyzwanie, które chcesz rozwiązać (opcjonalne)',
    field: 'specific_challenge',
    options: [], // Empty for free-text input
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a specific quiz question by its ID
 * @param id - Question ID to retrieve
 * @returns The quiz question or undefined if not found
 */
function _getQuestionById(id: string): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find((q) => q.id === id);
}

/**
 * Get a quiz question by its index (step number)
 * @param step - Step number (0-based index)
 * @returns The quiz question or undefined if index out of bounds
 */
function _getQuestionByStep(step: number): QuizQuestion | undefined {
  return QUIZ_QUESTIONS[step];
}

/**
 * Get the total number of quiz questions
 * @returns Number of questions (should be 10)
 */
function _getQuestionCount(): number {
  return QUIZ_QUESTIONS.length;
}

/**
 * Get all question IDs
 * @returns Array of question IDs
 */
function _getQuestionIds(): string[] {
  return QUIZ_QUESTIONS.map((q) => q.id);
}

/**
 * Check if a question supports multi-select
 * @param questionId - Question ID to check
 * @returns True if question is multi-select (Q9: integrations)
 */
export function isMultiSelectQuestion(questionId: string): boolean {
  return questionId === 'integrations';
}

/**
 * Check if a question is free-text
 * @param questionId - Question ID to check
 * @returns True if question is free-text (Q10: specific_challenge)
 */
export function isFreeTextQuestion(questionId: string): boolean {
  return questionId === 'specific_challenge';
}
