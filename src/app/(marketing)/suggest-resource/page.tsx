import type { Metadata } from 'next';
import SuggestResourceContent from './_components/SuggestResourceContent';

export const metadata: Metadata = {
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
};

export default function SuggestResourcePage() {
  return <SuggestResourceContent />;
}
