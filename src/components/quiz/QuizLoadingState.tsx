'use client';

import React from 'react';

/**
 * Loading state component displayed while generating quiz recommendations
 */
export default function QuizLoadingState() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin w-16 h-16 border-4 border-white/20 border-t-white rounded-full" />
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white font-inter">
            Analizujemy Twoje odpowiedzi...
          </h2>
          <p className="text-white/60 font-source">
            Dobieramy najlepsze narzędzia AI dla Ciebie
          </p>
        </div>

        {/* Optional progress dots */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
          <div
            className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
            style={{ animationDelay: '200ms' }}
          />
          <div
            className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
            style={{ animationDelay: '400ms' }}
          />
        </div>
      </div>
    </div>
  );
}
