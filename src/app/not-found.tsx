'use client';

import Link from 'next/link';
import Container from '@/components/layout/Container';

export default function NotFound() {
  return (
    <Container>
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-lg w-full">
          <div className="card-base p-12 text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-white mb-2">404</h1>
              <h2 className="text-2xl font-semibold text-neutral-200 mb-4">
                Page Not Found
              </h2>
              <p className="text-neutral-400 text-lg mb-8">
                Sorry, we could not find the page you are looking for. It might
                have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-neutral-100 text-black font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-dark-800"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go to Homepage
              </Link>

              <button
                onClick={() => window.history.back()}
                className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-dark-800"
              >
                <svg
                  className="w-5 h-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Go Back
              </button>
            </div>

            {/* Helpful Links */}
            <div className="mt-8 pt-6 border-t border-neutral-700">
              <p className="text-sm text-neutral-400 mb-4">
                Looking for something specific? Try these popular pages:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/articles"
                  className="px-3 py-1 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  Articles
                </Link>
                <Link
                  href="/library"
                  className="px-3 py-1 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  Library
                </Link>
                <Link
                  href="/research"
                  className="px-3 py-1 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  Research
                </Link>
                <Link
                  href="/about"
                  className="px-3 py-1 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  About
                </Link>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-400">
                Still cannot find what you are looking for?{' '}
                <Link
                  href="/contact"
                  className="text-white hover:text-neutral-300 hover:underline font-medium"
                >
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
