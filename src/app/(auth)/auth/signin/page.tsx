'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { sessionManager } from '@/lib/session-manager';
import type { SignInFormData, AuthErrorType } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGoogle } = useAuth();

  // Form state
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // URL parameters - default to /home for authenticated users
  const redirectTo = searchParams.get('redirect') || '/home';
  const pendingQuiz = searchParams.get('pendingQuiz');
  const successMessage = searchParams.get('message');
  const fromSignup = searchParams.get('from') === 'signup';

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email ma nieprawidłowy format';
    }

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      // Clear potential localStorage issues before attempting login
      clearStorageQuota();

      // Build callback URL with all query parameters
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirect', redirectTo);
      if (pendingQuiz) {
        callbackUrl.searchParams.set('pendingQuiz', pendingQuiz);
      }

      const { error } = await signInWithGoogle({
        redirectTo: callbackUrl.toString(),
      });

      if (error) {
        throw error;
      }

      // OAuth will redirect, so no need to handle success here
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);

      // Handle specific quota exceeded errors
      if (
        (error.message && error.message.includes('quota')) ||
        error.name === 'QuotaExceededError'
      ) {
        clearStorageQuota();
        setErrors({
          general:
            'Wystąpił problem z pamięcią przeglądarki. Spróbuj ponownie.',
        });
        setIsLoading(false);
        return;
      }

      setErrors({ general: 'Błąd logowania przez Google. Spróbuj ponownie.' });
      setIsLoading(false);
    }
  };

  // Clear localStorage quota issues
  const clearStorageQuota = () => {
    try {
      // Clear old Supabase auth tokens that might be corrupted or too large
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Could not remove localStorage key:', key);
        }
      });

      // Additional cleanup: remove any large or corrupted auth-related items
      try {
        ['auth.remember_me', 'supabase.auth.token'].forEach((key) => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('Could not clear additional auth items:', e);
      }

      console.log('🧹 Cleared localStorage auth tokens');
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
      // If localStorage is completely broken, try to clear everything
      try {
        localStorage.clear();
        console.log('🗑️ Cleared entire localStorage due to quota issues');
      } catch (clearError) {
        console.error('Could not clear localStorage at all:', clearError);
      }
    }
  };

  // Handle login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      // More aggressive localStorage clearing before Supabase auth
      try {
        // Clear all Supabase-related storage
        clearStorageQuota();

        // Force garbage collection by creating some space
        const testData = 'x'.repeat(1000);
        localStorage.setItem('temp-test', testData);
        localStorage.removeItem('temp-test');
      } catch (preError) {
        console.warn('Pre-auth cleanup failed:', preError);
        // If we can't even do basic localStorage operations, clear everything
        try {
          localStorage.clear();
        } catch (clearError) {
          console.error('Could not clear localStorage at all:', clearError);
          throw new Error(
            'localStorage jest pełny i nie można go wyczyścić. Spróbuj wyczyścić dane przeglądarki.'
          );
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Handle "Remember Me" with quota protection
        if (formData.rememberMe) {
          try {
            localStorage.setItem('auth.remember_me', 'true');
          } catch (quotaError) {
            console.warn('Could not save remember me preference:', quotaError);
          }
        }

        // Initialize session manager with quota error protection
        try {
          await sessionManager.initialize();
        } catch (sessionError: any) {
          console.warn('Session manager initialization failed:', sessionError);
          // If session manager fails due to quota issues, clear storage and try again
          if (
            sessionError.name === 'QuotaExceededError' ||
            (sessionError.message && sessionError.message.includes('quota'))
          ) {
            clearStorageQuota();
            try {
              await sessionManager.initialize();
            } catch (retryError) {
              console.error('Session manager retry failed:', retryError);
              // Continue with login even if session manager fails
            }
          }
        }

        console.log('✅ Login successful:', data.user?.email);
        const welcomeMessage = fromSignup
          ? 'Welcome to StrayLight! Redirecting to your dashboard...'
          : 'Sign in successful! Redirecting...';
        setMessage(welcomeMessage);

        // Build redirect URL with all query parameters
        let finalRedirect = redirectTo;
        if (pendingQuiz) {
          const redirectUrl = new URL(redirectTo, window.location.origin);
          redirectUrl.searchParams.set('pendingQuiz', pendingQuiz);
          finalRedirect = redirectUrl.pathname + redirectUrl.search;
        }

        // Redirect after short delay
        setTimeout(() => {
          router.push(finalRedirect);
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);

      // Handle specific quota exceeded errors with more aggressive cleanup
      if (
        (error.message && error.message.includes('quota')) ||
        error.name === 'QuotaExceededError'
      ) {
        try {
          // Nuclear option: clear everything
          localStorage.clear();
          sessionStorage.clear();
          console.log('🗑️ Cleared all browser storage due to quota issues');
          setErrors({
            general:
              'Wyczyszczono pamięć przeglądarki. Spróbuj zalogować się ponownie.',
          });
        } catch (clearError) {
          console.error('Could not clear storage:', clearError);
          setErrors({
            general:
              'Problem z pamięcią przeglądarki. Spróbuj wyczyścić dane przeglądarki ręcznie.',
          });
        }
        setIsLoading(false);
        return;
      }

      const errorMessages: Record<AuthErrorType, string> = {
        invalid_credentials: 'Nieprawidłowy email lub hasło',
        email_not_confirmed:
          'Email nie został potwierdzony. Sprawdź skrzynkę odbiorczą.',
        too_many_requests:
          'Za dużo prób logowania. Spróbuj ponownie za chwilę.',
        signup_disabled: 'Rejestracja jest wyłączona',
        invalid_request: 'Nieprawidłowe żądanie',
        unauthorized: 'Brak autoryzacji',
        email_already_exists: 'Ten email jest już zarejestrowany',
        weak_password: 'Hasło jest za słabe',
        invalid_email: 'Nieprawidłowy format email',
        network_error: 'Błąd sieci. Sprawdź połączenie internetowe.',
        unknown_error: 'Nieznany błąd',
      };

      const errorMessage =
        errorMessages[error.message as AuthErrorType] ||
        `Błąd logowania: ${error.message}`;

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Show success message from URL params (e.g., from email confirmation)
  useEffect(() => {
    if (successMessage) {
      setMessage(decodeURIComponent(successMessage));
    }
  }, [successMessage]);

  // Check for localStorage quota issues on component mount
  useEffect(() => {
    try {
      // Test if localStorage is available and not full
      const testKey = 'test-quota-' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error: any) {
      if (
        error.name === 'QuotaExceededError' ||
        (error.message && error.message.includes('quota'))
      ) {
        console.warn(
          'localStorage quota exceeded on page load, clearing auth tokens'
        );
        clearStorageQuota();
      }
    }
  }, []);

  return (
    <div
      className={`min-h-screen grid place-items-center px-2 sm:px-4 py-8 ${'bg-black'}`}
    >
      <div className="w-full max-w-xs">
        {/* Outside header (logo + title) */}
        <div className="flex flex-col items-center mb-1">
          <img
            src="/logo transparent.png"
            alt="StrayLight Logo"
            className="mx-auto w-14 h-14 sm:w-16 sm:h-16 object-contain"
          />
          <h1 className={`mt-3 text-2xl font-bold font-roboto ${'text-white'}`}>
            Sign in
          </h1>
        </div>

        {/* Segmented control: Sign up / Log in */}
        <div
          className="mt-2 flex rounded-full border border-neutral-600 overflow-hidden divide-x divide-neutral-600"
          role="tablist"
          aria-label="Authentication tabs"
        >
          <Link
            role="tab"
            aria-selected="false"
            href={`/auth/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="flex-1 text-center py-2 text-neutral-300 hover:text-white hover:bg-white/5 font-medium"
          >
            Sign up
          </Link>
          <span
            role="tab"
            aria-selected="true"
            className="flex-1 text-center py-2 bg-white/10 text-white font-medium"
          >
            Log in
          </span>
        </div>

        <div className="">
          <div className="">
            {/* Success Message */}
            {message && (
              <div className="mb-4 rounded-md border border-success-600 bg-success-950/30 p-3">
                <p className="text-sm text-success-400">{message}</p>
              </div>
            )}

            {/* Error Message */}
            {errors.general && (
              <div className="card-base p-4 border-l-4 border-error-500 mb-4">
                <p className="text-sm text-error-500">{errors.general}</p>
              </div>
            )}

            {/* Email + Password */}
            <form className="mt-4 space-y-6" onSubmit={handleSignIn}>
              <div className="space-y-4">
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium mb-2 ${'text-white'}`}
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`input ${errors.email ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Enter your mail"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium mb-2 ${'text-white'}`}
                >
                  Hasło
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`input pr-10 ${errors.password ? 'border-error-500 focus:border-error-500' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label
                  className={`flex items-center gap-2 text-sm ${'text-white'}`}
                >
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`h-4 w-4 text-primary-500 focus:ring-primary-400 rounded disabled:opacity-50 ${'border-neutral-600'}`}
                  />
                  Zapamiętaj mnie
                </label>
                <a
                  href="/auth/forgot-password"
                  className={`text-sm ${'text-primary-400 hover:text-primary-300'}`}
                >
                  Zapomniałeś hasła?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 inline-flex items-center justify-center gap-1 rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 focus:ring-offset-neutral-900'}`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-5 w-5 text-neutral-900"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logowanie...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t ${'border-neutral-600'}`}
                ></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${'text-neutral-400 bg-black'}`}>
                  OR
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full flex justify-center items-center px-3 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition ${'border-neutral-600 bg-white text-neutral-800 hover:bg-neutral-50'}`}
            >
              <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">
                {isLoading ? 'Logowanie...' : 'Continue with Google'}
              </span>
            </button>

            {/* Return to homepage link */}
            <div className="text-center mt-6">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-neutral-300 hover:text-white transition-colors group"
              >
                <svg
                  className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Powrót do strony głównej
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-black/60 dark:text-neutral-400">Ładowanie...</p>
          </div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
