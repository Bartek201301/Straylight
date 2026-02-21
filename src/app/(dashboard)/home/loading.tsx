import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';
import ArticleCardSkeleton from '@/components/articles/ArticleCardSkeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome / Greeting */}
        <div className="mb-8">
          <BaseSkeleton variant="pulse" className="h-8 w-64 mb-2" size="xl" />
          <BaseSkeleton variant="pulse" className="h-5 w-96 max-w-full" />
        </div>

        {/* Featured Section Title */}
        <BaseSkeleton variant="pulse" className="h-7 w-48 mb-6" size="lg" />

        {/* Featured Articles Carousel placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <ArticleCardSkeleton key={i} className="h-full" />
          ))}
        </div>

        {/* Tools Section Title */}
        <BaseSkeleton variant="pulse" className="h-7 w-40 mb-6" size="lg" />

        {/* Featured Tools placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-base p-4 animate-pulse">
              <BaseSkeleton
                variant="pulse"
                className="h-32 w-full mb-3"
                rounded="lg"
              />
              <BaseSkeleton variant="pulse" className="h-5 w-3/4 mb-2" />
              <BaseSkeleton variant="pulse" className="h-4 w-full mb-1" />
              <BaseSkeleton variant="pulse" className="h-4 w-2/3" />
            </div>
          ))}
        </div>

        {/* Latest Articles Title */}
        <BaseSkeleton variant="pulse" className="h-7 w-52 mb-6" size="lg" />

        {/* Latest Articles Feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ArticleCardSkeleton key={i} className="h-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
