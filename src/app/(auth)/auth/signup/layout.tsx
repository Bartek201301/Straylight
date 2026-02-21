import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Sign Up | StrayLight - Join AI Career Guidance Community',
  description:
    'Create your StrayLight account to access personalized AI career guidance, expert insights, and professional development resources.',
  path: '/auth/signup',
});

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
