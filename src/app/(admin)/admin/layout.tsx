import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Admin Panel | StrayLight - Administrative Dashboard',
  description:
    'StrayLight administrative dashboard for system management, user administration, and platform configuration.',
  path: '/admin',
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
