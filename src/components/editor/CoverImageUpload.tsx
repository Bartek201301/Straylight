'use client';

import React, { useState, useCallback } from 'react';
import { useImageUpload, UploadedImage } from '@/hooks/useImageUpload';
import { OptimizedThumbnail } from '@/components/ui/display/OptimizedImage';
import { useTheme } from '@/contexts/ThemeContext';

interface CoverImageUploadProps {
  userId: string;
  documentId?: string;
  currentImageUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  className?: string;
}

export default function CoverImageUpload({
  userId,
  documentId,
  currentImageUrl,
  onImageChange,
  className = '',
}: CoverImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { resolvedTheme } = useTheme();
  const _isDark = resolvedTheme === 'dark';

  const {
    isUploading,
    progress,
    error,
    uploadedImages,
    handleFileSelect,
    handleDrop,
    openFileDialog,
    reset,
    fileInputRef,
    maxSize,
    allowedTypes,
  } = useImageUpload({
    userId,
    documentId,
    onSuccess: (image: UploadedImage) => {
      console.log('Cover image uploaded successfully:', image);
      onImageChange(image.url);
    },
    onError: (error: string) => {
      console.error('Cover image upload error:', error);
    },
    onProgress: (progress: number) => {
      console.log('Cover image upload progress:', progress);
    },
  });

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDropWithState = useCallback(
    (e: React.DragEvent) => {
      handleDrop(e);
      setIsDragOver(false);
    },
    [handleDrop]
  );

  // Remove cover image
  const removeCoverImage = useCallback(() => {
    onImageChange(null);
    reset();
  }, [onImageChange, reset]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const displayImageUrl = currentImageUrl || uploadedImages[0]?.url;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Cover Image Display or Upload Area */}
      {displayImageUrl ? (
        // Cover Image Preview
        <div className="glass-enhanced rounded-2xl overflow-hidden shadow-premium bg-white/5 border-white/10">
          <div className="relative aspect-video bg-gray-100">
            <OptimizedThumbnail
              src={displayImageUrl}
              alt="Article cover image"
              width={800}
              height={450}
              className="w-full h-full object-cover"
            />

            {/* Action Buttons Overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={openFileDialog}
                  className="bg-white/90 hover:bg-white text-black p-2 rounded-full transition-colors shadow-lg"
                  title="Change cover image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={removeCoverImage}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors shadow-lg"
                  title="Remove cover image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line
                      x1="18"
                      y1="6"
                      x2="6"
                      y2="18"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="6"
                      y1="6"
                      x2="18"
                      y2="18"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Upload Progress Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium">
                    Uploading... {progress}%
                  </p>
                  <div className="mt-2 w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image Info */}
          <div className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Cover Image</span>
              {uploadedImages[0] && (
                <span className="text-white/60">
                  {formatFileSize(uploadedImages[0].size)}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Upload Area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropWithState}
          onClick={openFileDialog}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer
            hover-lift micro-interaction glass-enhanced
            ${
              isDragOver
                ? 'border-white/50 bg-white/20 shadow-premium scale-102'
                : 'border-white/30 hover:border-white/40 bg-white/5 hover:bg-white/15'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : 'hover:shadow-premium'}
          `}
        >
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full"></div>
                </div>
                <div>
                  <p className="text-xl font-semibold font-premium mb-2 text-white">
                    Uploading cover image...
                  </p>
                  <div className="mt-3 rounded-full h-3 overflow-hidden shadow-inner bg-white/20 max-w-xs mx-auto">
                    <div
                      className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-white to-white/80"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-base mt-2 font-medium text-white/70">
                    {progress}% complete
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2 micro-interaction bg-white/10 text-white">
                  {isDragOver ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="7,10 12,15 17,10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="12"
                        y1="15"
                        x2="12"
                        y2="3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <path
                        d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold font-premium mb-2 text-white">
                    {isDragOver
                      ? 'Drop your cover image here'
                      : 'Add Cover Image'}
                  </h3>
                  <p className="text-base mb-3 text-white/70">
                    Drag and drop an image here, or click to browse
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-white/60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="m9 12 2 2 4-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      {allowedTypes.join(', ')} • Max: {formatFileSize(maxSize)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border rounded-xl p-4 bg-red-900/20 border-red-800/30">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-lg">❌</span>
            <div>
              <p className="font-medium text-red-200">Upload Error</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
