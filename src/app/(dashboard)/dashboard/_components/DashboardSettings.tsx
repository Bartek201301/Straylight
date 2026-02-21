'use client';

import ProfileForm from '@/components/forms/ProfileForm';
import PasswordForm from '@/components/forms/PasswordForm';
import { useState } from 'react';
import { useAuth, useUserProfile } from '@/contexts/AuthContext';

type SettingsTabType = 'profile' | 'security';

export default function DashboardSettings() {
  const { user: _user } = useAuth();
  const _profile = useUserProfile();
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTabType>('profile');

  const settingsTabs = [
    { id: 'profile' as SettingsTabType, label: 'Ustawienia Profilu' },
    { id: 'security' as SettingsTabType, label: 'Bezpieczeństwo' },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Navigation */}
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="border-b border-white/10">
          <nav className="flex" aria-label="Settings Tabs">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeSettingsTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="min-h-[400px]">
        {activeSettingsTab === 'profile' && (
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">
                Informacje Profilu
              </h2>
              <p className="text-white/80">
                Zaktualizuj informacje profilu, linki społecznościowe i dane
                osobowe.{' '}
                <strong>
                  Pamiętaj, aby kliknąć &ldquo;Zapisz Profil&rdquo;, aby zapisać
                  zmiany.
                </strong>{' '}
                Te zmiany będą widoczne w twoim profilu publicznym.
              </p>
            </div>

            <div className="max-w-2xl">
              <ProfileForm />
            </div>
          </div>
        )}

        {activeSettingsTab === 'security' && (
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">
                Ustawienia Bezpieczeństwa
              </h2>
              <p className="text-white/80">
                Zarządzaj hasłem i ustawieniami bezpieczeństwa konta.
              </p>
            </div>

            <div className="max-w-2xl">
              <PasswordForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
