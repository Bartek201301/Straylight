import Container from '@/components/layout/Container';
import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function AdminLoading() {
  return (
    <Container>
      <div className="py-8 space-y-6">
        {/* Admin header skeleton */}
        <div className="flex items-center justify-between">
          <BaseSkeleton className="h-8 w-48" variant="pulse" rounded="lg" />
          <BaseSkeleton className="h-10 w-32" variant="pulse" rounded="lg" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base p-6 space-y-3">
              <BaseSkeleton className="h-4 w-24" variant="pulse" rounded="md" />
              <BaseSkeleton className="h-8 w-16" variant="pulse" rounded="md" />
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div className="card-base p-6 space-y-4">
          {/* Table header */}
          <div className="flex items-center justify-between">
            <BaseSkeleton className="h-6 w-40" variant="pulse" rounded="md" />
            <BaseSkeleton className="h-8 w-48" variant="pulse" rounded="md" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-t border-white/5"
            >
              <div className="flex items-center space-x-4 flex-1">
                <BaseSkeleton
                  className="h-10 w-10"
                  variant="pulse"
                  rounded="full"
                />
                <div className="space-y-2 flex-1">
                  <BaseSkeleton
                    className="h-4 w-48"
                    variant="pulse"
                    rounded="md"
                  />
                  <BaseSkeleton
                    className="h-3 w-32"
                    variant="pulse"
                    rounded="md"
                  />
                </div>
              </div>
              <BaseSkeleton className="h-8 w-20" variant="pulse" rounded="md" />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
