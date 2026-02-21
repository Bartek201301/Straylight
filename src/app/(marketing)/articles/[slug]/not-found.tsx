import Link from 'next/link';
import Container from '@/components/layout/Container';

export default function ArticleNotFound() {
  return (
    <Container>
      <div className="py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-base p-12">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <p className="text-xl text-neutral-400 mb-8">
              The article you&apos;re looking for doesn&apos;t exist or may have
              been moved.
            </p>

            <div className="space-y-4">
              <Link
                href="/articles"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Browse All Articles
              </Link>

              <div className="text-sm text-neutral-500">
                <p>
                  Looking for something specific? You can also{' '}
                  <Link href="/" className="text-blue-400 hover:text-blue-300">
                    return to the homepage
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
