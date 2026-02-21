'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setShowBanner(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    // Enable GA4 tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowBanner(false);
    // Disable GA4 tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black border border-white/20 shadow-2xl p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-semibold text-lg">
                Pliki Cookies
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Używamy plików cookies, aby poprawić Twoje doświadczenia na
                naszej stronie. Cookies techniczne są niezbędne do działania
                serwisu, cookies analityczne pomagają nam ulepszać stronę.
              </p>
              <Link
                href="/cookies"
                className="text-white/60 hover:text-white text-xs underline inline-block"
              >
                Zobacz szczegóły w Polityce Cookies
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-6 py-3 bg-transparent border border-white/30 text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium"
              >
                Odrzuć cookies analityczne
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-6 py-3 bg-white text-black hover:bg-white/90 transition-all duration-200 text-sm font-medium"
              >
                Akceptuj wszystkie cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
