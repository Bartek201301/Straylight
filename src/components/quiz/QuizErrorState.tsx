'use client';

import React from 'react';
import Link from 'next/link';

interface QuizErrorStateProps {
  error: string;
  onRetry?: () => void;
}

/**
 * Error state component displayed when something goes wrong
 */
export default function QuizErrorState({
  error,
  onRetry,
}: QuizErrorStateProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Error icon */}
        <div className="text-6xl">⚠️</div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white font-inter">
            Coś poszło nie tak
          </h2>
          <p className="text-white/80 font-source">{error}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 hover:scale-[1.01] transition-all duration-300 font-semibold shadow-lg border border-black/10 font-source"
            >
              Spróbuj ponownie
            </button>
          )}
          <Link
            href="/quiz/questions"
            className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium font-source text-center"
          >
            Wróć do quizu
          </Link>
        </div>
      </div>
    </div>
  );
}
