'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { PasswordResetData, AuthErrorType } from '@/lib/supabase';
function ForgotPasswordForm() {
  const _router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [formData, setFormData] = useState<PasswordResetData>({
    email: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // URL parameters
  const emailParam = searchParams.get('email');

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email ma nieprawidłowy format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle password reset request
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      console.log('✅ Password reset email sent to:', formData.email);
      setMessage(
        'Instrukcje resetowania hasła zostały wysłane na Twój adres email. Sprawdź skrzynkę odbiorczą i folder spam.'
      );
      setIsSuccess(true);
    } catch (error: any) {
      console.error('❌ Password reset error:', error);

      const errorMessages: Record<AuthErrorType, string> = {
        invalid_credentials: 'Nieprawidłowy email lub hasło',
        email_not_confirmed: 'Email nie został potwierdzony',
        too_many_requests:
          'Za dużo prób resetowania hasła. Spróbuj ponownie za chwilę.',
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
        `Błąd resetowania hasła: ${error.message}`;

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

    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Pre-fill email from URL params
  useEffect(() => {
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [emailParam]);

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
            {isSuccess ? 'Email wysłany' : 'Resetuj hasło'}
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
                    Wprowadź swój adres email, a wyślemy Ci instrukcje
                    resetowania hasła.
                  </p>
                </div>

                {/* Error Message */}
                {errors.general && (
                  <div className="mb-4 rounded-md border border-error-600 bg-error-950/30 p-3">
                    <p className="text-sm text-error-400">{errors.general}</p>
                  </div>
                )}

                {/* Email Form */}
                <form className="space-y-5" onSubmit={handlePasswordReset}>
                  <div>
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
                      placeholder="Wprowadź swój email"
                      autoFocus
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.email}
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
                        Wysyłanie...
                      </>
                    ) : (
                      'Wyślij instrukcje resetowania'
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

                <div className={`text-sm ${'text-neutral-400'}`}>
                  <p className="mb-4">
                    Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj
                    ponownie za kilka minut.
                  </p>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setMessage('');
                      setFormData({ email: '' });
                    }}
                    className={`text-sm ${'text-primary-400 hover:text-primary-300'}`}
                  >
                    Spróbuj ponownie
                  </button>
                </div>
              </>
            )}

            {/* Bottom links */}
            <div className={`mt-8 text-center text-sm ${'text-neutral-400'}`}>
              <p className="mb-4">
                Pamiętasz hasło?{' '}
                <a
                  href="/auth/signin"
                  className={`${'text-primary-400 hover:text-primary-300'}`}
                >
                  Zaloguj się
                </a>
              </p>

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

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </Suspense>
  );
}
