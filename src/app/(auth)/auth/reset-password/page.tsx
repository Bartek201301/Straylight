'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { UpdatePasswordData, AuthErrorType } from '@/lib/supabase';
function ResetPasswordForm() {
  const router = useRouter();
  const _searchParams = useSearchParams();

  // Form state
  const [formData, setFormData] = useState<UpdatePasswordData>({
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumbers: false,
    hasSpecialChars: false,
  });

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Hasło musi mieć co najmniej 8 znaków';
    } else if (!passwordStrength.hasUppercase) {
      newErrors.password = 'Hasło musi zawierać wielką literę';
    } else if (!passwordStrength.hasLowercase) {
      newErrors.password = 'Hasło musi zawierać małą literę';
    } else if (!passwordStrength.hasNumbers) {
      newErrors.password = 'Hasło musi zawierać cyfrę';
    } else if (!passwordStrength.hasSpecialChars) {
      newErrors.password = 'Hasło musi zawierać znak specjalny';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potwierdzenie hasła jest wymagane';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Hasła nie są identyczne';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      console.log('✅ Password updated successfully');
      setMessage(
        'Hasło zostało pomyślnie zmienione. Zostaniesz przekierowany do strony logowania.'
      );
      setIsSuccess(true);

      // Redirect to signin after success
      setTimeout(() => {
        router.push(
          '/auth/signin?message=' +
            encodeURIComponent(
              'Hasło zostało zmienione. Możesz się teraz zalogować.'
            )
        );
      }, 3000);
    } catch (error: any) {
      console.error('❌ Password update error:', error);

      const errorMessages: Record<AuthErrorType, string> = {
        invalid_credentials: 'Nieprawidłowy email lub hasło',
        email_not_confirmed: 'Email nie został potwierdzony',
        too_many_requests: 'Za dużo prób. Spróbuj ponownie za chwilę.',
        signup_disabled: 'Rejestracja jest wyłączona',
        invalid_request: 'Nieprawidłowe żądanie',
        unauthorized: 'Sesja wygasła. Spróbuj zresetować hasło ponownie.',
        email_already_exists: 'Ten email jest już zarejestrowany',
        weak_password: 'Hasło jest za słabe',
        invalid_email: 'Nieprawidłowy format email',
        network_error: 'Błąd sieci. Sprawdź połączenie internetowe.',
        unknown_error: 'Nieznany błąd',
      };

      const errorMessage =
        errorMessages[error.message as AuthErrorType] ||
        `Błąd zmiany hasła: ${error.message}`;

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check password strength for password field
    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Check if user has valid reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setIsValidSession(false);
          return;
        }

        // Check if this is a password recovery session
        const accessToken = session.access_token;
        if (accessToken) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      }
    };

    checkSession();
  }, []);

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-black/60 dark:text-neutral-400">
            Sprawdzanie sesji...
          </p>
        </div>
      </div>
    );
  }

  // Show error if invalid session
  if (!isValidSession) {
    return (
      <div
        className={`min-h-screen grid place-items-center px-4 py-8 ${'bg-black'}`}
      >
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-4">
            <img
              src="/logo transparent.png"
              alt="StrayLight Logo"
              className="h-24 md:h-28 w-auto"
            />
            <h1
              className={`text-3xl font-extrabold tracking-tight mt-0 ${'text-white'}`}
            >
              Nieprawidłowy link
            </h1>
          </div>

          <div
            className={`rounded-2xl border backdrop-blur-md shadow-xl ${'border-neutral-800 bg-neutral-900/60'}`}
          >
            <div className="px-8 pt-6 pb-10">
              <div className="mb-6 rounded-md border border-error-600 bg-error-950/30 p-4">
                <p className="text-sm text-error-400">
                  Link resetowania hasła jest nieprawidłowy lub wygasł. Spróbuj
                  zresetować hasło ponownie.
                </p>
              </div>

              <div className="text-center">
                <a
                  href="/auth/forgot-password"
                  className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${'bg-white text-neutral-900 hover:bg-neutral-100'}`}
                >
                  Resetuj hasło ponownie
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen grid place-items-center px-4 py-8 ${'bg-black'}`}
    >
      <div className="w-full max-w-md">
        {/* Outside header (logo + title) */}
        <div className="flex flex-col items-center mb-1">
          <img
            src="/logo transparent.png"
            alt="StrayLight Logo"
            className="h-24 md:h-28 w-auto"
          />
          <h1
            className={`text-3xl font-extrabold tracking-tight mt-0 ${'text-white'}`}
          >
            {isSuccess ? 'Hasło zmienione' : 'Nowe hasło'}
          </h1>
        </div>

        <div
          className={`rounded-2xl border backdrop-blur-md shadow-xl ${'border-neutral-800 bg-neutral-900/60'}`}
        >
          <div className="px-8 pt-2 pb-10">
            {!isSuccess ? (
              <>
                {/* Instructions */}
                <div className="mb-6">
                  <p className={`text-sm text-center ${'text-neutral-400'}`}>
                    Wprowadź nowe hasło dla swojego konta.
                  </p>
                </div>

                {/* Error Message */}
                {errors.general && (
                  <div className="mb-4 rounded-md border border-error-600 bg-error-950/30 p-3">
                    <p className="text-sm text-error-400">{errors.general}</p>
                  </div>
                )}

                {/* Password Form */}
                <form className="space-y-5" onSubmit={handlePasswordUpdate}>
                  <div>
                    <label
                      htmlFor="password"
                      className={`block text-sm font-medium mb-2 ${'text-white'}`}
                    >
                      Nowe hasło
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`input ${errors.password ? 'border-error-500 focus:border-error-500' : ''}`}
                      placeholder="Wprowadź nowe hasło"
                      autoFocus
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.password}
                      </p>
                    )}

                    {/* Password strength indicators */}
                    {formData.password && (
                      <div className="mt-2 space-y-1">
                        <div
                          className={`text-xs flex items-center ${passwordStrength.hasMinLength ? 'text-success-400' : 'text-neutral-500'}`}
                        >
                          <span className="mr-2">
                            {passwordStrength.hasMinLength ? '✓' : '○'}
                          </span>
                          Co najmniej 8 znaków
                        </div>
                        <div
                          className={`text-xs flex items-center ${passwordStrength.hasUppercase ? 'text-success-400' : 'text-neutral-500'}`}
                        >
                          <span className="mr-2">
                            {passwordStrength.hasUppercase ? '✓' : '○'}
                          </span>
                          Wielka litera
                        </div>
                        <div
                          className={`text-xs flex items-center ${passwordStrength.hasLowercase ? 'text-success-400' : 'text-neutral-500'}`}
                        >
                          <span className="mr-2">
                            {passwordStrength.hasLowercase ? '✓' : '○'}
                          </span>
                          Mała litera
                        </div>
                        <div
                          className={`text-xs flex items-center ${passwordStrength.hasNumbers ? 'text-success-400' : 'text-neutral-500'}`}
                        >
                          <span className="mr-2">
                            {passwordStrength.hasNumbers ? '✓' : '○'}
                          </span>
                          Cyfra
                        </div>
                        <div
                          className={`text-xs flex items-center ${passwordStrength.hasSpecialChars ? 'text-success-400' : 'text-neutral-500'}`}
                        >
                          <span className="mr-2">
                            {passwordStrength.hasSpecialChars ? '✓' : '○'}
                          </span>
                          Znak specjalny
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className={`block text-sm font-medium mb-2 ${'text-white'}`}
                    >
                      Potwierdź hasło
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`input ${errors.confirmPassword ? 'border-error-500 focus:border-error-500' : ''}`}
                      placeholder="Potwierdź nowe hasło"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-11 inline-flex items-center justify-center gap-2 rounded-md border font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 focus:ring-offset-neutral-900'}`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-neutral-900"
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
                        Zmienianie hasła...
                      </>
                    ) : (
                      'Zmień hasło'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="mb-6 rounded-md border border-success-600 bg-success-950/30 p-4">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-success-400 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-success-400">{message}</p>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href="/auth/signin"
                    className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${'bg-white text-neutral-900 hover:bg-neutral-100'}`}
                  >
                    Przejdź do logowania
                  </a>
                </div>
              </>
            )}

            {/* Bottom links */}
            <div className={`mt-8 text-center text-sm ${'text-neutral-400'}`}>
              {/* Back to Home */}
              <div className="text-center">
                <a
                  href="/"
                  className={`font-medium transition-colors ${'text-neutral-400 hover:text-neutral-300'}`}
                >
                  ← Powrót do strony głównej
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
