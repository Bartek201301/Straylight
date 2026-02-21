import Container from '@/components/layout/Container';
import BaseSkeleton, {
  TextLineSkeleton,
} from '@/components/ui/skeletons/BaseSkeleton';

export default function MarketingLoading() {
  return (
    <Container>
      <div className="py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title skeleton */}
          <BaseSkeleton className="h-10 w-64" variant="pulse" rounded="lg" />

          {/* Subtitle skeleton */}
          <BaseSkeleton className="h-5 w-96" variant="pulse" rounded="md" />

          {/* Text block skeleton */}
          <TextLineSkeleton lines={3} variant="pulse" />

          {/* Content area skeleton */}
          <BaseSkeleton className="h-64 w-full" variant="pulse" rounded="lg" />
        </div>
      </div>
    </Container>
  );
}
