import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Logo/title skeleton */}
        <div className="flex justify-center">
          <BaseSkeleton className="h-10 w-40" variant="pulse" rounded="lg" />
        </div>

        {/* Form card skeleton */}
        <div className="card-base p-6 space-y-4">
          {/* Input field skeletons */}
          <BaseSkeleton className="h-10 w-full" variant="pulse" rounded="md" />
          <BaseSkeleton className="h-10 w-full" variant="pulse" rounded="md" />

          {/* Button skeleton */}
          <BaseSkeleton className="h-12 w-full" variant="pulse" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
