'use client';

import { useAuth, useUserProfile } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user: _user } = useAuth();
  const profileData = useUserProfile();

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Write Article */}
        <Link
          href="/write"
          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 cursor-pointer group hover:scale-[1.05] hover:shadow-xl"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center transition-colors">
                <svg
                  className="w-6 h-6 text-white opacity-80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white transition-colors">
                Napisz Artykuł
              </h3>
              <p className="text-white/80 text-sm transition-colors">
                Twórz i publikuj nowe treści
              </p>
            </div>
          </div>
        </Link>

        {/* View Public Profile - ALWAYS RENDER WITH FALLBACK */}
        {(() => {
          const profileHandle = profileData.handle || 'temp-profile';
          const isDisabled = !profileData.handle;

          return (
            <div
              className={`backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 cursor-pointer group hover:scale-[1.05] hover:shadow-xl ${isDisabled ? 'opacity-50' : ''}`}
              onClick={() => {
                if (isDisabled) {
                  alert(
                    'Nazwa profilu jeszcze się nie załadowała. Odśwież stronę lub uzupełnij profil.'
                  );
                } else {
                  window.open(`/profile/${profileHandle}`, '_blank');
                }
              }}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center transition-colors">
                    <svg
                      className="w-6 h-6 text-white opacity-80"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 0V3"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white transition-colors">
                    Zobacz Profil Publiczny {isDisabled && '(Ładowanie...)'}
                  </h3>
                  <p className="text-white/80 text-sm transition-colors">
                    {isDisabled
                      ? 'Nazwa profilu jeszcze się nie załadowała'
                      : 'Zobacz jak inni widzą twój profil'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Browse Library */}
        <Link
          href="/library"
          className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 cursor-pointer group hover:scale-[1.05] hover:shadow-xl"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center transition-colors">
                <svg
                  className="w-6 h-6 text-white opacity-80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white transition-colors">
                Przeglądaj Bibliotekę
              </h3>
              <p className="text-white/80 text-sm transition-colors">
                Odkrywaj książki, narzędzia i zasoby
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Profile Completion */}
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Uzupełnienie Profilu
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80">Ogólny Postęp</span>
            <span className="text-sm font-medium text-white">
              {(() => {
                let completedFields = 0;
                const totalFields = 6;

                if (profileData.handle) completedFields++;
                if (profileData.profile?.display_name) completedFields++;
                if (profileData.profile?.bio) completedFields++;
                if (profileData.profile?.location) completedFields++;
                if (profileData.profile?.website) completedFields++;
                if (
                  profileData.profile?.social_links &&
                  Object.values(profileData.profile.social_links).some(
                    (link) => link
                  )
                )
                  completedFields++;

                return Math.round((completedFields / totalFields) * 100);
              })()}
              %
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(() => {
                  let completedFields = 0;
                  const totalFields = 6;

                  if (profileData.handle) completedFields++;
                  if (profileData.profile?.display_name) completedFields++;
                  if (profileData.profile?.bio) completedFields++;
                  if (profileData.profile?.location) completedFields++;
                  if (profileData.profile?.website) completedFields++;
                  if (
                    profileData.profile?.social_links &&
                    Object.values(profileData.profile.social_links).some(
                      (link) => link
                    )
                  )
                    completedFields++;

                  return Math.round((completedFields / totalFields) * 100);
                })()}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className={`flex items-center gap-2 ${profileData.handle ? 'text-success-500' : 'text-white/60'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${profileData.handle ? 'bg-success-500' : 'bg-white/40'}`}
              ></div>
              Nazwa użytkownika
            </div>
            <div
              className={`flex items-center gap-2 ${profileData.profile?.display_name ? 'text-success-500' : 'text-white/60'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${profileData.profile?.display_name ? 'bg-success-500' : 'bg-white/40'}`}
              ></div>
              Nazwa wyświetlana
            </div>
            <div
              className={`flex items-center gap-2 ${profileData.profile?.bio ? 'text-success-500' : 'text-white/60'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${profileData.profile?.bio ? 'bg-success-500' : 'bg-white/40'}`}
              ></div>
              Bio
            </div>
            <div
              className={`flex items-center gap-2 ${profileData.profile?.location ? 'text-success-500' : 'text-white/60'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${profileData.profile?.location ? 'bg-success-500' : 'bg-white/40'}`}
              ></div>
              Lokalizacja
            </div>
            <div
              className={`flex items-center gap-2 ${profileData.profile?.website ? 'text-success-500' : 'text-white/60'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${profileData.profile?.website ? 'bg-success-500' : 'bg-white/40'}`}
              ></div>
              Strona internetowa
            </div>
            <div
              className={`flex items-center gap-2 ${profileData.profile?.social_links && Object.values(profileData.profile.social_links).some((link) => link) ? 'text-success-500' : 'text-white/60'}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${profileData.profile?.social_links && Object.values(profileData.profile.social_links).some((link) => link) ? 'bg-success-500' : 'bg-white/40'}`}
              ></div>
              Linki społecznościowe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
