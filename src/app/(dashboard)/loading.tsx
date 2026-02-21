import Container from '@/components/layout/Container';
import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function DashboardLoading() {
  return (
    <Container>
      <div className="py-8 space-y-6">
        {/* Page title skeleton */}
        <BaseSkeleton className="h-8 w-48" variant="pulse" rounded="lg" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - 2 cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-base p-6 space-y-4">
              <BaseSkeleton className="h-6 w-40" variant="pulse" rounded="md" />
              <BaseSkeleton
                className="h-4 w-full"
                variant="pulse"
                rounded="md"
              />
              <BaseSkeleton
                className="h-4 w-3/4"
                variant="pulse"
                rounded="md"
              />
              <BaseSkeleton
                className="h-32 w-full"
                variant="pulse"
                rounded="lg"
              />
            </div>

            <div className="card-base p-6 space-y-4">
              <BaseSkeleton className="h-6 w-36" variant="pulse" rounded="md" />
              <BaseSkeleton
                className="h-4 w-full"
                variant="pulse"
                rounded="md"
              />
              <BaseSkeleton
                className="h-4 w-5/6"
                variant="pulse"
                rounded="md"
              />
            </div>
          </div>

          {/* Right column - 1 tall card */}
          <div className="lg:col-span-1">
            <div className="card-base p-6 space-y-4">
              <BaseSkeleton className="h-6 w-32" variant="pulse" rounded="md" />
              <BaseSkeleton
                className="h-4 w-full"
                variant="pulse"
                rounded="md"
              />
              <BaseSkeleton
                className="h-4 w-2/3"
                variant="pulse"
                rounded="md"
              />
              <BaseSkeleton
                className="h-48 w-full"
                variant="pulse"
                rounded="lg"
              />
              <BaseSkeleton
                className="h-4 w-full"
                variant="pulse"
                rounded="md"
              />
              <BaseSkeleton
                className="h-4 w-1/2"
                variant="pulse"
                rounded="md"
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
