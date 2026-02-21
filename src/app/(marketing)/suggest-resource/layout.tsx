import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createMetadata({
  title:
    'Suggest a Resource - Help Build the Ultimate AI Career Library | StrayLight',
  description:
    'Share valuable AI career resources with our community. Suggest books, tools, courses, and other resources to help fellow professionals discover great content.',
  keywords: [
    'suggest resource',
    'community contribution',
    'AI resources',
    'career development tools',
    'recommend book',
    'AI tools',
    'learning resources',
    'professional development',
  ],
  path: '/suggest-resource',
});

export default function SuggestResourceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
