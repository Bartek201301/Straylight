'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function AccessDeniedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resendVerificationEmail } = useAuth();

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const reason = searchParams.get('reason') || 'unknown';
  const requiredRoles = searchParams.get('required')?.split(',') || [];
  const currentRole = searchParams.get('current') || 'none';

  // Get user-friendly messages based on reason
  const getErrorDetails = () => {
    switch (reason) {
      case 'insufficient_role':
        return {
          title: 'Niewystarczające uprawnienia',
          message: `Ta strona wymaga jednej z następujących ról: ${requiredRoles.join(', ')}`,
          detail: `Twoja aktualna rola: ${currentRole}`,
          icon: '👑',
          suggestions: [
            'Skontaktuj się z administratorem w celu przydzielenia odpowiednich uprawnień',
            'Sprawdź czy jesteś zalogowany na właściwe konto',
            'Jeśli uważasz, że to błąd, zgłoś problem do administratora',
          ],
        };

      case 'email_not_verified':
        return {
          title: 'Email nie został potwierdzony',
          message: 'Ta strona wymaga potwierdzenia adresu email',
          detail:
            'Sprawdź swoją skrzynkę odbiorczą i kliknij link weryfikacyjny',
          icon: '📧',
          suggestions: [
            'Sprawdź folder spam/junk w swojej skrzynce email',
            'Kliknij przycisk poniżej aby wysłać email ponownie',
            'Skontaktuj się z pomocą techniczną jeśli problem się powtarza',
          ],
        };

      case 'session_expired':
        return {
          title: 'Sesja wygasła',
          message: 'Twoja sesja logowania wygasła',
          detail:
            'Ze względów bezpieczeństwa zostałeś automatycznie wylogowany',
          icon: '⏰',
          suggestions: [
            'Zaloguj się ponownie aby kontynuować',
            'Upewnij się, że masz stabilne połączenie internetowe',
            'Rozważ włączenie opcji "Zapamiętaj mnie" przy następnym logowaniu',
          ],
        };

      default:
        return {
          title: 'Brak dostępu',
          message: 'Nie masz uprawnień do wyświetlenia tej strony',
          detail: 'Skontaktuj się z administratorem jeśli uważasz, że to błąd',
          icon: '🚫',
          suggestions: [
            'Upewnij się, że jesteś zalogowany na właściwe konto',
            'Sprawdź czy masz odpowiednie uprawnienia',
            'Skontaktuj się z administratorem w sprawie dostępu',
          ],
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const { error } = await resendVerificationEmail();

      if (error) {
        // Handle error - could show toast or alert
        alert(`Błąd: ${error.message}`);
      } else {
        setResendSuccess(true);
        // Redirect to verify email page after successful resend
        setTimeout(() => {
          router.push('/auth/verify-email');
        }, 2000);
      }
    } catch (error) {
      alert('Wystąpił nieoczekiwany błąd');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-base py-8 px-4 sm:px-10">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100 mb-6">
            <span className="text-3xl">{errorDetails.icon}</span>
          </div>

          {/* Title */}
          <h2 className="text-center text-2xl font-bold mb-2">
            {errorDetails.title}
          </h2>

          {/* Message */}
          <p className="text-center text-neutral-400 mb-2">
            {errorDetails.message}
          </p>

          {/* Detail */}
          {errorDetails.detail && (
            <p className="text-center text-sm text-neutral-500 mb-6">
              {errorDetails.detail}
            </p>
          )}

          {/* Suggestions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-300 mb-2">
              Co możesz zrobić:
            </h3>
            <ul className="text-sm text-neutral-400 space-y-1">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-500 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {reason === 'email_not_verified' && (
              <div className="space-y-2">
                {resendSuccess ? (
                  <div className="p-3 card-base border-l-4 border-success-500">
                    <p className="text-sm text-success-500 text-center">
                      ✅ Email wysłany ponownie! Sprawdź swoją skrzynkę
                      pocztową.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Wysyłanie...
                      </>
                    ) : (
                      '📧 Wyślij email weryfikacyjny ponownie'
                    )}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/auth/signin')}
              className="btn-success w-full"
            >
              🔐 Zaloguj się
            </button>

            <button onClick={handleGoBack} className="btn-secondary w-full">
              ← Wróć
            </button>

            <button
              onClick={() => router.push('/')}
              className="btn-secondary w-full"
            >
              🏠 Strona główna
            </button>
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-xs">
              <summary className="cursor-pointer text-neutral-400 hover:text-neutral-300">
                🔍 Debug Info
              </summary>
              <div className="mt-2 p-2 card-base text-neutral-400">
                <pre>
                  {JSON.stringify(
                    {
                      reason,
                      requiredRoles,
                      currentRole,
                      searchParams: Object.fromEntries(searchParams.entries()),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-neutral-400">Ładowanie...</p>
          </div>
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
