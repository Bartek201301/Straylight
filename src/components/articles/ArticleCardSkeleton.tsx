import { cn } from '@/lib/utils';

interface ArticleCardSkeletonProps {
  className?: string;
}

export default function ArticleCardSkeleton({
  className,
}: ArticleCardSkeletonProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <div className="card-base p-4 sm:p-5 md:p-6 h-full flex flex-col animate-pulse">
        {/* Header Skeleton */}
        <header className="mb-3 sm:mb-4">
          {/* Title Skeleton */}
          <div className="mb-2">
            <div className="h-5 sm:h-6 bg-neutral-700 rounded-md mb-2 w-full"></div>
            <div className="h-5 sm:h-6 bg-neutral-700 rounded-md w-3/4"></div>
          </div>

          {/* Meta Skeleton */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="h-4 bg-neutral-700 rounded w-24 flex-shrink-0"></div>
            <div className="h-6 bg-neutral-700 rounded-full w-16 flex-shrink-0"></div>
          </div>
        </header>

        {/* Content Skeleton */}
        <div className="mb-4 flex-grow">
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-neutral-700 rounded w-2/3"></div>
          </div>
        </div>

        {/* Tags Skeleton */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <div className="h-6 bg-neutral-700 rounded-full w-12"></div>
            <div className="h-6 bg-neutral-700 rounded-full w-16"></div>
            <div className="h-6 bg-neutral-700 rounded-full w-20"></div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <footer className="mt-auto pt-3 sm:pt-4 border-t border-neutral-800">
          <div className="flex items-center">
            <div className="h-4 bg-neutral-700 rounded w-20"></div>
            <div className="ml-2 w-3 h-3 sm:w-4 sm:h-4 bg-neutral-700 rounded"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}
