'use client';

import React from 'react';

type SkeletonVariant = 'pulse' | 'shimmer' | 'wave' | 'glow';
type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';

interface BaseSkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Enhanced base skeleton component with multiple animation variants
 */
export default function BaseSkeleton({
  className = '',
  variant = 'shimmer',
  size = 'md',
  rounded = 'md',
  children,
  style,
}: BaseSkeletonProps) {
  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const variantClasses = {
    pulse: 'animate-pulse bg-white/10',
    shimmer:
      'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]',
    wave: 'animate-wave bg-gradient-to-r from-white/5 via-white/15 to-white/5',
    glow: 'animate-glow bg-white/8 shadow-lg shadow-white/5',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${roundedClasses[rounded]}
        ${variantClasses[variant]}
        ${className}
      `}
      style={style}
      role="status"
      aria-label="Loading"
    >
      {children}
    </div>
  );
}

/**
 * Skeleton for text lines with realistic spacing
 */
export function TextLineSkeleton({
  lines = 1,
  variant = 'shimmer',
  lastLineWidth = '75%',
  className = '',
}: {
  lines?: number;
  variant?: SkeletonVariant;
  lastLineWidth?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <BaseSkeleton
          key={index}
          variant={variant}
          size="md"
          className={`w-full ${
            index === lines - 1 && lines > 1 ? `max-w-[${lastLineWidth}]` : ''
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for circular avatars/images
 */
export function CircleSkeleton({
  size = 'md',
  variant = 'shimmer',
  className = '',
}: {
  size?: SkeletonSize;
  variant?: SkeletonVariant;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <BaseSkeleton
      variant={variant}
      rounded="full"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}

/**
 * Skeleton for rectangular images/cards
 */
function _RectangleSkeleton({
  width = 'w-full',
  height = 'h-48',
  variant = 'shimmer',
  rounded = 'lg',
  className = '',
}: {
  width?: string;
  height?: string;
  variant?: SkeletonVariant;
  rounded?: BaseSkeletonProps['rounded'];
  className?: string;
}) {
  return (
    <BaseSkeleton
      variant={variant}
      rounded={rounded}
      className={`${width} ${height} ${className}`}
    />
  );
}
