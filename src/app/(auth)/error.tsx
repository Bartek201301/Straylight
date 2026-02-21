'use client';

import { useEffect } from 'react';
import Container from '@/components/layout/Container';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth section error:', error);
  }, [error]);

  return (
    <Container>
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="max-w-lg w-full">
          <div className="card-base p-12 text-center">
            <div className="mb-8">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Something went wrong!
              </h2>
              <p className="text-neutral-400 mb-6">
                We apologize for the inconvenience. An unexpected error occurred
                while loading this page.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              >
                Try again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              >
                Go to homepage
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-neutral-400 hover:text-neutral-300">
                  Technical Details (Development Only)
                </summary>
                <pre className="mt-2 p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300 overflow-auto">
                  {error.message}
                  {error.stack && (
                    <>
                      {'\n\nStack trace:\n'}
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
