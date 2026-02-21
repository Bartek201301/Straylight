'use client';

import { useAuth, useUserProfile } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import type { PublicProfile, Article } from '@/lib/supabase';
import ProfilePageContent from '@/app/(marketing)/profile/[handle]/_components/ProfilePageContent';
import Link from 'next/link';

export default function DashboardProfile() {
  const { user } = useAuth();
  const profileInfo = useUserProfile();
  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileInfo.handle) {
        setError('Najpierw ustaw nazwę użytkownika, aby wyświetlić profil.');
        setLoading(false);
        return;
      }

      try {
        // Fetch profile data using the same API as public profiles
        const response = await fetch(`/api/profile/${profileInfo.handle}`);

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data.profile);
        setArticles(data.articles || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Nie udało się załadować danych profilu');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [profileInfo.handle, user?.id]);

  if (loading) {
    return (
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-white/10 rounded w-48"></div>
              <div className="h-4 bg-white/10 rounded w-32"></div>
              <div className="h-4 bg-white/10 rounded w-64"></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-yellow-500 rounded opacity-80"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {error || 'Profil Niedostępny'}
          </h3>
          <p className="text-white/80 mb-6">
            {error ===
            'Najpierw ustaw nazwę użytkownika, aby wyświetlić profil.'
              ? 'Uzupełnij profil, aby zobaczyć jak wygląda dla innych.'
              : 'Wystąpił problem z ładowaniem danych profilu. Spróbuj odświeżyć stronę.'}
          </p>
          {error ===
            'Najpierw ustaw nazwę użytkownika, aby wyświetlić profil.' && (
            <div className="space-x-4">
              <button
                onClick={() => {
                  // This would switch to settings tab - we'll need to pass a callback
                  const event = new CustomEvent('switchToSettings');
                  window.dispatchEvent(event);
                }}
                className="px-4 py-2 bg-ai-teal-500/20 text-white rounded-md hover:bg-ai-teal-500/30 transition-colors backdrop-blur-sm border border-ai-teal-500/30"
              >
                Uzupełnij Profil
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Preview Header */}
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Podgląd Twojego Profilu Publicznego
              </h3>
              <p className="text-white/80 text-sm">
                Tak widzą Twój profil inni użytkownicy
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {profileInfo.handle && (
              <Link
                href={`/profile/${profileInfo.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20 justify-center sm:justify-start"
              >
                Zobacz Stronę Publiczną
              </Link>
            )}
            <button
              onClick={() => {
                const event = new CustomEvent('switchToSettings');
                window.dispatchEvent(event);
              }}
              className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20 justify-center sm:justify-start"
            >
              Edytuj Profil
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content - Using the same component as public profiles */}
      <div className="bg-transparent">
        <ProfilePageContent profile={profileData} articles={articles} />
      </div>

      {/* Profile Tips */}
      <div className="backdrop-blur-sm bg-white/5 border border-info-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Wskazówki Profilu
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <strong className="text-white">Uzupełnij bio:</strong>
              <span className="text-white/80 ml-1">
                Dobre bio pomaga innym zrozumieć twoją wiedzę i zainteresowania.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <strong className="text-white">
                Dodaj linki społecznościowe:
              </strong>
              <span className="text-white/80 ml-1">
                Połącz media społecznościowe, aby budować sieć zawodową.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <strong className="text-white">Pisz wartościowe artykuły:</strong>
              <span className="text-white/80 ml-1">
                Regularne, wysokiej jakości treści zwiększają widoczność
                profilu.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <strong className="text-white">Wgraj zdjęcie profilowe:</strong>
              <span className="text-white/80 ml-1">
                Profesjonalne zdjęcie sprawia, że profil jest bardziej
                wiarygodny i zapadający w pamięć.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
