'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import HomeFeed from './_components/HomeFeed';
import AuthLoadingSpinner from '@/components/ui/AuthLoadingSpinner';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingSpinner message="Loading your personalized feed..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-white flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-inter text-white">
            Access Required
          </h1>
          <p className="text-white/70 font-source leading-relaxed">
            Sign in to access your personalized home feed with featured
            articles, AI tools, and curated content tailored to your interests.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            Sign In to Continue
          </Link>
          <p className="text-sm text-white/50">
            New to StrayLight?{' '}
            <Link href="/auth/signup" className="text-white hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <HomeFeed />;
}
