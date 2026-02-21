'use client';

import React, { useState, useEffect } from 'react';
import ArticleToc from '@/components/articles/ArticleToc';

export default function ArticleTocOverlay() {
  const [open, setOpen] = useState(false);

  // Handle closing overlay
  const closeOverlay = () => setOpen(false);
  const toggleOverlay = () => setOpen(!open);

  // Close on escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOverlay();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  return (
    <>
      {/* Toggle button visible only on mobile */}
      <div className="fixed top-20 right-4 z-50 lg:hidden">
        <button
          onClick={toggleOverlay}
          className="backdrop-blur-sm border rounded-lg p-3 transition-all shadow-lg bg-black/80 border-white/20 text-white hover:bg-white/10"
          aria-label={open ? 'Zamknij spis treści' : 'Otwórz spis treści'}
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden bg-black/80"
          onClick={closeOverlay}
        >
          <div
            className="fixed top-20 right-4 left-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={closeOverlay}
                className="transition-colors text-white/60 hover:text-white"
                aria-label="Zamknij spis treści"
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
            </div>
            <ArticleToc onItemClick={closeOverlay} />
          </div>
        </div>
      )}
    </>
  );
}
