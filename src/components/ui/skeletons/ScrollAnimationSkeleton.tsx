import React from 'react';

interface ScrollAnimationSkeletonProps {
  type?: 'sticky' | 'container';
  className?: string;
}

export default function ScrollAnimationSkeleton({
  type = 'sticky',
  className = '',
}: ScrollAnimationSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      {type === 'sticky' ? (
        // StickyScroll skeleton
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="h-12 bg-white/10 rounded-lg mb-4 max-w-2xl mx-auto"></div>
              <div className="h-6 bg-white/5 rounded max-w-xl mx-auto"></div>
            </div>

            {/* Content sections */}
            <div className="space-y-16">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col lg:flex-row gap-8 lg:gap-16"
                >
                  {/* Left content */}
                  <div className="flex-1 space-y-4">
                    <div className="h-8 bg-white/10 rounded max-w-xs"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/5 rounded"></div>
                      <div className="h-4 bg-white/5 rounded max-w-4/5"></div>
                      <div className="h-4 bg-white/5 rounded max-w-3/5"></div>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="flex-1">
                    <div className="h-64 bg-white/5 rounded-xl border border-white/10"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading indicator */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center space-x-2 text-white/60">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
              <span className="text-sm">Loading interactive content...</span>
            </div>
          </div>
        </div>
      ) : (
        // ContainerScroll skeleton
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="h-16 bg-white/10 rounded-lg mb-4 max-w-3xl mx-auto"></div>
              <div className="h-6 bg-white/5 rounded max-w-2xl mx-auto"></div>
            </div>

            {/* Container content */}
            <div className="relative">
              <div className="h-96 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full mx-auto"></div>
                  <div className="h-6 bg-white/10 rounded max-w-xs mx-auto"></div>
                  <div className="h-4 bg-white/5 rounded max-w-48 mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Loading indicator */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center space-x-2 text-white/60">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                <span className="text-sm">Loading scroll animation...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
