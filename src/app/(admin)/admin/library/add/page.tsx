'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LibraryItemForm from '@/app/(admin)/admin/_components/library/LibraryItemForm';

export default function AddLibraryItemPage() {
  return (
    <ProtectedRoute requireAuth={true} requireRole="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <a
                href="/admin/dashboard"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Admin Dashboard
              </a>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add Library Item
            </h1>
            <p className="mt-2 text-gray-600">
              Add a new book or AI tool to the affiliate library
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <LibraryItemForm />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
