'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const success = searchParams.get('success') === 'true';
  const verifiedEmail = searchParams.get('email');
  const urlError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const pendingQuiz = searchParams.get('pendingQuiz');

  // Handle URL parameters
  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(errorDescription || urlError));
    }
  }, [urlError, errorDescription]);

  // Handle successful email verification
  useEffect(() => {
    // Build final redirect URL with query params
    const buildRedirectUrl = () => {
      if (!pendingQuiz) return redirectTo;

      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set('pendingQuiz', pendingQuiz);
      return url.pathname + url.search;
    };

    // If user is authenticated and has confirmed email (just got verified)
    if (!authLoading && user?.email_confirmed_at && !success && !urlError) {
      // This means email was just verified via Supabase client-side auth
      // Set our own success state and redirect after delay
      const timer = setTimeout(() => {
        router.push(buildRedirectUrl());
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Handle success from URL parameters (our custom flow)
    if (success && verifiedEmail && !authLoading) {
      const timer = setTimeout(() => {
        router.push(buildRedirectUrl());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    user,
    authLoading,
    success,
    verifiedEmail,
    urlError,
    router,
    redirectTo,
    pendingQuiz,
  ]);

  const handleResendEmail = useCallback(async () => {
    if (!user?.email) return;

    setIsLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      // Build email callback URL with all query params
      const emailCallbackUrl = new URL(
        '/auth/callback',
        window.location.origin
      );
      if (redirectTo && redirectTo !== '/dashboard') {
        emailCallbackUrl.searchParams.set('redirect', redirectTo);
      }
      if (pendingQuiz) {
        emailCallbackUrl.searchParams.set('pendingQuiz', pendingQuiz);
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: emailCallbackUrl.toString(),
        },
      });

      if (resendError) {
        throw resendError;
      }

      setResendSuccess(true);
    } catch (err: any) {
      const message = err?.message?.toLowerCase() || '';
      if (message.includes('email rate limit exceeded')) {
        setError(
          'Zbyt wiele prób wysłania emaila. Spróbuj ponownie za kilka minut.'
        );
      } else if (message.includes('user not found')) {
        setError('Nie znaleziono użytkownika. Spróbuj zalogować się ponownie.');
      } else {
        setError(err?.message || 'Wystąpił błąd podczas wysyłania emaila');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, redirectTo, pendingQuiz]);

  // Success state - email verified (from URL params or detected auth state)
  const isEmailVerified =
    (success && verifiedEmail) || (!authLoading && user?.email_confirmed_at);

  // Build redirect URL with pendingQuiz if present
  const finalRedirectUrl = (() => {
    if (!pendingQuiz) return redirectTo;
    const url = new URL(redirectTo, window.location.origin);
    url.searchParams.set('pendingQuiz', pendingQuiz);
    return url.pathname + url.search;
  })();

  // Build signin redirect URL with all params
  const signinRedirectUrl = (() => {
    const url = new URL('/auth/signin', window.location.origin);
    url.searchParams.set('from', 'signup');
    if (redirectTo !== '/dashboard') {
      url.searchParams.set('redirect', redirectTo);
    }
    if (pendingQuiz) {
      url.searchParams.set('pendingQuiz', pendingQuiz);
    }
    return url.pathname + url.search;
  })();

  if (isEmailVerified) {
    const emailToShow =
      (verifiedEmail && decodeURIComponent(verifiedEmail)) ||
      (user?.email ?? '');

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Email potwierdzony</h2>
              <p className="text-sm text-white/70">
                Adres{' '}
                <span className="font-medium text-white">{emailToShow}</span>{' '}
                został potwierdzony. Za moment przeniesiemy Cię dalej.
              </p>
              <p className="text-xs text-white/50">
                Przekierowanie nastąpi w ciągu 3 sekund.
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href={finalRedirectUrl}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Przejdź dalej
              </Link>
              <Link
                href={signinRedirectUrl}
                className="block text-center text-sm text-white/60 hover:text-white/80 transition"
              >
                Wróć do logowania
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  // We handle errors inline below to keep the view consistent

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border border-white/10 border-t-transparent"></div>
      </div>
    );
  }

  // Default state - waiting for email verification
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Sprawdź swój email</h1>
            <p className="text-sm text-white/70">
              {user?.email ? (
                <>
                  Wysłaliśmy link weryfikacyjny na adres{' '}
                  <span className="font-medium text-white">{user.email}</span>.
                  Otwórz wiadomość i potwierdź swoje konto.
                </>
              ) : (
                'Sprawdź skrzynkę pocztową i kliknij w link, który przesłaliśmy.'
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 px-5 py-4">
            <h2 className="text-sm font-medium text-white">
              Jak przyspieszyć weryfikację
            </h2>
            <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-white/70">
              <li>Sprawdź folder spam oraz zakładkę „Oferty”.</li>
              <li>Link pozostaje aktywny przez 24 godziny.</li>
              <li>Po potwierdzeniu zalogujemy Cię automatycznie.</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70">
              {error}
            </div>
          )}

          {user?.email && (
            <div className="space-y-2">
              {resendSuccess ? (
                <div className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
                  Email wysłano ponownie. Sprawdź skrzynkę.
                </div>
              ) : (
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
                >
                  {isLoading ? 'Wysyłanie…' : 'Wyślij wiadomość ponownie'}
                </button>
              )}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Link
              href="/auth/signin"
              className="block text-center text-sm text-white hover:text-white/80 transition"
            >
              Wróć do logowania
            </Link>
            <Link
              href="/"
              className="block text-center text-sm text-white/60 hover:text-white/80 transition"
            >
              Strona główna
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border border-white/10 border-t-transparent"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
