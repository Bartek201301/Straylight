import BaseSkeleton, {
  TextLineSkeleton,
  CircleSkeleton,
} from '@/components/ui/skeletons/BaseSkeleton';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen pt-24 pb-8 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <CircleSkeleton
                size="xl"
                variant="pulse"
                className="w-24 h-24 sm:w-32 sm:h-32"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Display name */}
              <BaseSkeleton variant="pulse" className="h-8 w-48" size="xl" />
              {/* Handle */}
              <BaseSkeleton variant="pulse" className="h-5 w-32" />
              {/* Bio */}
              <TextLineSkeleton
                lines={2}
                variant="pulse"
                className="max-w-2xl"
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 text-center"
            >
              <BaseSkeleton
                variant="pulse"
                className="h-8 w-12 mx-auto mb-2"
                size="xl"
              />
              <BaseSkeleton variant="pulse" className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>

        {/* Articles Section */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
          <BaseSkeleton variant="pulse" className="h-7 w-40 mb-6" size="lg" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-base p-4 animate-pulse">
                <BaseSkeleton variant="pulse" className="h-5 w-3/4 mb-2" />
                <BaseSkeleton variant="pulse" className="h-4 w-full mb-1" />
                <BaseSkeleton variant="pulse" className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
