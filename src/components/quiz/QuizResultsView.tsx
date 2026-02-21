'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';
import { useAuth } from '@/contexts/AuthContext';
import {
  clearQuizState,
  getQuizState,
  setPendingQuizAnswers,
  getPersonalizedGuidance,
} from '@/lib/quiz/storage';
import { QUIZ_ROUTES } from '@/lib/quiz/constants';
import AffiliateLibraryCard from '@/components/affiliate/AffiliateLibraryCard';
import EnhancedRecommendationCard from '@/components/quiz/EnhancedRecommendationCard';

interface QuizResultsViewProps {
  recommendations: AffiliateLibraryRow[] | null;
  isLoading: boolean;
}

/**
 * Quiz results view component
 * Shows recommendations for authenticated users, or a gated CTA for guests
 */
export default function QuizResultsView({
  recommendations,
  isLoading,
}: QuizResultsViewProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    clearQuizState();
    router.push(QUIZ_ROUTES.questions);
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto" />
          <p className="text-white/60 font-source">Ładowanie wyników...</p>
        </div>
      </div>
    );
  }

  // Error state - no recommendations
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">😕</div>
          <h2 className="text-2xl font-bold text-white font-inter">
            Nie znaleziono rekomendacji
          </h2>
          <p className="text-white/80 font-source">
            Przepraszamy, nie udało się wygenerować rekomendacji. Spróbuj
            ponownie.
          </p>
          <button
            onClick={handleRetakeQuiz}
            className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 hover:scale-[1.01] transition-all duration-300 font-semibold shadow-lg border border-black/10 font-source"
          >
            Wypełnij quiz ponownie
          </button>
        </div>
      </div>
    );
  }

  // Handle signup - save pending quiz before redirect
  const handleSignUp = () => {
    const state = getQuizState();
    if (state?.answers) {
      setPendingQuizAnswers(state.answers);
      console.log('📋 Quiz answers saved to sessionStorage before signup');
    }
    clearQuizState();
    router.push('/auth/signup?redirect=/quiz/results&pendingQuiz=true');
  };

  // Handle signin - save pending quiz before redirect
  const handleSignIn = () => {
    const state = getQuizState();
    if (state?.answers) {
      setPendingQuizAnswers(state.answers);
      console.log('📋 Quiz answers saved to sessionStorage before signin');
    }
    clearQuizState();
    router.push('/auth/signin?redirect=/quiz/results&pendingQuiz=true');
  };

  // Guest view - gated content
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative min-h-[600px] flex items-center justify-center">
            {/* Blurred recommendations cards */}
            <div className="absolute inset-0 filter blur-lg pointer-events-none select-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map((tool) => (
                  <AffiliateLibraryCard
                    key={tool.id}
                    item={tool}
                    source="recommendation"
                  />
                ))}
              </div>
            </div>

            {/* Overlay CTA - Centered */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
              <div className="text-center space-y-6 max-w-md px-4">
                {/* Lock icon */}
                <div className="text-6xl">🔒</div>

                {/* CTA heading */}
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white font-inter">
                    Załóż darmowe konto
                  </h2>
                  <p className="text-white/80 font-source">
                    Aby zobaczyć spersonalizowane rekomendacje narzędzi AI
                  </p>
                </div>

                {/* CTA buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleSignUp}
                    className="block w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 hover:scale-[1.01] transition-all duration-300 font-semibold shadow-lg border border-black/10 font-source relative z-20"
                  >
                    Zarejestruj się
                  </button>

                  <p className="text-sm text-white/60 font-source">
                    Masz już konto?{' '}
                    <button
                      onClick={handleSignIn}
                      className="text-white hover:underline relative z-20"
                    >
                      Zaloguj się
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user view - show full recommendations
  // Get personalized guidance from storage (if available)
  const personalizedGuidance = getPersonalizedGuidance();

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Header with Overview */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-white font-inter">
              Twoje Rekomendacje 🎯
            </h2>
            <p className="text-lg md:text-xl text-white/80 font-source max-w-2xl mx-auto leading-relaxed">
              Na podstawie Twoich odpowiedzi wybraliśmy 3 idealne narzędzia AI,
              które pomogą Ci osiągnąć cele
            </p>
          </div>

          {/* Recommendations grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.slice(0, 3).map((tool, index) => (
              <EnhancedRecommendationCard
                key={tool.id}
                item={tool}
                personalizedGuidance={personalizedGuidance?.[tool.id]}
                position={index + 1}
              />
            ))}
          </div>

          {/* Retake quiz button */}
          <div className="text-center pt-4">
            <button
              onClick={handleRetakeQuiz}
              className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium font-source"
            >
              Wypełnij quiz ponownie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
