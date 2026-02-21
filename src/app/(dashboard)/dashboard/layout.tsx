import { Metadata } from 'next';
import { createProtectedPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createProtectedPageMetadata({
  title: 'Dashboard | StrayLight - Twój Hub Kariery AI',
  description:
    'Uzyskaj dostęp do swojego spersonalizowanego dashboard StrayLight z przewodnictwem kariery AI, śledzeniem postępu i zasobami rozwoju zawodowego.',
  path: '/dashboard',
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
