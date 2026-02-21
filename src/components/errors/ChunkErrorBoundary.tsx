'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for handling chunk loading errors
 * and other component failures that can cause app crashes
 */
export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk loading error
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Loading CSS chunk') ||
      error.message?.includes('ChunkLoadError');

    if (isChunkError) {
      console.error(
        '🚨 ChunkErrorBoundary: Chunk loading error detected:',
        error
      );
      // Optionally reload the page for chunk errors
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }

    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ChunkErrorBoundary: Error caught:', error, errorInfo);

    // Report to error monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 text-neutral-300">
          <div className="text-center space-y-4 p-8 max-w-md">
            <div className="text-6xl">🔧</div>
            <h1 className="text-2xl font-bold text-neutral-100">
              Loading Error
            </h1>
            <p className="text-neutral-400">
              We are experiencing a temporary loading issue. The page will
              refresh automatically.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <p className="text-sm text-neutral-500">
                If this continues, try clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
