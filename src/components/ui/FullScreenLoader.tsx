'use client';

import React from 'react';

interface FullScreenLoaderProps {
  title?: string;
  message?: string;
  showLogo?: boolean;
  logoSrc?: string;
}

export default function FullScreenLoader({
  title = 'StrayLight',
  message = 'Loading...',
  showLogo = true,
  logoSrc = '/logo transparent.png',
}: FullScreenLoaderProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        {showLogo ? (
          <div className="flex items-center justify-center mb-6">
            <img
              src={logoSrc}
              alt={title}
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
            <div className="ml-4">
              <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center mb-6">
            <div className="h-10 w-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <div className="space-y-2">
          {title && (
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              {title}
            </h2>
          )}
          {message && (
            <p className="text-white/70 text-sm md:text-base">{message}</p>
          )}
        </div>

        <div className="flex justify-center space-x-1 mt-6">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 bg-white/30 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
