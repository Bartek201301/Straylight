import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function WriteLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="hidden md:block">
        <div className="pt-4 pb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              {/* Sidebar space */}
              <div className="w-64 flex-shrink-0 hidden lg:block" />

              {/* Main content */}
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                {/* Back link skeleton */}
                <div className="mt-[8.5rem] mb-6">
                  <BaseSkeleton variant="pulse" className="h-4 w-40" />
                </div>

                {/* Title input skeleton */}
                <div className="mb-6">
                  <BaseSkeleton
                    variant="pulse"
                    className="h-14 w-full"
                    size="xl"
                    rounded="lg"
                  />
                  <BaseSkeleton variant="pulse" className="h-3 w-32 mt-2" />
                </div>

                {/* Excerpt textarea skeleton */}
                <div className="mb-8">
                  <BaseSkeleton
                    variant="pulse"
                    className="h-20 w-full"
                    rounded="lg"
                  />
                  <BaseSkeleton variant="pulse" className="h-3 w-32 mt-2" />
                </div>

                {/* Metadata bar */}
                <div className="flex items-center gap-4 mb-4">
                  <BaseSkeleton variant="pulse" className="h-4 w-32" />
                  <BaseSkeleton variant="pulse" className="h-4 w-4" />
                  <BaseSkeleton variant="pulse" className="h-4 w-24" />
                </div>

                {/* Separator */}
                <div className="h-px mb-12 bg-white/10" />

                {/* Editor content area */}
                <BaseSkeleton
                  variant="pulse"
                  className="h-96 w-full"
                  rounded="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile placeholder */}
      <div className="block md:hidden min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <BaseSkeleton
            variant="pulse"
            className="h-16 w-16 mx-auto mb-4"
            rounded="full"
          />
          <BaseSkeleton variant="pulse" className="h-6 w-48 mx-auto mb-2" />
          <BaseSkeleton variant="pulse" className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}
