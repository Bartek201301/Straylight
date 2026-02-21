'use client';

import ArticleCard from './ArticleCard';

interface ClientArticleCardProps {
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body_md: string;
    status: string;
    tags: string[];
    view_count: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    author_id: string;
    cover_image_url?: string | null;
    users?: {
      handle: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  };
  className?: string;
  variant?: 'default' | 'compact' | 'profile';
}

export default function ClientArticleCard({
  article,
  className,
  variant = 'default',
}: ClientArticleCardProps) {
  return (
    <ArticleCard article={article} className={className} variant={variant} />
  );
}
