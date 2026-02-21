import Container from '@/components/layout/Container';
import ArticleCardSkeleton from '@/components/articles/ArticleCardSkeleton';

export default function ArticlesLoading() {
  return (
    <Container>
      <div className="py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Articles</h1>
          <p className="text-xl text-neutral-400 mb-8">
            Discover insights and guidance on navigating the AI-driven future of
            work.
          </p>

          {/* Loading Grid with Skeleton Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-8 auto-rows-fr">
            {Array.from({ length: 6 }).map((_, index) => (
              <ArticleCardSkeleton key={index} className="h-full" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
