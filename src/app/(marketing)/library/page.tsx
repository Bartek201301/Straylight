import type { Metadata } from 'next';
import LibraryPageContent from './_components/LibraryPageContent';

export const metadata: Metadata = {
  title: 'Library - Curated Books & AI Tools | StrayLight',
  description:
    'Discover our carefully curated collection of books and AI tools to accelerate your career development. Find the best resources for learning, productivity, and professional growth.',
  keywords: [
    'AI tools',
    'career development books',
    'productivity tools',
    'machine learning resources',
    'professional development',
    'programming books',
    'AI learning resources',
  ],
  twitter: {
    card: 'summary_large_image',
    title: 'Library - Curated Books & AI Tools',
    description:
      'Discover our carefully curated collection of books and AI tools to accelerate your career development.',
    images: ['/og-library.jpg'],
  },
};

export default function LibraryPage() {
  return <LibraryPageContent />;
}
