import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Forgot Password | StrayLight - Reset Your Password',
  description:
    'Reset your StrayLight account password. Enter your email address to receive password reset instructions.',
  path: '/auth/forgot-password',
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
