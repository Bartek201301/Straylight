'use client';

import React from 'react';
import { QuizOption as QuizOptionType } from '@/lib/types/quiz';

interface QuizOptionProps {
  option: QuizOptionType;
  isSelected: boolean;
  onSelect: () => void;
  isMultiSelect?: boolean;
}

/**
 * Single quiz option card component
 * Displays as clickable card with hover and selected states
 * Supports both single-select (radio) and multi-select (checkbox) modes
 */
export default function QuizOption({
  option,
  isSelected,
  onSelect,
}: QuizOptionProps) {
  const baseClasses =
    'bg-black rounded-2xl p-4 transition-all duration-300 cursor-pointer group';

  const stateClasses = isSelected
    ? 'border-2 border-white/60 shadow-lg'
    : 'border border-white/20 hover:border-white/40 hover:scale-[1.01] hover:shadow-md';

  return (
    <div
      onClick={onSelect}
      className={`${baseClasses} ${stateClasses}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Optional icon */}
        {option.icon && (
          <span className="text-2xl flex-shrink-0">{option.icon}</span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white font-source">
            {option.label}
          </div>

          {/* Optional description */}
          {option.description && (
            <div className="text-sm text-white/60 mt-1 font-source">
              {option.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
