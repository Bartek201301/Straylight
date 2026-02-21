'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LibraryImageUpload from './LibraryImageUpload';

interface LibraryItemFormData {
  title: string;
  description: string;
  type:
    | 'book'
    | 'tool'
    | 'course'
    | 'podcast'
    | 'dataset'
    | 'website'
    | 'paper'
    | 'other';
  rating: number;
  affiliate_url: string;
  image_url: string;
  tags: string[];
}

const initialFormData: LibraryItemFormData = {
  title: '',
  description: '',
  type: 'tool',
  rating: 5.0,
  affiliate_url: '',
  image_url: '',
  tags: [],
};

// Helper function to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export default function LibraryItemForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] =
    useState<LibraryItemFormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === 'rating') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle tag addition
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setTagInput('');
    }
  };

  // Handle tag removal
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/affiliate-library', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create library item');
      }

      const _data = await response.json();
      setMessage({
        type: 'success',
        text: 'Library item created successfully!',
      });

      // Reset form
      setFormData(initialFormData);
      setTagInput('');

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating library item:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to create library item',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate form
  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.affiliate_url.trim() &&
      formData.affiliate_url.startsWith('http') &&
      formData.rating >= 1 &&
      formData.rating <= 5
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Item Type Selection */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Item Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="tool">AI Tool</option>
          <option value="book">Book</option>
          <option value="course">Course</option>
          <option value="podcast">Podcast</option>
          <option value="dataset">Dataset</option>
          <option value="website">Website</option>
          <option value="paper">Research Paper</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          maxLength={300}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter the title of the book or tool"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Provide a detailed description of the item"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length}/2000 characters
        </p>
      </div>

      {/* Rating */}
      <div>
        <label
          htmlFor="rating"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Rating * (1.0 - 5.0)
        </label>
        <input
          type="number"
          id="rating"
          name="rating"
          value={formData.rating}
          onChange={handleChange}
          min="1.0"
          max="5.0"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Affiliate URL */}
      <div>
        <label
          htmlFor="affiliate_url"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Affiliate URL *
        </label>
        <input
          type="url"
          id="affiliate_url"
          name="affiliate_url"
          value={formData.affiliate_url}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://example.com/affiliate-link"
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image
        </label>
        {user?.id ? (
          <LibraryImageUpload
            userId={user.id}
            currentImageUrl={formData.image_url}
            onImageChange={(imageUrl) => {
              setFormData((prev) => ({
                ...prev,
                image_url: imageUrl || '',
              }));
            }}
          />
        ) : (
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            <p className="text-sm text-gray-500">
              Please log in to upload images
            </p>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && (e.preventDefault(), addTag())
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.push('/admin/dashboard')}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}
