'use client';

import React from 'react';
import ArticlePageContent from './ArticlePageContent';
import type { Article } from '@/lib/supabase';
import type { ProcessedMarkdown } from '@/lib/content/markdown';

interface ClientWrapperProps {
  article: Article;
  processedContent: ProcessedMarkdown;
}

export default function ClientWrapper({
  article,
  processedContent,
}: ClientWrapperProps) {
  return (
    <ArticlePageContent article={article} processedContent={processedContent} />
  );
}
