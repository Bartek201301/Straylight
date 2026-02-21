'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ContentGateOverlayProps {
  /** Title for the CTA */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom className for the overlay container */
  className?: string;
  /** Show signup CTA (default: true) */
  showSignup?: boolean;
  /** Custom CTA button text */
  ctaText?: string;
  /** Variant: 'gradient' (fade from transparent to solid) or 'blur' (backdrop blur) */
  variant?: 'gradient' | 'blur';
}

/**
 * ContentGateOverlay - A reusable overlay component that encourages users to sign in
 * Used to gate premium content for unauthenticated users
 *
 * Features:
 * - Gradient or blur overlay effect
 * - Centered CTA with sign-in/sign-up buttons
 * - Fully responsive and dark-mode optimized
 * - Prevents scrolling past the gate
 */
export default function ContentGateOverlay({
  title = 'Zaloguj się, aby czytać dalej',
  description = 'Utwórz darmowe konto, aby uzyskać dostęp do pełnego artykułu i całej biblioteki treści.',
  className,
  showSignup = true,
  ctaText = 'Zaloguj się',
  variant = 'gradient',
}: ContentGateOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-0 top-[30%] z-40 flex items-center justify-center',
        {
          // Gradient variant - fade from transparent to solid black
          'bg-gradient-to-b from-transparent via-black/80 to-black':
            variant === 'gradient',
          // Blur variant - backdrop blur with semi-transparent overlay
          'backdrop-blur-md bg-black/60': variant === 'blur',
        },
        className
      )}
      role="dialog"
      aria-labelledby="content-gate-title"
      aria-describedby="content-gate-description"
    >
      <div className="px-6 py-8 max-w-md mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="content-gate-title"
          className="text-2xl sm:text-3xl font-bold font-inter text-white"
        >
          {title}
        </h2>

        {/* Description */}
        <p
          id="content-gate-description"
          className="text-white/70 font-source leading-relaxed text-sm sm:text-base"
        >
          {description}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/auth/signin"
            className="flex-1 px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-center"
          >
            {ctaText}
          </Link>
          {showSignup && (
            <Link
              href="/auth/signup"
              className="flex-1 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold hover:scale-105 text-center backdrop-blur-sm"
            >
              Zarejestruj się za darmo
            </Link>
          )}
        </div>

        {/* Additional Info */}
        <p className="text-xs text-white/50 pt-2">
          Dołącz do tysięcy profesjonalistów nawigujących w przyszłości pracy
          napędzanej AI
        </p>
      </div>
    </div>
  );
}
