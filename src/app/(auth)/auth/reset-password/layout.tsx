import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Reset Password | StrayLight - Set New Password',
  description:
    'Set a new password for your StrayLight account. Enter your new password to complete the reset process.',
  path: '/auth/reset-password',
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
