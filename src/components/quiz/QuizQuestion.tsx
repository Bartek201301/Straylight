'use client';

import React from 'react';
import { QuizQuestion as QuizQuestionType, QuizStep } from '@/lib/types/quiz';
import QuizOption from './QuizOption';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedValue: string | string[] | undefined;
  onSelect: (value: string) => void;
  currentStep: QuizStep;
  totalSteps: number;
  isMultiSelect?: boolean;
}

/**
 * Quiz question component
 * Displays a single question with single-select or multi-select options
 */
export default function QuizQuestion({
  question,
  selectedValue,
  onSelect,
  currentStep,
  totalSteps,
  isMultiSelect = false,
}: QuizQuestionProps) {
  // Determine if an option is selected
  const isOptionSelected = (optionValue: string): boolean => {
    if (isMultiSelect) {
      return (
        Array.isArray(selectedValue) && selectedValue.includes(optionValue)
      );
    } else {
      return selectedValue === optionValue;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question header with number */}
      <div className="text-center space-y-2">
        <div className="text-sm text-white/60 font-source">
          Pytanie {currentStep + 1} z {totalSteps}
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white font-inter leading-tight">
          {question.question}
        </h2>
        {isMultiSelect && (
          <p className="text-sm text-white/50 font-source italic">
            Możesz wybrać kilka opcji
          </p>
        )}
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option) => (
          <QuizOption
            key={option.value}
            option={option}
            isSelected={isOptionSelected(option.value)}
            onSelect={() => onSelect(option.value)}
            isMultiSelect={isMultiSelect}
          />
        ))}
      </div>
    </div>
  );
}
