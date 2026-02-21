'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import QuizResultsView from '@/components/quiz/QuizResultsView';
import QuizLoadingState from '@/components/quiz/QuizLoadingState';
import QuizErrorState from '@/components/quiz/QuizErrorState';
import {
  getQuizRecommendations,
  getQuizState,
  saveQuizRecommendations,
  getPendingQuizAnswers,
  clearPendingQuizAnswers,
  associateQuizStateWithUser,
} from '@/lib/quiz/storage';
import { sanitizeQuizAnswers } from '@/lib/quiz/helpers';
import { API_ENDPOINT } from '@/lib/quiz/constants';
import { AffiliateLibraryRow } from '@/lib/types/affiliate-library';
import { QuizAnswers } from '@/lib/types/quiz';

/**
 * Quiz Results Page
 * Fetches and displays personalized AI tool recommendations
 * - Detects pendingQuiz flag after authentication to load fresh results
 * - First checks localStorage for cached recommendations
 * - Falls back to API if no cache exists
 * - Redirects to /quiz/questions if no quiz answers found
 */
export default function QuizResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<
    AffiliateLibraryRow[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for pending quiz flag in URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const pendingQuiz = url.searchParams.get('pendingQuiz');

      if (pendingQuiz === 'true' && user) {
        // User just logged in after taking quiz - load fresh results
        loadFreshResults();
      } else {
        // Normal flow - try cached results first
        loadResults();
      }
    } else {
      loadResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFreshResults = async () => {
    setIsLoading(true);
    setError(null);

    // Check for pending answers in sessionStorage
    let answers = getPendingQuizAnswers();

    if (!answers) {
      // Fallback: check localStorage
      const state = getQuizState();
      answers = state?.answers || null;
    }

    if (!answers) {
      // No answers found, redirect to quiz
      router.push('/quiz/questions');
      return;
    }

    try {
      // Sanitize answers before sending to API
      const sanitizedAnswers = sanitizeQuizAnswers(answers);

      // Fetch fresh recommendations from API
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedAnswers),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Nie udało się pobrać rekomendacji'
        );
      }

      const data = await response.json();

      // Validate response
      if (
        !data.success ||
        !data.data?.recommendations ||
        !Array.isArray(data.data.recommendations)
      ) {
        throw new Error('Nieprawidłowa odpowiedź z serwera');
      }

      // Extract personalized guidance from API response
      const personalizedGuidance = data.data.personalized_guidance || {};

      // Save to localStorage with user association and personalized guidance
      saveQuizRecommendations(
        data.data.recommendations,
        answers,
        personalizedGuidance
      );
      if (user?.id) {
        associateQuizStateWithUser(user.id);
      }

      // Clear pending quiz
      clearPendingQuizAnswers();

      // Remove query param from URL
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/quiz/results');
      }

      setRecommendations(data.data.recommendations);
    } catch (error) {
      console.error('Failed to load fresh quiz results:', error);
      setError(
        error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current quiz state (contains latest answers)
      const quizState = getQuizState();
      if (!quizState?.answers) {
        // No answers - redirect to quiz
        router.push('/quiz/questions');
        return;
      }

      const currentAnswers = quizState.answers as QuizAnswers;

      // Check if we have cached recommendations
      const savedRecommendations = getQuizRecommendations();

      // If we have cached recommendations, use them
      // NOTE: saveQuizAnswers() automatically clears recommendations when answers change,
      // so if cache exists, it means answers haven't changed since last recommendations
      if (
        savedRecommendations &&
        savedRecommendations.length === 3 &&
        quizState.completedAt
      ) {
        console.log('✅ Using cached recommendations (answers unchanged)');
        setRecommendations(savedRecommendations);
        setIsLoading(false);
        return;
      }

      // No cache or answers changed - fetch fresh recommendations from API
      console.log('🔄 Fetching fresh recommendations from API');
      const sanitizedAnswers = sanitizeQuizAnswers(currentAnswers);

      // Fetch recommendations from API
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedAnswers),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Nie udało się pobrać rekomendacji'
        );
      }

      const data = await response.json();

      // Validate response structure
      if (
        !data.success ||
        !data.data?.recommendations ||
        !Array.isArray(data.data.recommendations)
      ) {
        throw new Error('Nieprawidłowa odpowiedź z serwera');
      }

      // Extract personalized guidance from API response
      const personalizedGuidance = data.data.personalized_guidance || {};

      // Save to localStorage with personalized guidance
      saveQuizRecommendations(
        data.data.recommendations,
        currentAnswers,
        personalizedGuidance
      );

      setRecommendations(data.data.recommendations);
    } catch (err) {
      console.error('Failed to load quiz results:', err);
      setError(
        err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <QuizLoadingState />;
  }

  if (error) {
    return <QuizErrorState error={error} onRetry={loadResults} />;
  }

  return (
    <QuizResultsView recommendations={recommendations} isLoading={isLoading} />
  );
}
