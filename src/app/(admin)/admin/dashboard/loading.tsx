import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="space-y-2">
              <BaseSkeleton
                variant="pulse"
                className="h-8 w-56 bg-gray-200"
                size="xl"
              />
              <BaseSkeleton variant="pulse" className="h-4 w-72 bg-gray-200" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right space-y-1">
                <BaseSkeleton
                  variant="pulse"
                  className="h-4 w-40 bg-gray-200"
                />
                <BaseSkeleton
                  variant="pulse"
                  className="h-3 w-24 bg-gray-200"
                />
              </div>
              <BaseSkeleton
                variant="pulse"
                className="h-10 w-36 bg-gray-200"
                rounded="md"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow rounded-lg p-6 animate-pulse"
            >
              <BaseSkeleton
                variant="pulse"
                className="h-4 w-28 bg-gray-200 mb-3"
              />
              <BaseSkeleton
                variant="pulse"
                className="h-10 w-20 bg-gray-200 mb-2"
                size="xl"
              />
              <BaseSkeleton variant="pulse" className="h-3 w-16 bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center mb-4">
                <BaseSkeleton
                  variant="pulse"
                  className="h-12 w-12 bg-gray-200"
                  rounded="lg"
                />
                <div className="ml-4 space-y-2">
                  <BaseSkeleton
                    variant="pulse"
                    className="h-5 w-36 bg-gray-200"
                  />
                  <BaseSkeleton
                    variant="pulse"
                    className="h-3 w-48 bg-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <BaseSkeleton
                  variant="pulse"
                  className="h-14 w-full bg-gray-100"
                  rounded="lg"
                />
                <BaseSkeleton
                  variant="pulse"
                  className="h-14 w-full bg-gray-100"
                  rounded="lg"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
