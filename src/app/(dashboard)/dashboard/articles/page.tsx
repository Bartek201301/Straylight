'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Container from '@/components/layout/Container';
import {
  ArticleStatusBadge,
  ArticleStatus,
} from '@/components/articles/ArticleStatusBadge';
import {
  getArticleAccessControl,
  generateArticleRoute,
  getActionButtonText,
} from '@/lib/content/article-status';

interface UserArticle {
  id: string;
  title: string;
  slug: string;
  body_md: string;
  status: ArticleStatus;
  tags: string[];
  excerpt: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  cover_image_url?: string | null;
}

interface ArticleStats {
  total: number;
  drafts: number;
  pending: number;
  published: number;
  rejected: number;
  archived: number;
}

export default function ArticlesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [articles, setArticles] = useState<UserArticle[]>([]);
  const [stats, setStats] = useState<ArticleStats>({
    total: 0,
    drafts: 0,
    pending: 0,
    published: 0,
    rejected: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ArticleStatus | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>(
    'updated_at'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch user's articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/user/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const json = await response.json();
      const payload = json?.data || {};
      const userArticles = payload.articles || [];
      setArticles(userArticles);

      // Prefer stats provided by API, otherwise calculate locally
      const apiStats = payload.stats as ArticleStats | undefined;
      const newStats =
        apiStats ||
        userArticles.reduce(
          (acc: ArticleStats, article: UserArticle) => {
            acc.total++;
            acc[article.status as keyof Omit<ArticleStats, 'total'>]++;
            return acc;
          },
          {
            total: 0,
            drafts: 0,
            pending: 0,
            published: 0,
            rejected: 0,
            archived: 0,
          }
        );

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching articles:', error);
      showError('Nie udało się załadować artykułów. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  // Filter and sort articles
  const filteredArticles = articles
    .filter((article) => {
      const matchesStatus =
        selectedStatus === 'all' || article.status === selectedStatus;
      const matchesSearch =
        searchQuery === '' ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        // Date sorting
        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }
    });

  // Handle article actions using centralized routing logic
  const handleArticleAction = (
    article: UserArticle,
    action: 'edit' | 'view'
  ) => {
    const route = generateArticleRoute(
      article.status,
      article.id,
      article.slug,
      true
    );

    if (action === 'view' && article.status === 'published') {
      // Published articles open in new tab for better UX
      window.open(route, '_blank');
    } else {
      router.push(route);
    }
  };

  const handleWithdrawArticle = async (articleId: string) => {
    if (
      !confirm(
        'Czy na pewno chcesz wycofać ten artykuł? Zostanie przeniesiony z powrotem do szkiców.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}/withdraw`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw article');
      }

      showSuccess('Artykuł został pomyślnie wycofany');
      fetchArticles(); // Refresh the list
    } catch (error) {
      console.error('Error withdrawing article:', error);
      showError('Nie udało się wycofać artykułu. Spróbuj ponownie.');
    }
  };

  const handleDeleteDraft = async (articleId: string) => {
    if (
      !confirm(
        'Czy na pewno chcesz usunąć ten szkic? Tej czynności nie można cofnąć.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete draft');
      }

      showSuccess('Szkic został pomyślnie usunięty');
      fetchArticles(); // Refresh the list
    } catch (error) {
      console.error('Error deleting draft:', error);
      showError('Nie udało się usunąć szkicu. Spróbuj ponownie.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user, fetchArticles]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen pt-24 pb-8">
          <Container>
            <div className="py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-8"></div>
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="card-base h-24 rounded-lg"></div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="card-base h-32 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-24 pb-8">
        <Container>
          <div className="py-8">
            {/* Header */}
            <div className="card-base p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">
                    Moje Artykuły
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Zarządzaj artykułami, śledz zgłoszenia i monitoruj
                    wydajność.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={() => router.push('/write')}
                    className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-700 transition-colors inline-flex items-center gap-2"
                  >
                    Napisz Nowy Artykuł
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <div
                className={`card-base p-4 cursor-pointer transition-colors ${
                  selectedStatus === 'all'
                    ? 'ring-2 ring-neutral-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedStatus('all')}
              >
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.total}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Łącznie
                </div>
              </div>

              <div
                className={`card-base p-4 cursor-pointer transition-colors ${
                  selectedStatus === 'draft'
                    ? 'ring-2 ring-neutral-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedStatus('draft')}
              >
                <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">
                  {stats.drafts}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Szkice
                </div>
              </div>

              <div
                className={`card-base p-4 cursor-pointer transition-colors ${
                  selectedStatus === 'pending'
                    ? 'ring-2 ring-neutral-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedStatus('pending')}
              >
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  W Trakcie Przeglądu
                </div>
              </div>

              <div
                className={`card-base p-4 cursor-pointer transition-colors ${
                  selectedStatus === 'published'
                    ? 'ring-2 ring-neutral-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedStatus('published')}
              >
                <div className="text-2xl font-bold text-green-600">
                  {stats.published}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Opublikowane
                </div>
              </div>

              <div
                className={`card-base p-4 cursor-pointer transition-colors ${
                  selectedStatus === 'rejected'
                    ? 'ring-2 ring-neutral-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedStatus('rejected')}
              >
                <div className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Odrzucone
                </div>
              </div>

              <div
                className={`card-base p-4 cursor-pointer transition-colors ${
                  selectedStatus === 'archived'
                    ? 'ring-2 ring-neutral-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setSelectedStatus('archived')}
              >
                <div className="text-2xl font-bold text-blue-600">
                  {stats.archived}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Zarchiwizowane
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="card-base p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Szukaj artykułów po tytule, fragmencie lub tagach..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input w-full"
                  />
                </div>

                {/* Sort By */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="input"
                  >
                    <option value="updated_at">Ostatnio Zaktualizowane</option>
                    <option value="created_at">Data Utworzenia</option>
                    <option value="title">Tytuł</option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    }
                    className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors"
                    title={`Sortuj ${sortOrder === 'asc' ? 'Malejąco' : 'Rosnąco'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Articles List */}
            {filteredArticles.length === 0 ? (
              <div className="card-base p-8 text-center">
                <div className="text-neutral-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                  {searchQuery
                    ? 'Nie znaleziono artykułów'
                    : 'Jeszcze brak artykułów'}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {searchQuery
                    ? 'Spróbuj dostosować kryteria wyszukiwania lub filtry.'
                    : 'Zacznij od napisania pierwszego artykułu.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => router.push('/write')}
                    className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-700 transition-colors inline-flex items-center gap-2"
                  >
                    Napisz Swój Pierwszy Artykuł
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="card-base hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Cover Image Thumbnail */}
                        {article.cover_image_url && (
                          <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
                            <div className="relative w-full sm:w-24 h-32 sm:h-18 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              <img
                                src={article.cover_image_url}
                                alt={`Cover for ${article.title}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                            <div className="flex items-center space-x-3">
                              <ArticleStatusBadge
                                status={article.status}
                                size="sm"
                              />
                              <span className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                {formatDate(article.updated_at)}
                              </span>
                            </div>
                            {article.published_at && (
                              <span className="text-sm text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-0 sm:ml-0">
                                Published {formatDate(article.published_at)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2 truncate">
                            {article.title}
                          </h3>

                          {article.excerpt && (
                            <p className="text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                            <span>
                              {calculateReadingTime(article.body_md)} min
                              czytania
                            </span>
                            {article.status === 'published' && (
                              <span>{article.view_count} wyświetleń</span>
                            )}
                            {article.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <span>Tagi:</span>
                                {article.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {article.tags.length > 3 && (
                                  <span className="text-neutral-400">
                                    +{article.tags.length - 3} więcej
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-0 sm:ml-4 flex-shrink-0">
                          {(() => {
                            const accessControl = getArticleAccessControl(
                              article.status,
                              true
                            );
                            const { primaryAction, secondaryActions } =
                              accessControl.permissions;
                            const buttons = [];

                            // Primary action button
                            if (primaryAction) {
                              buttons.push(
                                <button
                                  key={primaryAction}
                                  onClick={() =>
                                    handleArticleAction(
                                      article,
                                      primaryAction as 'edit' | 'view'
                                    )
                                  }
                                  className="inline-flex items-center px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                  {getActionButtonText(primaryAction)}
                                </button>
                              );
                            }

                            // Secondary action buttons
                            secondaryActions.forEach((action) => {
                              if (action === 'edit') {
                                buttons.push(
                                  <button
                                    key={action}
                                    onClick={() =>
                                      handleArticleAction(article, action)
                                    }
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  >
                                    {getActionButtonText(action)}
                                  </button>
                                );
                              } else if (action === 'delete') {
                                buttons.push(
                                  <button
                                    key={action}
                                    onClick={() =>
                                      handleDeleteDraft(article.id)
                                    }
                                    className="inline-flex items-center px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                  >
                                    {getActionButtonText(action)}
                                  </button>
                                );
                              } else if (action === 'withdraw') {
                                buttons.push(
                                  <button
                                    key={action}
                                    onClick={() =>
                                      handleWithdrawArticle(article.id)
                                    }
                                    className="inline-flex items-center px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 text-sm font-medium rounded-md text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                  >
                                    {getActionButtonText(action)}
                                  </button>
                                );
                              }
                            });

                            return buttons;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </div>
    </ProtectedRoute>
  );
}
