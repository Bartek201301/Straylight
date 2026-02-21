'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from '@/components/layout/Container';
import PreviewContent from './_components/PreviewContent';

interface PreviewData {
  title: string;
  content: string;
  excerpt?: string;
  tags: string[];
  coverImageUrl?: string;
  metadata?: any;
}

export default function PreviewPage() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get preview data from sessionStorage
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Add small delay to ensure sessionStorage is available
    const loadPreviewData = () => {
      try {
        const storedData = sessionStorage.getItem('article-preview-data');
        // console.log('Stored data:', storedData); // Debug log

        if (storedData) {
          const data = JSON.parse(storedData);
          // console.log('Parsed data:', data); // Debug log
          setPreviewData(data);
        } else {
          // console.log('No stored data found, redirecting to /write'); // Debug log
          // If no data, redirect back to write page
          setTimeout(() => router.push('/write'), 100);
          return;
        }
      } catch (error) {
        console.error('Error loading preview data:', error);
        setTimeout(() => router.push('/write'), 100);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure we're fully hydrated
    const timer = setTimeout(loadPreviewData, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <Container size="full" withGutters={false}>
        <div className="pt-4 pb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              <div className="w-64 flex-shrink-0 hidden lg:block" />
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                <div className="mt-[8.5rem] flex items-center justify-center min-h-96">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <span className="text-white/70">Loading preview...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!previewData) {
    return (
      <Container size="full" withGutters={false}>
        <div className="pt-4 pb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-8">
              <div className="w-64 flex-shrink-0 hidden lg:block" />
              <div className="flex-1 min-w-0 lg:max-w-4xl">
                <div className="mt-[8.5rem] text-center">
                  <h1 className="text-4xl font-bold text-white mb-4">
                    No preview data available
                  </h1>
                  <p className="text-white/70 mb-8">
                    Please return to the editor to preview your article.
                  </p>
                  <button
                    onClick={() => router.push('/write')}
                    className="btn-premium btn-premium-primary"
                  >
                    Back to Editor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return <PreviewContent previewData={previewData} />;
}
