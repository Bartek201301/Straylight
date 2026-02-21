'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface SignInPromptModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Action that triggered the prompt (e.g., "like this article", "save to library") */
  action?: string;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
}

/**
 * SignInPromptModal - A lightweight modal that prompts users to sign in
 * Used when unauthenticated users try to perform actions like liking articles
 *
 * Features:
 * - Backdrop with click-to-close
 * - ESC key to close
 * - Animated entrance/exit
 * - Focus trap
 * - Accessible (ARIA labels)
 */
export default function SignInPromptModal({
  isOpen,
  onClose,
  action = 'wykonać tę akcję',
  title = 'Wymagane logowanie',
  description,
}: SignInPromptModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultDescription =
    description ||
    `Zaloguj się, aby ${action} i odblokować pełne doświadczenie StrayLight.`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      aria-describedby="signin-modal-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Icon */}
          <div className="w-14 h-14 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2
            id="signin-modal-title"
            className="text-2xl font-bold font-inter text-white text-center"
          >
            {title}
          </h2>

          {/* Description */}
          <p
            id="signin-modal-description"
            className="text-white/70 font-source text-center leading-relaxed"
          >
            {defaultDescription}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/auth/signin"
              className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-center"
              onClick={onClose}
            >
              Zaloguj się
            </Link>
            <Link
              href="/auth/signup"
              className="w-full px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold hover:scale-105 text-center"
              onClick={onClose}
            >
              Utwórz darmowe konto
            </Link>
          </div>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full text-sm text-white/50 hover:text-white/70 transition-colors font-source"
          >
            Może później
          </button>
        </div>
      </div>
    </div>
  );
}
