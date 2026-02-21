'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useImageUpload, type UploadedImage } from '@/hooks/useImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import DraggableCircularCropper from './DraggableCircularCropper';

interface ProfileImageUploadProps {
  currentAvatarUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  className?: string;
}

export default function ProfileImageUpload({
  currentAvatarUrl,
  onImageUploaded,
  className = '',
}: ProfileImageUploadProps) {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Portal container management
  useEffect(() => {
    // Create portal container when component mounts
    const container = document.createElement('div');
    container.id = 'cropper-modal-portal';
    container.style.position = 'relative';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      // Cleanup portal container when component unmounts
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Initialize image upload hook
  const { uploadFile, isUploading, progress, error, fileInputRef, reset } =
    useImageUpload({
      userId: user?.id || '',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      onSuccess: (image: UploadedImage) => {
        onImageUploaded(image.url);
        setShowUrlInput(false);
        setUrlInput('');
      },
      onError: (error: string) => {
        console.error('Upload error:', error);
      },
    });

  // Show cropper with selected image
  const showImageCropper = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl) {
        console.log('File converted to data URL, length:', imageUrl.length);
        setImageToCrop(imageUrl);
        setShowCropper(true);
      }
    };
    reader.onerror = () => {
      console.error('Failed to read file');
    };
    console.log('Converting file to data URL:', file.name, file.size);
    reader.readAsDataURL(file);
  }, []);

  // Handle cropped image
  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      const croppedFile = new File([croppedBlob], 'cropped-avatar.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload the cropped file
      await uploadFile(croppedFile);
      setShowCropper(false);
      setImageToCrop('');
    },
    [uploadFile]
  );

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setImageToCrop('');
  }, []);

  // Custom file select handler with cropping
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        const file = files[0];
        showImageCropper(file);
      }

      // Reset input value to allow re-uploading same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [showImageCropper, fileInputRef]
  );

  // Custom drop handler with cropping
  const handleDropWrapper = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        const file = imageFiles[0];
        showImageCropper(file);
      }
    },
    [showImageCropper]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith('image/'));

      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          showImageCropper(file);
        }
      }
    },
    [showImageCropper]
  );

  // Handle URL input submission
  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      // Validate URL format
      try {
        new URL(urlInput.trim());
        onImageUploaded(urlInput.trim());
        setUrlInput('');
        setShowUrlInput(false);
      } catch {
        // Handle invalid URL
        console.error('Invalid URL format');
      }
    }
  }, [urlInput, onImageUploaded]);

  // Handle remove avatar
  const handleRemoveAvatar = useCallback(() => {
    onImageUploaded('');
    reset();
  }, [onImageUploaded, reset]);

  // Get display name for avatar fallback
  const getInitials = useCallback(() => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  }, [user]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-200 ${
            dragActive
              ? 'border-white/40 bg-white/10'
              : 'border-neutral-300 dark:border-neutral-600'
          } ${isUploading ? 'opacity-50' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDropWrapper}
          onPaste={handlePaste}
          tabIndex={0}
          role="button"
          aria-label="Upload profile picture"
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Profile picture"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {getInitials()}
              </span>
            </div>
          )}

          {/* Upload Progress Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-white text-sm font-medium">
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {/* Drag Overlay */}
          {dragActive && !isUploading && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white text-center">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm font-medium">Drop image here</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-800 dark:border border-neutral-600 text-white rounded-2xl dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </button>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={isUploading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium backdrop-blur-sm border border-white/20"
          >
            Use URL
          </button>

          {currentAvatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              className="px-4 py-2 bg-white/10 hover:bg-red-500/20 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium backdrop-blur-sm border border-red-500/30 hover:border-red-500/50"
            >
              Remove
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
          <p>Drag & drop, paste (Ctrl+V), or click to upload</p>
          <p>Images will open in crop editor • Max 5MB • JPEG, PNG, WebP</p>
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-2xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-800 dark:border border-neutral-600 text-white rounded-2xl dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-white/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
          <p className="text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple={false}
      />

      {/* Image Cropper Modal - Rendered via Portal */}
      {showCropper &&
        portalContainer &&
        ReactDOM.createPortal(
          <DraggableCircularCropper
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />,
          portalContainer
        )}
    </div>
  );
}
