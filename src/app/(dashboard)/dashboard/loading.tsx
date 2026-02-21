import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen pt-24 pb-8 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0 space-y-2">
              <BaseSkeleton variant="pulse" className="h-8 w-48" size="xl" />
              <BaseSkeleton variant="pulse" className="h-5 w-64" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl mb-8">
          <div className="hidden sm:block border-b border-white/10">
            <div className="flex overflow-x-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <BaseSkeleton
                  key={i}
                  variant="pulse"
                  className="h-10 w-24 mx-3 my-3"
                  rounded="md"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content Area - Overview skeleton */}
        <div className="min-h-[500px] space-y-6">
          {/* Stats cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-base p-5 animate-pulse">
                <BaseSkeleton variant="pulse" className="h-4 w-24 mb-3" />
                <BaseSkeleton variant="pulse" className="h-8 w-16" size="xl" />
              </div>
            ))}
          </div>

          {/* Main content panel */}
          <div className="card-base p-6 animate-pulse">
            <BaseSkeleton variant="pulse" className="h-6 w-48 mb-4" size="lg" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <BaseSkeleton key={i} variant="pulse" className="h-4 w-full" />
              ))}
              <BaseSkeleton variant="pulse" className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
