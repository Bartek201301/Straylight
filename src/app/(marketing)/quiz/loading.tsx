import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function QuizLoading() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          {/* Title */}
          <BaseSkeleton
            variant="pulse"
            className="h-14 md:h-20 w-64 mx-auto"
            size="xl"
            rounded="lg"
          />
          {/* Subtitle */}
          <BaseSkeleton
            variant="pulse"
            className="h-6 md:h-8 w-96 max-w-full mx-auto"
          />
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg md:rounded-2xl p-3 md:p-6 text-center"
            >
              <BaseSkeleton
                variant="pulse"
                className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-1 md:mb-3"
                rounded="full"
              />
              <BaseSkeleton
                variant="pulse"
                className="h-5 w-20 mx-auto mb-1 md:mb-2"
              />
              <BaseSkeleton variant="pulse" className="h-4 w-32 mx-auto" />
            </div>
          ))}
        </div>

        {/* CTA Button placeholder */}
        <div className="text-center space-y-4 mb-16">
          <BaseSkeleton
            variant="pulse"
            className="h-14 w-48 mx-auto"
            rounded="full"
          />
          <BaseSkeleton variant="pulse" className="h-4 w-64 mx-auto" />
        </div>

        {/* How it works section */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8">
          <BaseSkeleton
            variant="pulse"
            className="h-8 w-48 mx-auto mb-6"
            size="xl"
          />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <BaseSkeleton
                  variant="pulse"
                  className="w-8 h-8 flex-shrink-0"
                  rounded="full"
                />
                <div className="flex-1">
                  <BaseSkeleton variant="pulse" className="h-5 w-48 mb-1" />
                  <BaseSkeleton
                    variant="pulse"
                    className="h-4 w-72 max-w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
