import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Sign In | StrayLight - Access Your AI Career Guidance Dashboard',
  description:
    'Sign in to your StrayLight account to access personalized AI career guidance, articles, and professional development resources.',
  path: '/auth/signin',
});

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
