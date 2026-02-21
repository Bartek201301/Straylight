import React from 'react';
import { cn } from '@/lib/utils';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'content';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: ContainerSize;
  as?: React.ElementType;
  withGutters?: boolean;
  centered?: boolean;
}

/**
 * Container component for consistent, responsive layouts.
 *
 * @param size - The maximum width of the container
 *   - 'sm': 640px
 *   - 'md': 768px
 *   - 'lg': 1024px
 *   - 'xl': 1280px
 *   - 'content': 72rem (1152px)
 *   - 'full': 100%
 * @param withGutters - Whether to add horizontal padding on small screens
 * @param centered - Whether to center the container horizontally
 * @param as - The HTML element to render the container as
 */
export default function Container({
  children,
  className,
  size = 'lg',
  as: Component = 'div',
  withGutters = true,
  centered = true,
}: ContainerProps) {
  const maxWidthClass = {
    sm: 'max-w-container-sm',
    md: 'max-w-container-md',
    lg: 'max-w-container-lg',
    xl: 'max-w-container-xl',
    content: 'max-w-content',
    full: 'max-w-full',
  }[size];

  const guttersClass = withGutters ? 'px-4 sm:px-6 lg:px-8' : '';
  const centeringClass = centered ? 'mx-auto' : '';

  return (
    <Component
      className={cn(
        maxWidthClass,
        guttersClass,
        centeringClass,
        'w-full',
        className
      )}
    >
      {children}
    </Component>
  );
}
