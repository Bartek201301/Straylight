import BaseSkeleton, {
  TextLineSkeleton,
  CircleSkeleton,
} from '@/components/ui/skeletons/BaseSkeleton';
import Container from '@/components/layout/Container';

export default function ArticleDetailLoading() {
  return (
    <Container size="lg">
      <div className="py-12 max-w-4xl mx-auto">
        {/* Title */}
        <BaseSkeleton variant="pulse" className="h-12 w-3/4 mb-4" size="xl" />

        {/* Author row */}
        <div className="flex items-center space-x-3 mb-8">
          <CircleSkeleton size="md" variant="pulse" />
          <div className="space-y-1">
            <BaseSkeleton variant="pulse" className="h-4 w-28" />
            <BaseSkeleton variant="pulse" className="h-3 w-20" />
          </div>
        </div>

        {/* Content body - first paragraph block */}
        <TextLineSkeleton lines={4} variant="pulse" className="mb-6" />

        {/* Image placeholder */}
        <BaseSkeleton
          variant="pulse"
          className="h-48 w-full mb-6"
          rounded="lg"
        />

        {/* Content body - second paragraph block */}
        <TextLineSkeleton lines={6} variant="pulse" className="mb-6" />

        {/* Additional content */}
        <TextLineSkeleton lines={3} variant="pulse" />
      </div>
    </Container>
  );
}
