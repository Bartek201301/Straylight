'use client';

import React from 'react';
import {
  Linkedin,
  Github,
  Instagram,
  Youtube,
  MessageCircle,
} from 'lucide-react';
import XIcon from '@/components/ui/icons/XIcon';
import type { PublicProfile, Article } from '@/lib/supabase';
import ArticleCard from '@/components/articles/ArticleCard';

interface ProfilePageContentProps {
  profile: PublicProfile;
  articles: Article[];
}

// Social media icon mapping
const socialIcons = {
  twitter: XIcon,
  linkedin: Linkedin,
  github: Github,
  instagram: Instagram,
  youtube: Youtube,
  discord: MessageCircle,
};

export default function ProfilePageContent({
  profile,
  articles,
}: ProfilePageContentProps) {
  const displayName = profile.display_name || profile.handle;
  const memberSince = new Date(profile.created_at).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
  });

  const socialLinks = profile.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((link) => link);

  return (
    <div className="min-h-screen pt-24 pb-8 bg-black dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${displayName}'s profile picture`}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center border-4 border-neutral-500 shadow-lg">
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {displayName}
                  </h1>
                  <p className="text-neutral-400 dark:text-neutral-400 text-lg mb-3">
                    @{profile.handle}
                  </p>

                  {profile.bio && (
                    <p className="text-neutral-300 dark:text-neutral-300 leading-relaxed mb-4 max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Location and Website */}
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-400 dark:text-neutral-400 mb-4">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{profile.location}</span>
                      </div>
                    )}

                    {profile.website && (
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        <a
                          href={
                            profile.website.startsWith('http')
                              ? profile.website
                              : `https://${profile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-200 dark:text-neutral-200 hover:text-white dark:hover:text-white hover:underline transition-colors"
                        >
                          {profile.website
                            .replace(/^https?:\/\//, '')
                            .replace(/\/$/, '')}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Członek od {memberSince}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  {hasSocialLinks && (
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(socialLinks)
                        .filter(([_, url]) => url)
                        .map(([platform, url]) => {
                          const IconComponent =
                            socialIcons[platform as keyof typeof socialIcons] ||
                            MessageCircle;

                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1 bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 rounded-full text-sm text-white dark:text-white transition-colors backdrop-blur-sm border border-white/20 dark:border-white/20"
                              title={`${displayName} on ${platform === 'twitter' ? 'X' : platform}`}
                            >
                              <IconComponent size={16} />
                              <span className="capitalize">
                                {platform === 'twitter' ? 'X' : platform}
                              </span>
                            </a>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Role Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      profile.role === 'admin'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : profile.role === 'moderator'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}
                  >
                    {profile.role.charAt(0).toUpperCase() +
                      profile.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-6 h-6 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="text-2xl font-bold text-white">
                {profile.article_count || 0}
              </div>
              <div className="text-sm text-white/60 dark:text-white/60">
                Artykuły
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-6 h-6 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <div className="text-2xl font-bold text-white">
                {(profile.total_views || 0).toLocaleString()}
              </div>
              <div className="text-sm text-white/60 dark:text-white/60">
                Wyświetlenia
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-6 h-6 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <div className="text-2xl font-bold text-white">
                {profile.total_likes || 0}
              </div>
              <div className="text-sm text-white/60 dark:text-white/60">
                Otrzymane polubienia
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {profile.badges && profile.badges.length > 0 && (
          <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              Odznaki
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-sm text-yellow-300"
                >
                  {badge.name || badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Articles Section */}
        <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Opublikowane artykuły
              {articles.length > 0 && (
                <span className="text-white/60 text-lg">
                  ({articles.length})
                </span>
              )}
            </h3>
          </div>

          {articles.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 px-4 overflow-visible">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={{
                    ...article,
                    excerpt: article.excerpt || '',
                  }}
                  variant="profile"
                  className="justify-self-center"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h4 className="text-xl font-semibold text-white dark:text-white mb-2">
                Brak artykułów
              </h4>
              <p className="text-white/60 dark:text-white/60">
                {displayName} nie opublikował jeszcze żadnych artykułów. Wróć
                później!
              </p>
            </div>
          )}
        </div>

        {/* Back to Top */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 rounded-lg text-white dark:text-white transition-colors backdrop-blur-sm border border-white/20 dark:border-white/20 hover:scale-[1.05]"
          >
            ↑ Wróć na górę
          </button>
        </div>
      </div>
    </div>
  );
}
