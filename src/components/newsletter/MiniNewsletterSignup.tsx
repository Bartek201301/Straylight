'use client';

import { useState, useEffect } from 'react';
/**
 * MiniNewsletterSignup Component
 *
 * A scaled-down version of the home page newsletter signup that preserves
 * the original visual design language and brand consistency.
 *
 * Key Design Elements from Original:
 * - Pill-shaped container with backdrop blur and subtle white border
 * - Inter font for headings, Source font for body text
 * - White text on semi-transparent backgrounds
 * - Rounded input with email icon
 * - White button with hover/focus states
 * - Loading spinner and success/error states
 */
export function MiniNewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldRender, setShouldRender] = useState(false);

  // Page-specific targeting: Only show on articles, about, and library pages
  useEffect(() => {
    const path = window.location.pathname;
    const targetPaths = ['/articles', '/about', '/library'];

    // Check if current path matches any target pages
    const shouldShow = targetPaths.some(
      (targetPath) => path === targetPath || path.startsWith(targetPath + '/')
    );

    setShouldRender(shouldShow);
  }, []);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Client-side validation
    if (!isValidEmail(email.trim())) {
      setStatus('error');
      setErrorMessage('Proszę podać prawidłowy adres email.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: 'Subscriber',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Nie udało się zapisać do newslettera');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Błąd sieciowy. Spróbuj ponownie.');
    }
  };

  // Don't render if not on target pages
  if (!shouldRender) {
    return null;
  }

  // Success state - matches original design but scaled down
  if (status === 'success') {
    return (
      <div
        className={`backdrop-blur-sm border text-center relative overflow-hidden max-w-2xl mx-auto ${
          false ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
        }`}
        style={{
          borderRadius: '9999px',
          padding: '32px 48px', // Scaled down from 80px 120px
        }}
        role="region"
        aria-label="Newsletter subscription success"
      >
        <div className="relative z-10">
          <div className="text-2xl mb-2" aria-hidden="true">
            🎉
          </div>
          <h3 className={`text-lg font-bold mb-2 font-inter ${'text-white'}`}>
            Gratulacje! Jesteś w naszej społeczności!
          </h3>
          <p className={`font-source text-sm ${'text-white/80'}`}>
            Zostałeś pomyślnie zapisany do newslettera StrayLight. Będziesz
            otrzymywać najnowsze informacje o AI i technologii.
          </p>
        </div>
      </div>
    );
  }

  // Main form - preserves all original styling patterns
  return (
    <div
      className={`backdrop-blur-sm border text-center relative overflow-hidden max-w-2xl mx-auto ${
        false ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'
      }`}
      style={{
        borderRadius: '9999px',
        padding: '32px 48px', // Scaled down from original 80px 120px
      }}
      role="region"
      aria-label="Newsletter subscription"
    >
      <div className="relative z-10">
        {/* Scaled-down heading - preserves font and color hierarchy */}
        <h2
          className={`text-xl md:text-2xl font-bold mb-3 font-inter ${'text-white'}`}
        >
          Otrzymuj najnowsze aktualizacje
        </h2>

        {/* Scaled-down description - matches original typography */}
        <p
          className={`text-sm md:text-base mb-6 max-w-lg mx-auto font-source ${'text-white/80'}`}
        >
          Zapisz się do newslettera, aby być na bieżąco z najnowszymi
          innowacjami ze świata AI i technologii.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Form inputs - maintains responsive flex layout from original */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            {/* Email input - preserves all original styling and accessibility */}
            <div className="flex-1 relative">
              <label htmlFor="mini-newsletter-email" className="sr-only">
                Adres email
              </label>
              <svg
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${'text-white/60'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <input
                id="mini-newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adres email"
                className={`w-full pl-10 pr-3 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all duration-200 font-source text-sm ${
                  false
                    ? 'border-black/20 focus:border-black/40 focus:ring-black/20 text-black bg-black/10 placeholder-black/60'
                    : 'border-white/20 focus:border-white/40 focus:ring-white/20 text-white bg-white/10 placeholder-white/60'
                }`}
                disabled={status === 'loading'}
                required
                aria-describedby={
                  status === 'error' ? 'mini-newsletter-error' : undefined
                }
              />
            </div>

            {/* Submit button - maintains all original styling and states */}
            <button
              type="submit"
              disabled={status === 'loading' || !email.trim()}
              className={`px-6 py-3 font-medium rounded-full transition-all duration-200 hover:scale-105 whitespace-nowrap border font-source disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm ${
                false
                  ? 'bg-black hover:bg-black/90 text-white border-black hover:border-black/80'
                  : 'bg-white hover:bg-white/90 text-black border-white hover:border-white/80'
              }`}
              aria-label={
                status === 'loading'
                  ? 'Zapisywanie do newslettera...'
                  : 'Zapisz się do newslettera'
              }
            >
              {status === 'loading' ? (
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"
                    aria-hidden="true"
                  ></div>
                  <span>Zapisywanie...</span>
                </div>
              ) : (
                'Zapisz się'
              )}
            </button>
          </div>

          {/* Error state - matches original error styling */}
          {status === 'error' && (
            <div
              id="mini-newsletter-error"
              className={`border rounded-lg p-3 text-xs text-center font-source ${
                false
                  ? 'bg-red-500/20 border-red-500/40 text-red-700'
                  : 'bg-red-500/20 border-red-500/40 text-red-300'
              }`}
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}
        </form>

        {/* Privacy notice - scaled down version of original */}
        <p
          className={`text-xs max-w-sm mx-auto leading-relaxed font-source mt-3 ${'text-white/60'}`}
        >
          Akceptuję regulamin Straylight i potwierdzam, że moje informacje będą
          wykorzystywane zgodnie z Polityką Prywatności Straylight.
        </p>
      </div>
    </div>
  );
}

/**
 * Page Detection Utility
 *
 * Determines if the current page should display the mini newsletter signup.
 * Target pages: /articles, /about, /library (and their sub-routes)
 */
const _shouldShowMiniNewsletter = (): boolean => {
  if (typeof window === 'undefined') return false;

  const path = window.location.pathname;
  const targetPaths = ['/articles', '/about', '/library'];

  return targetPaths.some(
    (targetPath) => path === targetPath || path.startsWith(targetPath + '/')
  );
};

/**
 * Usage Documentation:
 *
 * 1. Import the component: import { MiniNewsletterSignup } from '@/components/newsletter/MiniNewsletterSignup'
 *
 * 2. Add to your page/layout:
 *    <MiniNewsletterSignup />
 *
 * 3. The component will automatically:
 *    - Only render on articles, about, and library pages
 *    - Handle form validation and submission
 *    - Display appropriate loading/success/error states
 *    - Maintain full accessibility compliance
 *
 * 4. Styling Dependencies:
 *    - Requires Tailwind CSS classes used in the original design
 *    - Uses font-inter and font-source (should match your existing setup)
 *    - Inherits backdrop-blur and other utilities from your CSS framework
 *
 * 5. API Dependencies:
 *    - Connects to existing /api/newsletter/subscribe endpoint
 *    - Uses same payload format as the home page newsletter
 *
 * 6. Responsive Design:
 *    - Adapts to mobile/tablet/desktop screen sizes
 *    - Maintains proportional scaling across breakpoints
 *    - Preserves touch-friendly interaction areas
 */
