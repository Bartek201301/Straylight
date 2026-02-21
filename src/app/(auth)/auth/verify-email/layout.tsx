import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Verify Email | StrayLight - Complete Your Account Setup',
  description:
    'Verify your email address to complete your StrayLight account setup and access AI career guidance resources.',
  path: '/auth/verify-email',
});

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
