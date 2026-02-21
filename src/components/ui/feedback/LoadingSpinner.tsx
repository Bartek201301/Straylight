import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-neutral-600 border-t-blue-400',
            sizeClasses[size]
          )}
          role="status"
          aria-label={label}
        />
        <span className="text-sm text-neutral-400 sr-only">{label}</span>
      </div>
    </div>
  );
}
