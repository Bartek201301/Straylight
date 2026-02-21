'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EnhancedRecommendationCard from '@/components/quiz/EnhancedRecommendationCard';
import {
  getQuizRecommendations,
  hasCompletedQuiz as checkQuizCompleted,
  clearQuizState,
  getQuizState,
  getPersonalizedGuidance,
} from '@/lib/quiz/storage';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';

/**
 * Dashboard LightTool tab component
 * Shows saved quiz recommendations or prompts user to take the quiz
 */
export default function DashboardLightTool() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<
    AffiliateLibraryRow[] | null
  >(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load saved recommendations on mount
  useEffect(() => {
    loadSavedRecommendations();
  }, []);

  const loadSavedRecommendations = () => {
    try {
      const completed = checkQuizCompleted();
      setHasCompleted(completed);

      if (completed) {
        const savedRecommendations = getQuizRecommendations();
        const state = getQuizState();

        if (savedRecommendations && savedRecommendations.length > 0) {
          setRecommendations(savedRecommendations);
          setLastUpdated(state?.lastUpdated || null);
        }
      }
    } catch (error) {
      console.error('Failed to load quiz recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    clearQuizState();
    router.push('/quiz/questions');
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Nieznana data';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Relative time for recent updates
      if (diffMinutes < 1) {
        return 'Przed chwilą';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minutę' : 'minut'} temu`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'godzinę' : 'godzin'} temu`;
      } else {
        // Absolute date for older updates
        return date.toLocaleDateString('pl-PL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (error) {
      return 'Nieznana data';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
        </div>
      </div>
    );
  }

  // Not completed - show CTA to start quiz
  if (!hasCompleted || !recommendations || recommendations.length === 0) {
    return (
      <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-6 md:p-8">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-inter">
              LightTool - Znajdź Idealne Narzędzia AI
            </h2>
            <p className="text-white/80 leading-relaxed font-source">
              Odpowiedz na 10 pytań, a my dobierzemy 3 narzędzia AI idealnie
              dopasowane do Twoich potrzeb i poziomu zaawansowania, wraz ze
              spersonalizowanymi poradami jak z nich korzystać.
            </p>
          </div>

          {/* CTA Button */}
          <Link
            href="/quiz"
            className="inline-block px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 hover:scale-[1.01] transition-all duration-300 font-semibold shadow-lg border border-black/10 font-source"
          >
            Rozpocznij Quiz
          </Link>
        </div>
      </div>
    );
  }

  // Completed - show recommendations
  // Get personalized guidance (if available - backward compatible)
  const personalizedGuidance = getPersonalizedGuidance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 font-inter">
              Twoje Rekomendacje 🎯
            </h2>
            <p className="text-white/60 text-sm font-source">
              Zaktualizowano: {formatDate(lastUpdated)}
            </p>
          </div>
          <button
            onClick={handleRetake}
            className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium font-source whitespace-nowrap"
          >
            Wypełnij ponownie
          </button>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.slice(0, 3).map((tool, index) => (
          <EnhancedRecommendationCard
            key={tool.id}
            item={tool}
            personalizedGuidance={personalizedGuidance?.[tool.id]}
            position={index + 1}
          />
        ))}
      </div>

      {/* Info Footer */}
      <div className="backdrop-blur-sm bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl p-4">
        <p className="text-white/60 text-sm text-center font-source">
          💡 Wyniki są zapisywane przez 24h. Po tym czasie możesz wypełnić quiz
          ponownie, aby otrzymać zaktualizowane rekomendacje.
        </p>
      </div>
    </div>
  );
}
