'use client';

import React from 'react';

interface AuthLoadingSpinnerProps {
  message?: string;
}

export default function AuthLoadingSpinner({
  message = 'Loading...',
}: AuthLoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Logo and Spinner */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/logo transparent.png"
            alt="StrayLight"
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
          <div className="ml-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            StrayLight
          </h2>
          <p className="text-white/70 text-sm md:text-base">{message}</p>
        </div>

        {/* Loading Animation Dots */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-0"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-150"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>
    </div>
  );
}
