'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { QuizStep } from '@/lib/types/quiz';
import { TOTAL_QUIZ_STEPS } from '@/lib/quiz/constants';

interface QuizHeaderProps {
  currentStep: QuizStep;
  totalSteps?: number;
  onLeave?: () => void;
}

/**
 * Quiz Header Component - Typeform-style header
 * Shows centered visual progress stepper with sliding window (5 steps visible)
 * Fixed at the top of the page for consistent navigation
 */
export default function QuizHeader({
  currentStep,
  totalSteps = TOTAL_QUIZ_STEPS,
  onLeave,
}: QuizHeaderProps) {
  // Calculate offset for sliding animation
  const slideOffset = useMemo(() => {
    const WINDOW_SIZE = 4; // Show only 4 steps at a time
    // Calculate how many steps to slide left
    const offset = Math.min(currentStep, totalSteps - WINDOW_SIZE);
    return offset;
  }, [currentStep, totalSteps]);

  // Calculate exact step width for perfect sliding
  const STEP_WIDTH = 40; // circle width
  const SPACING = 12; // space before and after line
  const LINE_WIDTH = 16; // connector line
  // One complete step unit = circle + spacing + line + spacing = 40 + 12 + 16 + 12 = 80px
  const STEP_UNIT = STEP_WIDTH + SPACING + LINE_WIDTH + SPACING;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 py-4">
          {/* Leave button */}
          {onLeave && (
            <button
              onClick={onLeave}
              className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white text-sm font-medium font-source transition-colors duration-200"
              aria-label="Opuść quiz"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Opuść quiz
            </button>
          )}

          {/* Progress stepper - centered */}
          <div className="flex-1 flex justify-center">
            {/* Container with overflow hidden to clip invisible steps - shows only 4 steps */}
            <div
              className="overflow-hidden flex items-center"
              style={{
                width: `${STEP_UNIT * 4}px`, // 320px for exactly 4 steps
                height: '64px',
                paddingLeft: '20px',
              }}
            >
              {/* Progress Stepper - sliding chain of all steps */}
              <motion.div
                className="flex items-center"
                animate={{
                  x: -slideOffset * STEP_UNIT,
                }}
                transition={{
                  duration: 0.4,
                  ease: 'easeInOut',
                }}
              >
                {Array.from({ length: totalSteps }, (_, step) => {
                  const isCompleted = step < currentStep;
                  const isActive = step === currentStep;

                  return (
                    <React.Fragment key={step}>
                      {/* Step indicator with margin */}
                      <div
                        className="flex flex-col items-center flex-shrink-0"
                        style={{ marginRight: `${SPACING}px` }}
                      >
                        <div
                          className={`
                            flex items-center justify-center
                            rounded-full
                            transition-all duration-300
                            ${
                              isCompleted
                                ? 'bg-white text-black'
                                : isActive
                                  ? 'bg-white text-black ring-2 ring-white/30 ring-offset-2 ring-offset-black scale-110'
                                  : 'bg-white/10 text-white/40 border border-white/20'
                            }
                          `}
                          style={{
                            width: `${STEP_WIDTH}px`,
                            height: `${STEP_WIDTH}px`,
                          }}
                          aria-label={`Krok ${step + 1}`}
                          aria-current={isActive ? 'step' : undefined}
                        >
                          {isCompleted ? (
                            // Checkmark for completed steps
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            // Step number for active and upcoming steps
                            <span className="text-base font-semibold font-inter">
                              {step + 1}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Connector line between steps (not after last step) */}
                      {step < totalSteps - 1 && (
                        <div
                          className={`
                            h-0.5 flex-shrink-0
                            transition-all duration-500
                            ${isCompleted ? 'bg-white' : 'bg-white/20'}
                          `}
                          style={{
                            width: `${LINE_WIDTH}px`,
                            marginRight: `${SPACING}px`,
                          }}
                          aria-hidden="true"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </motion.div>
            </div>
          </div>

          {/* Right side placeholder for balance */}
          <div className="w-[100px]"></div>
        </div>
      </div>
    </header>
  );
}
