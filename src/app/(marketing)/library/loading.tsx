import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-black">
      <main className="relative z-10 pt-4">
        {/* Title Section */}
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              {/* Title skeleton */}
              <BaseSkeleton
                variant="pulse"
                className="h-16 sm:h-20 md:h-24 w-3/4 mx-auto mb-6 sm:mb-8"
                size="xl"
                rounded="lg"
              />
              {/* Subtitle skeleton */}
              <BaseSkeleton
                variant="pulse"
                className="h-6 w-2/3 mx-auto mb-2"
              />
              <BaseSkeleton variant="pulse" className="h-6 w-1/2 mx-auto" />
            </div>
          </div>
        </section>

        {/* Filter/Tag bar */}
        <section className="px-6 py-0 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <BaseSkeleton
                  key={i}
                  variant="pulse"
                  className="h-8 w-20"
                  rounded="full"
                />
              ))}
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card-base p-4 animate-pulse">
                  {/* Image placeholder */}
                  <BaseSkeleton
                    variant="pulse"
                    className="h-40 w-full mb-4"
                    rounded="lg"
                  />
                  {/* Title */}
                  <BaseSkeleton variant="pulse" className="h-5 w-3/4 mb-2" />
                  {/* Description lines */}
                  <BaseSkeleton variant="pulse" className="h-4 w-full mb-1" />
                  <BaseSkeleton variant="pulse" className="h-4 w-2/3 mb-3" />
                  {/* Tag pill */}
                  <BaseSkeleton
                    variant="pulse"
                    className="h-6 w-16"
                    rounded="full"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
