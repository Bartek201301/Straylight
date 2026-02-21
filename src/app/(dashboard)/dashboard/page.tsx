'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth, useUserProfile, useSession } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(
  () => import('./_components/DashboardOverview')
);
const DashboardProfile = dynamic(
  () => import('./_components/DashboardProfile')
);
const DashboardSettings = dynamic(
  () => import('./_components/DashboardSettings')
);
const DashboardLightTool = dynamic(
  () => import('./_components/DashboardLightTool')
);

type TabType = 'overview' | 'profile' | 'articles' | 'lighttool' | 'settings';

function DashboardContent() {
  const { user } = useAuth();
  const profile = useUserProfile();
  const _session = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Listen for custom events to switch tabs
  useEffect(() => {
    const handleSwitchToSettings = () => {
      setActiveTab('settings');
    };

    window.addEventListener('switchToSettings', handleSwitchToSettings);
    return () => {
      window.removeEventListener('switchToSettings', handleSwitchToSettings);
    };
  }, []);

  // Handle hash-based navigation for direct tab access
  useEffect(() => {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (
      hash &&
      ['overview', 'profile', 'articles', 'lighttool', 'settings'].includes(
        hash
      )
    ) {
      setActiveTab(hash as TabType);
    }
  }, []);

  // Handle click outside to close mobile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMobileDropdownOpen(false);
      }
    };

    if (isMobileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobileDropdownOpen]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Przegląd' },
    { id: 'profile' as TabType, label: 'Mój Profil' },
    { id: 'articles' as TabType, label: 'Moje Artykuły' },
    { id: 'lighttool' as TabType, label: 'LightTool' },
    { id: 'settings' as TabType, label: 'Ustawienia' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-8 bg-black dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 mb-8 relative">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                Dashboard
              </h1>
              <p className="text-white/80 text-sm sm:text-base truncate">
                {profile.profile?.display_name || profile.handle
                  ? `Witaj ponownie, ${profile.profile?.display_name || profile.handle}!`
                  : 'Witaj w swoim osobistym dashboard'}
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-4 flex-shrink-0">
              {user?.role === 'admin' && (
                <a
                  href="/admin/dashboard"
                  className="px-4 py-2 bg-red-500/20 text-white rounded-md hover:bg-red-500/30 transition-colors text-base whitespace-nowrap backdrop-blur-sm border border-red-500/30"
                  title="Panel Admin"
                >
                  Admin
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl mb-8">
          {/* Mobile Dropdown Navigation */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
              className="w-full px-6 py-5 flex items-center justify-between text-white font-medium text-base border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
            >
              <span>{tabs.find((tab) => tab.id === activeTab)?.label}</span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Options */}
            <div className={`${isMobileDropdownOpen ? 'block' : 'hidden'}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileDropdownOpen(false);
                  }}
                  className={`w-full px-6 py-4 text-left text-base font-medium transition-colors duration-200 flex items-center border-b border-white/5 last:border-b-0 ${
                    activeTab === tab.id
                      ? 'bg-white/15 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Horizontal Navigation */}
          <div className="hidden sm:block border-b border-white/10">
            <nav
              className="flex overflow-x-auto sm:overflow-x-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm transition-all duration-300 whitespace-nowrap hover:scale-[1.05] ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-white/60 hover:text-white hover:shadow-lg'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'profile' && <DashboardProfile />}
          {activeTab === 'articles' && (
            <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Moje Artykuły
              </h2>
              <p className="text-white/80 mb-4">
                Zarządzaj artykułami i śledź zgłoszenia
              </p>
              <a
                href="/dashboard/articles"
                className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
              >
                Zobacz Wszystkie Artykuły →
              </a>
            </div>
          )}
          {activeTab === 'lighttool' && <DashboardLightTool />}
          {activeTab === 'settings' && <DashboardSettings />}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
