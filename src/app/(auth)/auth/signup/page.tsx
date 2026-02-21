'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { SignUpFormData } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // Get redirect parameter - default to /home for authenticated users
  const redirectTo = searchParams.get('redirect') || '/home';
  const pendingQuiz = searchParams.get('pendingQuiz');

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    handle: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    handle?: string;
  }>({});

  // Local display name (mapped to handle automatically)
  const [name, setName] = useState<string>('');

  const generateHandleFromName = (input: string): string => {
    // Remove diacritics, lowercase, replace spaces with '-', keep a-z0-9_-
    const ascii = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const slug = ascii
      .toLowerCase()
      .replace(/[^a-z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return slug;
  };

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email jest wymagany';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) return 'Nieprawidłowy format email';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Hasło jest wymagane';
    if (password.length < 8) return 'Hasło musi mieć minimum 8 znaków';
    if (!/[A-Z]/.test(password)) return 'Hasło musi zawierać wielką literę';
    if (!/[0-9]/.test(password)) return 'Hasło musi zawierać cyfrę';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return 'Hasło musi zawierać znak specjalny';
    return undefined;
  };

  const validateHandle = (handle: string): string | undefined => {
    if (!handle) return 'Nazwa użytkownika jest wymagana';
    if (handle.length < 3) return 'Nazwa użytkownika musi mieć minimum 3 znaki';
    if (handle.length > 20)
      return 'Nazwa użytkownika może mieć maksymalnie 20 znaków';
    const handlePattern = /^[a-zA-Z0-9_-]+$/;
    if (!handlePattern.test(handle))
      return 'Nazwa może zawierać tylko litery, cyfry, _ i -';
    return undefined;
  };

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear general error when user starts typing
    if (error) setError('');

    // Real-time field validation
    let fieldError: string | undefined;
    switch (field) {
      case 'email':
        fieldError = validateEmail(value);
        break;
      case 'password':
        fieldError = validatePassword(value);
        break;
      case 'handle':
        fieldError = validateHandle(value);
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  // Map Supabase errors to user-friendly messages
  const getErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('user already registered')) {
      return 'Konto z tym adresem email już istnieje';
    }
    if (message.includes('invalid email')) {
      return 'Nieprawidłowy adres email';
    }
    if (message.includes('password')) {
      return 'Hasło nie spełnia wymagań bezpieczeństwa';
    }
    if (message.includes('signup is disabled')) {
      return 'Rejestracja jest obecnie wyłączona';
    }
    if (message.includes('email rate limit exceeded')) {
      return 'Zbyt wiele prób. Spróbuj ponownie później';
    }

    return error?.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie';
  };

  // Handle Google sign up
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');

    try {
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
    } catch (err: any) {
      console.error('❌ Google sign up error:', err);
      setError('Błąd rejestracji przez Google. Spróbuj ponownie.');
      setIsLoading(false);
    }
  };

  // Form validation before submission
  const validateForm = (): boolean => {
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      handle: validateHandle(formData.handle || ''),
    };

    setFieldErrors(errors);
    return !Object.values(errors).some((error) => error !== undefined);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Handle form submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Build email verification callback URL with all query params
      const emailCallbackUrl = new URL(
        '/auth/callback',
        window.location.origin
      );
      if (redirectTo && redirectTo !== '/') {
        emailCallbackUrl.searchParams.set('redirect', redirectTo);
      }
      if (pendingQuiz) {
        emailCallbackUrl.searchParams.set('pendingQuiz', pendingQuiz);
      }

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            handle: formData.handle, // This will be available in user metadata
          },
          emailRedirectTo: emailCallbackUrl.toString(),
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Build verify email page URL with all query params
        const verifyUrl = new URL('/auth/verify-email', window.location.origin);
        if (redirectTo && redirectTo !== '/') {
          verifyUrl.searchParams.set('redirect', redirectTo);
        }
        if (pendingQuiz) {
          verifyUrl.searchParams.set('pendingQuiz', pendingQuiz);
        }

        router.push(verifyUrl.pathname + verifyUrl.search);
        return;
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-2 sm:px-4 lg:px-5 bg-black">
      <div className="max-w-xs w-full space-y-8">
        <div className="text-center">
          <img
            src="/logo transparent.png"
            alt="StrayLight Logo"
            className="mx-auto w-14 h-14 sm:w-16 sm:h-16 object-contain"
          />
          <h1 className="mt-3 text-2xl font-bold text-white font-roboto">
            Create an account
          </h1>
        </div>

        {/* Segmented control: Sign up / Log in */}
        <div
          className="mt-2 flex rounded-full border border-neutral-600 overflow-hidden divide-x divide-neutral-600"
          role="tablist"
          aria-label="Authentication tabs"
        >
          <span
            role="tab"
            aria-selected="true"
            className="flex-1 text-center py-2 bg-white/10 text-white font-medium"
          >
            Sign up
          </span>
          <Link
            role="tab"
            aria-selected="false"
            href={`/auth/signin${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="flex-1 text-center py-2 text-neutral-300 hover:text-white hover:bg-white/5 font-medium"
          >
            Log in
          </Link>
        </div>

        <form className="mt-4 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">
            {/* Name (maps to handle) */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2 text-white"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className={`input ${fieldErrors.handle ? 'border-error-500 focus:border-error-500' : ''}`}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  const derived = generateHandleFromName(value);
                  setFormData((prev) => ({ ...prev, handle: derived }));
                  setFieldErrors((prev) => ({
                    ...prev,
                    handle: validateHandle(derived),
                  }));
                  if (error) setError('');
                }}
                disabled={isLoading}
              />
              {fieldErrors.handle && (
                <p className="mt-1 text-sm text-error-500">
                  {fieldErrors.handle}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-white"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input ${fieldErrors.email ? 'border-error-500 focus:border-error-500' : ''}`}
                placeholder="Enter your mail"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-error-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-white"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input pr-10 ${fieldErrors.password ? 'border-error-500 focus:border-error-500' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  disabled={isLoading}
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
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-error-500">
                  {fieldErrors.password}
                </p>
              )}
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs text-neutral-400">
                  <span className="mr-2 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-neutral-500">
                    <svg
                      className="w-2 h-2 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span>Must be at least 8 characters</span>
                </div>
                <div className="flex items-center text-xs text-neutral-400">
                  <span className="mr-2 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-neutral-500">
                    <svg
                      className="w-2 h-2 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <span>Must contain one special character</span>
                </div>
              </div>
            </div>
          </div>

          {/* General Error */}
          {error && (
            <div className="card-base p-4 border-l-4 border-error-500">
              <div className="text-sm text-error-500">{error}</div>
            </div>
          )}

          {/* Primary submit */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 inline-flex items-center justify-center gap-1 rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 focus:ring-offset-neutral-900"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Get started'
              )}
            </button>

            {/* OR divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-neutral-400">OR</span>
              </div>
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-2 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-neutral-600 bg-white hover:bg-neutral-50 text-neutral-700"
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
              <span className="font-medium text-neutral-700">
                {isLoading ? 'Rejestracja...' : 'Sign up with Google'}
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
        </form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-black/60 dark:text-neutral-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
