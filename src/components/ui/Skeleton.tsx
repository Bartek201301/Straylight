'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'text':
        return 'rounded-sm h-4';
      default:
        return 'rounded-md';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]';
      case 'pulse':
        return 'animate-pulse bg-gray-200 dark:bg-gray-700';
      case 'none':
        return 'bg-gray-200 dark:bg-gray-700';
      default:
        return 'animate-pulse bg-gray-200 dark:bg-gray-700';
    }
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && {
      height: typeof height === 'number' ? `${height}px` : height,
    }),
  };

  return (
    <div
      className={cn(
        getAnimationClasses(),
        getVariantClasses(),
        variant === 'text' ? 'h-4' : 'h-6',
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Utility skeleton components
function _SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '75%',
  ...props
}: {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
} & Omit<SkeletonProps, 'variant'>) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'w-full',
            i === lines - 1 && lines > 1 ? `w-[${lastLineWidth}]` : ''
          )}
          {...props}
        />
      ))}
    </div>
  );
}

function _SkeletonAvatar({
  size = 40,
  className,
  ...props
}: {
  size?: number;
  className?: string;
} & Omit<SkeletonProps, 'variant' | 'width' | 'height'>) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
      {...props}
    />
  );
}

function _SkeletonButton({
  className,
  width = 120,
  height = 40,
  ...props
}: {
  className?: string;
  width?: number;
  height?: number;
} & Omit<SkeletonProps, 'variant'>) {
  return (
    <Skeleton
      variant="default"
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
      {...props}
    />
  );
}
