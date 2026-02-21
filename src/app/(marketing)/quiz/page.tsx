'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { hasCompletedQuiz, getQuizState } from '@/lib/quiz/storage';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Quiz Landing Page
 * Introduces LightTool and invites users to start the quiz
 * Shows completion status for users who have already completed the quiz
 */
export default function QuizLandingPage() {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!user;

  useEffect(() => {
    const checkCompletion = () => {
      const completed = hasCompletedQuiz();
      setIsCompleted(completed);

      if (completed) {
        const state = getQuizState();
        setCompletedAt(state?.completedAt || null);
      }

      setIsLoading(false);
    };

    checkCompletion();
  }, []);
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-inter">
            LightTool
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-source max-w-2xl mx-auto">
            Znajdź idealne narzędzia AI dopasowane do Twoich potrzeb
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-12">
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg md:rounded-2xl p-3 md:p-6 text-center">
            <div className="text-lg md:text-3xl mb-1 md:mb-3">⚡</div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-0.5 md:mb-2 font-inter">
              Szybkie
            </h3>
            <p className="text-white/70 text-xs md:text-sm font-source">
              10 pytań, kilka minut
            </p>
          </div>

          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg md:rounded-2xl p-3 md:p-6 text-center">
            <div className="text-lg md:text-3xl mb-1 md:mb-3">🎯</div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-0.5 md:mb-2 font-inter">
              Precyzyjne
            </h3>
            <p className="text-white/70 text-xs md:text-sm font-source">
              AI dopasuje narzędzia do Twoich potrzeb
            </p>
          </div>

          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg md:rounded-2xl p-3 md:p-6 text-center">
            <div className="text-lg md:text-3xl mb-1 md:mb-3">✨</div>
            <h3 className="text-sm md:text-lg font-bold text-white mb-0.5 md:mb-2 font-inter">
              Sprawdzone
            </h3>
            <p className="text-white/70 text-xs md:text-sm font-source">
              Tylko najlepsze, zweryfikowane narzędzia
            </p>
          </div>
        </div>

        {/* CTA */}
        {!(isLoggedIn && isCompleted) && (
          <div className="text-center space-y-4">
            <Link
              href="/quiz/questions"
              className="inline-block px-8 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-gray-100 hover:scale-[1.01] transition-all duration-300 shadow-lg border border-black/10 font-source"
            >
              Rozpocznij Quiz 🚀
            </Link>
            <p className="text-white/60 text-sm font-source text-center mx-auto">
              Darmowe • Bez rejestracji • Wyniki w ciągu sekund
            </p>
          </div>
        )}

        {/* Quiz Completion Status - Only shown if user is logged in and has completed quiz */}
        {!isLoading && isCompleted && isLoggedIn && (
          <div className="mt-8 text-center">
            <div className="backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 max-w-md mx-auto">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-white mb-2 font-inter">
                Masz już zapisane rekomendacje!
              </h3>
              <p className="text-white/70 text-sm font-source mb-4">
                {completedAt && (
                  <>
                    Ostatnio wypełnione:{' '}
                    {new Date(completedAt).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard#lighttool"
                  className="inline-block px-6 py-3 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-100 hover:scale-[1.01] transition-all duration-300 font-source"
                >
                  Zobacz w Dashboard
                </Link>
                <Link
                  href="/quiz/questions"
                  className="inline-block px-6 py-3 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 hover:scale-[1.01] transition-all duration-300 border border-white/20 font-source"
                >
                  Wypełnij ponownie
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center font-inter">
            Jak to działa?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 font-inter">
                  Odpowiedz na pytania
                </h3>
                <p className="text-white/70 text-sm font-source">
                  10 pytań o Twoje cele, branżę, poziom i budżet
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 font-inter">
                  AI analizuje odpowiedzi
                </h3>
                <p className="text-white/70 text-sm font-source">
                  Inteligentny algorytm dobiera narzędzia z naszej bazy
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 font-inter">
                  Otrzymujesz rekomendacje
                </h3>
                <p className="text-white/70 text-sm font-source">
                  3 narzędzia AI idealnie dopasowane do Twoich potrzeb
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
