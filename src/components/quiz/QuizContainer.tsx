'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizStep, QuizAnswers, PartialQuizAnswers } from '@/lib/types/quiz';
import {
  QUIZ_QUESTIONS,
  isMultiSelectQuestion,
  isFreeTextQuestion,
} from '@/lib/quiz/questions';
import {
  TOTAL_QUIZ_STEPS,
  QUIZ_ROUTES,
  MAX_ANSWER_LENGTH,
} from '@/lib/quiz/constants';
import { saveQuizAnswers, getQuizAnswers } from '@/lib/quiz/storage';
import { areAllQuestionsAnswered } from '@/lib/quiz/validation';
import { getNextStep, getPreviousStep, getStepName } from '@/lib/quiz/helpers';
import QuizHeader from './QuizHeader';
import QuizQuestion from './QuizQuestion';
import QuizExitDialog from './QuizExitDialog';

/**
 * Main quiz container component
 * Manages quiz state, navigation, and localStorage persistence
 * Handles regular single-select, multi-select (Q9), and free-text (Q10)
 */
export default function QuizContainer() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<QuizStep>(0);
  const [answers, setAnswers] = useState<PartialQuizAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Load saved answers from localStorage on mount
  useEffect(() => {
    const savedAnswers = getQuizAnswers();
    if (savedAnswers) {
      setAnswers(savedAnswers);
    }
    setIsLoading(false);
  }, []);

  // Get current question
  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const currentField = getStepName(currentStep);
  const selectedValue = answers[currentField];

  // Determine if current question is multi-select or free-text
  const isMultiSelect = isMultiSelectQuestion(currentQuestion.id);
  const isFreeText = isFreeTextQuestion(currentQuestion.id);

  // Check if current step has an answer
  const hasAnswer = (() => {
    if (isMultiSelect) {
      // For multi-select, check if array exists and has at least one item
      return Array.isArray(selectedValue) && selectedValue.length > 0;
    } else if (isFreeText) {
      // For free-text, it's optional so always allow next
      return true;
    } else {
      // For regular single-select, check if value exists
      return !!selectedValue;
    }
  })();

  // Handle single-select answer
  const handleSelectAnswer = (value: string) => {
    const updatedAnswers: PartialQuizAnswers = {
      ...answers,
      [currentField]: value,
    };

    setAnswers(updatedAnswers);

    // Save to localStorage if all questions answered
    if (areAllQuestionsAnswered(updatedAnswers)) {
      saveQuizAnswers(updatedAnswers as QuizAnswers);
    }
  };

  // Handle multi-select toggle
  const handleToggleMultiSelect = (value: string) => {
    const currentValues = (selectedValue as string[]) || [];

    // Handle "none" option - if selected, clear all others
    if (value === 'none') {
      const newValues = currentValues.includes('none') ? [] : ['none'];
      const updatedAnswers: PartialQuizAnswers = {
        ...answers,
        [currentField]: newValues,
      };
      setAnswers(updatedAnswers);
      return;
    }

    // If "none" was previously selected, clear it when selecting other options
    const filteredValues = currentValues.filter((v) => v !== 'none');

    let newValues: string[];
    if (filteredValues.includes(value)) {
      // Remove value
      newValues = filteredValues.filter((v) => v !== value);
    } else {
      // Add value
      newValues = [...filteredValues, value];
    }

    const updatedAnswers: PartialQuizAnswers = {
      ...answers,
      [currentField]: newValues,
    };

    setAnswers(updatedAnswers);

    // Save to localStorage if all questions answered
    if (areAllQuestionsAnswered(updatedAnswers)) {
      saveQuizAnswers(updatedAnswers as QuizAnswers);
    }
  };

  // Handle free-text input
  const handleFreeTextChange = (value: string) => {
    const updatedAnswers: PartialQuizAnswers = {
      ...answers,
      [currentField]: value.slice(0, MAX_ANSWER_LENGTH), // Enforce max length
    };

    setAnswers(updatedAnswers);

    // Save to localStorage if all questions answered
    if (areAllQuestionsAnswered(updatedAnswers)) {
      saveQuizAnswers(updatedAnswers as QuizAnswers);
    }
  };

  // Handle next button
  const handleNext = () => {
    if (!hasAnswer && !isFreeText) return;

    const nextStep = getNextStep(currentStep);

    if (nextStep !== null) {
      // Move to next step
      setCurrentStep(nextStep);
    } else {
      // Quiz completed - navigate to results
      if (areAllQuestionsAnswered(answers)) {
        saveQuizAnswers(answers as QuizAnswers);
        router.push(QUIZ_ROUTES.results);
      }
    }
  };

  // Handle back button
  const handleBack = () => {
    const prevStep = getPreviousStep(currentStep);
    if (prevStep !== null) {
      setCurrentStep(prevStep);
    }
  };

  // Handle leave quiz request
  const handleLeaveRequest = () => {
    setShowExitDialog(true);
  };

  // Handle confirmed exit
  const handleConfirmExit = () => {
    // Simply navigate back to landing page
    // Note: Current progress will be lost, but this is intentional for "exit" behavior
    router.push(QUIZ_ROUTES.landing);
  };

  // Handle cancel exit
  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <>
        <QuizHeader
          currentStep={0}
          totalSteps={TOTAL_QUIZ_STEPS}
          onLeave={handleLeaveRequest}
        />
        <div className="min-h-screen bg-black pt-24 pb-12 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Fixed header with logo and progress stepper */}
      <QuizHeader
        currentStep={currentStep}
        totalSteps={TOTAL_QUIZ_STEPS}
        onLeave={handleLeaveRequest}
      />

      {/* Main content with top padding for fixed header */}
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Question with slide animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="bg-black border border-white/20 rounded-2xl p-6 md:p-8"
              >
                {isFreeText ? (
                  /* Free-text input for Q10 */
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="text-sm text-white/60 font-source">
                        Pytanie {currentStep + 1} z {TOTAL_QUIZ_STEPS}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white font-inter leading-tight">
                        {currentQuestion.question}
                      </h2>
                      <p className="text-sm text-white/50 font-source italic">
                        To pytanie jest opcjonalne - możesz je pominąć
                      </p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={(selectedValue as string) || ''}
                        onChange={(e) => handleFreeTextChange(e.target.value)}
                        placeholder="Np. 'Muszę pisać 10 postów na LinkedIn tygodniowo i brakuje mi czasu na research'"
                        maxLength={MAX_ANSWER_LENGTH}
                        rows={5}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 font-source focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 resize-none"
                      />
                      <div className="text-right text-xs text-white/40 font-source">
                        {((selectedValue as string) || '').length}/
                        {MAX_ANSWER_LENGTH} znaków
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular single-select or multi-select */
                  <QuizQuestion
                    question={currentQuestion}
                    selectedValue={selectedValue}
                    onSelect={
                      isMultiSelect
                        ? handleToggleMultiSelect
                        : handleSelectAnswer
                    }
                    currentStep={currentStep}
                    totalSteps={TOTAL_QUIZ_STEPS}
                    isMultiSelect={isMultiSelect}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              {/* Back button */}
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium font-source transition-all duration-300 ${
                  currentStep === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/20'
                }`}
              >
                Wstecz
              </button>

              {/* Next button */}
              <button
                onClick={handleNext}
                disabled={!hasAnswer && !isFreeText}
                className={`px-6 py-3 rounded-xl font-semibold font-source shadow-lg transition-all duration-300 ${
                  hasAnswer || isFreeText
                    ? 'bg-white text-black hover:bg-gray-100 hover:scale-[1.01] hover:shadow-xl border border-black/10'
                    : 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed'
                }`}
              >
                {currentStep === TOTAL_QUIZ_STEPS - 1
                  ? 'Zobacz rekomendacje'
                  : 'Dalej'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <QuizExitDialog
        isOpen={showExitDialog}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
      />
    </>
  );
}
