'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth, useUserProfile } from '@/contexts/AuthContext';
import ProfileImageUpload from './ProfileImageUpload';

interface UsernameAvailability {
  available: boolean | null;
  handle?: string;
  error?: string;
}

export default function ProfileForm() {
  const { user, refreshUserProfile } = useAuth();
  const profile = useUserProfile();
  const [formData, setFormData] = useState({
    handle: profile.handle || '',
    display_name: profile.profile?.display_name || '',
    bio: profile.profile?.bio || '',
    website: profile.profile?.website || '',
    location: profile.profile?.location || '',
    avatar_url: profile.profile?.avatar_url || '',
    social_links: {
      twitter: profile.profile?.social_links?.twitter || '',
      linkedin: profile.profile?.social_links?.linkedin || '',
      github: profile.profile?.social_links?.github || '',
      instagram: profile.profile?.social_links?.instagram || '',
      youtube: profile.profile?.social_links?.youtube || '',
      discord: profile.profile?.social_links?.discord || '',
    },
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [usernameAvailability, setUsernameAvailability] =
    useState<UsernameAvailability | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Check username availability in real-time
  const checkUsernameAvailability = useCallback(
    async (handle: string) => {
      if (!handle || handle === profile.handle || handle.length < 3) {
        setUsernameAvailability(null);
        return;
      }

      setCheckingUsername(true);

      try {
        const response = await fetch(
          `/api/profile/update?handle=${encodeURIComponent(handle)}&userId=${user?.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setUsernameAvailability(data);
        }
      } catch (error) {
        console.error('Error checking username availability:', error);
        setUsernameAvailability({
          available: false,
          error: 'Failed to check availability',
        });
      } finally {
        setCheckingUsername(false);
      }
    },
    [profile.handle, user?.id]
  );

  // Debounced username availability check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.handle && formData.handle !== profile.handle) {
        checkUsernameAvailability(formData.handle);
      } else {
        setUsernameAvailability(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.handle, profile.handle, checkUsernameAvailability]);

  // Auto-dismiss success message after 4 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Username validation
    if (formData.handle) {
      if (!/^[a-zA-Z0-9_-]+$/.test(formData.handle)) {
        newErrors.handle =
          'Username can only contain letters, numbers, underscores, and hyphens';
      } else if (formData.handle.length < 3 || formData.handle.length > 20) {
        newErrors.handle = 'Username must be between 3 and 20 characters';
      } else if (
        usernameAvailability &&
        usernameAvailability.available === false
      ) {
        newErrors.handle =
          usernameAvailability.error || 'Username is not available';
      }
    }

    // Display name validation
    if (formData.display_name && formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be 100 characters or less';
    }

    // Bio validation
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    // Website validation
    if (formData.website) {
      const websiteRegex =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!websiteRegex.test(formData.website)) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    // Location validation
    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location must be 100 characters or less';
    }

    // Social links validation
    Object.entries(formData.social_links).forEach(([platform, url]) => {
      if (url && url.trim()) {
        const urlRegex =
          /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlRegex.test(url.trim())) {
          newErrors[`social_${platform}`] =
            `Please enter a valid ${platform} URL`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if there are any changes
    const hasChanges =
      formData.handle !== profile.handle ||
      formData.display_name !== (profile.profile?.display_name || '') ||
      formData.bio !== (profile.profile?.bio || '') ||
      formData.website !== (profile.profile?.website || '') ||
      formData.location !== (profile.profile?.location || '') ||
      formData.avatar_url !== (profile.profile?.avatar_url || '') ||
      JSON.stringify(formData.social_links) !==
        JSON.stringify({
          twitter: profile.profile?.social_links?.twitter || '',
          linkedin: profile.profile?.social_links?.linkedin || '',
          github: profile.profile?.social_links?.github || '',
          instagram: profile.profile?.social_links?.instagram || '',
          youtube: profile.profile?.social_links?.youtube || '',
          discord: profile.profile?.social_links?.discord || '',
        });

    if (!hasChanges) {
      setMessage('No changes to save');
      return;
    }

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const requestBody: any = {
        userId: user?.id,
      };

      // Add all changed fields
      if (formData.handle !== profile.handle) {
        requestBody.handle = formData.handle;
      }
      if (formData.display_name !== (profile.profile?.display_name || '')) {
        requestBody.display_name = formData.display_name || null;
      }
      if (formData.bio !== (profile.profile?.bio || '')) {
        requestBody.bio = formData.bio || null;
      }
      if (formData.website !== (profile.profile?.website || '')) {
        requestBody.website = formData.website || null;
      }
      if (formData.location !== (profile.profile?.location || '')) {
        requestBody.location = formData.location || null;
      }
      if (formData.avatar_url !== (profile.profile?.avatar_url || '')) {
        requestBody.avatar_url = formData.avatar_url || null;
      }

      // Clean and add social links
      const cleanSocialLinks: any = {};
      Object.entries(formData.social_links).forEach(([platform, url]) => {
        if (url && url.trim()) {
          cleanSocialLinks[platform] = url.trim();
        }
      });

      if (
        JSON.stringify(cleanSocialLinks) !==
        JSON.stringify(profile.profile?.social_links || {})
      ) {
        requestBody.social_links = cleanSocialLinks;
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully!');

        // Refresh user profile to get updated data
        await refreshUserProfile();

        // Reset username availability check
        setUsernameAvailability(null);
      } else {
        setErrors({ general: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('social_')) {
      // Handle social links
      const platform = name.replace('social_', '');
      setFormData((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [platform]: value,
        },
      }));
    } else {
      // Handle regular fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear general errors when user starts typing
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
    }
  };

  // Get username status icon and color
  const getUsernameStatus = () => {
    if (checkingUsername) {
      return { icon: '⏳', color: 'text-neutral-400' };
    }
    if (usernameAvailability) {
      return usernameAvailability.available === true
        ? { icon: '✅', color: 'text-green-600' }
        : { icon: '❌', color: 'text-red-600' };
    }
    return null;
  };

  const usernameStatus = getUsernameStatus();

  return (
    <div className="space-y-6">
      {/* General Error */}
      {errors.general && (
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-white font-medium">Error</p>
              <p className="text-white/80 text-sm mt-1">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400">
            Profile Picture
          </label>
          <ProfileImageUpload
            currentAvatarUrl={formData.avatar_url}
            onImageUploaded={(imageUrl) => {
              setFormData((prev) => ({ ...prev, avatar_url: imageUrl }));
            }}
            className="mb-4"
          />
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="handle"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400"
          >
            Username
          </label>
          <div className="relative">
            <input
              id="handle"
              name="handle"
              type="text"
              value={formData.handle}
              onChange={handleChange}
              disabled={isLoading}
              className={`input pr-10 ${
                errors.handle
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-300 focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-500'
              }`}
              placeholder="Enter your username"
            />
            {usernameStatus && (
              <div
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${usernameStatus.color}`}
              >
                {usernameStatus.icon}
              </div>
            )}
          </div>
          {errors.handle && (
            <p className="mt-1 text-sm text-red-400">{errors.handle}</p>
          )}
          {usernameAvailability && usernameAvailability.available === true && (
            <p className="mt-1 text-sm text-green-400">
              Username is available!
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Username can only contain letters, numbers, underscores, and hyphens
            (3-20 characters)
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label
            htmlFor="display_name"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400"
          >
            Display Name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            value={formData.display_name}
            onChange={handleChange}
            disabled={isLoading}
            className={`input ${
              errors.display_name
                ? 'border-red-500 focus:border-red-400'
                : 'border-neutral-300 focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-500'
            }`}
            placeholder="Your full name"
            maxLength={100}
          />
          {errors.display_name && (
            <p className="mt-1 text-sm text-red-400">{errors.display_name}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Your full name (optional, max 100 characters)
          </p>
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={formData.bio}
            onChange={handleChange}
            disabled={isLoading}
            className={`input resize-none ${
              errors.bio
                ? 'border-red-500 focus:border-red-400'
                : 'border-neutral-300 focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-500'
            }`}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400"
          >
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            disabled={isLoading}
            className={`input ${
              errors.website
                ? 'border-red-500 focus:border-red-400'
                : 'border-neutral-300 focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-500'
            }`}
            placeholder="https://yourwebsite.com"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-400">{errors.website}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Your personal website or portfolio (optional)
          </p>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400"
          >
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            disabled={isLoading}
            className={`input ${
              errors.location
                ? 'border-red-500 focus:border-red-400'
                : 'border-neutral-300 focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-500'
            }`}
            placeholder="City, Country"
            maxLength={100}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-400">{errors.location}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            Where you&apos;re located (optional)
          </p>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-lg font-medium mb-4 text-neutral-800 dark:text-neutral-200">
            Social Links
          </h3>
          <div className="space-y-4">
            {Object.entries(formData.social_links).map(([platform, value]) => (
              <div key={platform}>
                <label
                  htmlFor={`social_${platform}`}
                  className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-400 capitalize"
                >
                  {platform === 'linkedin'
                    ? 'LinkedIn'
                    : platform === 'github'
                      ? 'GitHub'
                      : platform === 'youtube'
                        ? 'YouTube'
                        : platform === 'twitter'
                          ? 'X'
                          : platform.charAt(0).toUpperCase() +
                            platform.slice(1)}
                </label>
                <input
                  id={`social_${platform}`}
                  name={`social_${platform}`}
                  type="url"
                  value={value}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`input ${
                    errors[`social_${platform}`]
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-300 focus:border-neutral-500 dark:border-neutral-600 dark:focus:border-neutral-500'
                  }`}
                  placeholder={`https://${
                    platform === 'linkedin'
                      ? 'linkedin.com/in/'
                      : platform === 'github'
                        ? 'github.com/'
                        : platform === 'twitter'
                          ? 'x.com/'
                          : platform === 'instagram'
                            ? 'instagram.com/'
                            : platform === 'youtube'
                              ? 'youtube.com/c/'
                              : platform === 'discord'
                                ? 'discord.gg/'
                                : `${platform}.com/`
                  }yourusername`}
                />
                {errors[`social_${platform}`] && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors[`social_${platform}`]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Add your social media profiles (all optional)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end items-center gap-4">
          {/* Success Message */}
          {message && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-green-400 font-medium text-sm">
                {message}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              checkingUsername ||
              usernameAvailability?.available === false
            }
            className="px-6 py-3 bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-800 dark:border border-neutral-600 text-white rounded-2xl dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Updating Profile...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
