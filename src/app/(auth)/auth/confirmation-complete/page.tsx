'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

function ConfirmationCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [countdown, setCountdown] = useState(5);
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const email = searchParams.get('email') || user?.email || '';

  // Countdown timer for auto-redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push(redirectTo);
    }
  }, [countdown, router, redirectTo]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto h-16 w-16 text-white mb-6">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-wide uppercase font-sans">
            Gratulacje!
          </h1>

          <h2 className="text-xl font-medium text-white/90 mb-4">
            Twoje konto zostało potwierdzone
          </h2>

          {email && (
            <p className="text-white/70 mb-6">
              Adres email <strong className="text-white">{email}</strong> został
              pomyślnie potwierdzony.
            </p>
          )}

          {/* Countdown */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
            <p className="text-sm text-white/80">
              Przekierowanie za{' '}
              <strong className="text-white">{countdown}</strong>{' '}
              {countdown === 1 ? 'sekundę' : 'sekund'}
            </p>
          </div>

          {/* Action Button */}
          <Link
            href={redirectTo}
            className="w-full bg-white text-black py-3 px-6 rounded-lg font-mono text-sm transition-all hover:bg-white/90 flex items-center justify-center font-medium mb-6"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            Przejdź do aplikacji
          </Link>

          {/* Welcome Message */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm mb-4">
            <h3 className="text-lg font-medium text-white mb-2">
              Witaj w społeczności StrayLight
            </h3>
            <p className="text-sm text-white/70">
              Możesz teraz pisać artykuły, dzielić się wiedzą i odkrywać
              najlepsze zasoby naukowe.
            </p>
          </div>

          {/* Back to Home Link */}
          <Link
            href="/"
            className="text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            ← Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white/70">Ładowanie...</p>
          </div>
        </div>
      }
    >
      <ConfirmationCompleteContent />
    </Suspense>
  );
}
