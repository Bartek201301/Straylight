import React from 'react';
import BaseSkeleton, { TextLineSkeleton, CircleSkeleton } from './BaseSkeleton';

interface DashboardSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed';
  showCharts?: boolean;
  className?: string;
}

export default function DashboardSkeleton({
  variant = 'default',
  showCharts = true,
  className = '',
}: DashboardSkeletonProps) {
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <BaseSkeleton
              className="h-8 max-w-sm"
              variant="shimmer"
              size="xl"
              rounded="lg"
            />
            <TextLineSkeleton
              lines={isCompact ? 1 : 2}
              variant="wave"
              lastLineWidth="60%"
              className="max-w-2xl"
            />
          </div>

          {/* Refresh/Action button */}
          <div className="flex space-x-3">
            <BaseSkeleton className="w-10 h-10" variant="glow" rounded="lg" />
            {isDetailed && (
              <BaseSkeleton
                className="w-24 h-10"
                variant="pulse"
                rounded="lg"
              />
            )}
          </div>
        </div>

        {/* Last updated indicator */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <BaseSkeleton className="h-4 w-48" variant="pulse" />
        </div>
      </div>

      {/* Enhanced Stats grid skeleton */}
      <div
        className={`grid grid-cols-1 ${isCompact ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4 md:gap-6`}
      >
        {Array.from({ length: isCompact ? 3 : 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl p-6 group hover:bg-white/8 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                {/* Stat label */}
                <BaseSkeleton
                  className="h-4 w-28"
                  variant="shimmer"
                  rounded="md"
                />

                {/* Stat value */}
                <BaseSkeleton
                  className="h-10 w-20"
                  variant="glow"
                  size="xl"
                  rounded="lg"
                />

                {/* Change indicator */}
                <div className="flex items-center space-x-2">
                  <BaseSkeleton
                    className="h-3 w-3"
                    variant="pulse"
                    rounded="full"
                  />
                  <BaseSkeleton className="h-3 w-16" variant="wave" />
                </div>
              </div>

              {/* Icon placeholder */}
              <CircleSkeleton
                size="lg"
                variant="shimmer"
                className="opacity-80"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Charts area skeleton */}
      {showCharts && (
        <div
          className={`grid grid-cols-1 ${isDetailed ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}
        >
          {/* Main chart */}
          <div
            className={`bg-white/5 border border-white/10 rounded-xl p-6 ${isDetailed ? 'lg:col-span-2' : ''}`}
          >
            <div className="flex items-center justify-between mb-6">
              <BaseSkeleton
                className="h-6 w-48"
                variant="shimmer"
                size="lg"
                rounded="md"
              />

              {/* Chart controls */}
              <div className="flex space-x-2">
                {['1D', '7D', '30D'].map((period) => (
                  <BaseSkeleton
                    key={period}
                    className="h-8 w-10"
                    variant="pulse"
                    rounded="md"
                  />
                ))}
              </div>
            </div>

            {/* Chart area */}
            <div className="space-y-4">
              {/* Chart bars/lines simulation */}
              <div className="flex items-end justify-between h-40 space-x-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const heights = [
                    'h-8',
                    'h-16',
                    'h-24',
                    'h-32',
                    'h-20',
                    'h-28',
                  ];
                  const randomHeight =
                    heights[Math.floor(Math.random() * heights.length)];

                  return (
                    <BaseSkeleton
                      key={i}
                      className={`flex-1 ${randomHeight} max-w-8`}
                      variant="glow"
                      rounded="sm"
                    />
                  );
                })}
              </div>

              {/* Chart legend */}
              <div className="flex items-center justify-center space-x-6 pt-4 border-t border-white/5">
                {Array.from({ length: isDetailed ? 4 : 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <BaseSkeleton
                      className="w-3 h-3"
                      variant="pulse"
                      rounded="full"
                    />
                    <BaseSkeleton className="h-4 w-16" variant="shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel / Secondary chart */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <BaseSkeleton
              className="h-6 w-40 mb-6"
              variant="wave"
              size="lg"
              rounded="md"
            />

            <div className="space-y-4">
              {Array.from({ length: isCompact ? 4 : 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/2"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <CircleSkeleton size="sm" variant="pulse" />
                    <div className="space-y-1 flex-1">
                      <BaseSkeleton className="h-4 w-24" variant="shimmer" />
                      <BaseSkeleton className="h-3 w-16" variant="wave" />
                    </div>
                  </div>

                  <BaseSkeleton
                    className="h-6 w-12"
                    variant="glow"
                    rounded="md"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional detailed panel */}
          {isDetailed && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 lg:col-span-1">
              <BaseSkeleton
                className="h-6 w-32 mb-6"
                variant="shimmer"
                size="lg"
              />

              {/* Mini stats */}
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="text-center p-4 rounded-lg bg-white/2"
                  >
                    <BaseSkeleton
                      className="h-8 w-16 mx-auto mb-2"
                      variant="glow"
                      size="xl"
                    />
                    <BaseSkeleton
                      className="h-3 w-20 mx-auto"
                      variant="pulse"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Loading indicator */}
      <div className="text-center py-8">
        <div className="inline-flex items-center space-x-3 text-white/60">
          <div className="animate-spin-slow rounded-full h-6 w-6 border-2 border-transparent border-t-white/60 border-r-white/30"></div>
          <div className="space-y-1">
            <span className="block text-sm font-medium">
              Loading {isCompact ? 'dashboard' : 'dashboard analytics'}...
            </span>
            <BaseSkeleton className="h-2 w-32" variant="shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
