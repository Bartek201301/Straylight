'use client';

import React, { useState, useCallback } from 'react';
import { useImageUpload, UploadedImage } from '@/hooks/useImageUpload';

interface LibraryImageUploadProps {
  userId: string;
  onImageChange: (_imageUrl: string | null) => void;
  currentImageUrl?: string | null;
  className?: string;
}

export default function LibraryImageUpload({
  userId,
  onImageChange,
  currentImageUrl,
  className = '',
}: LibraryImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

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
    documentId: 'library', // Group library images together
    onSuccess: (image: UploadedImage) => {
      console.log('Library image uploaded successfully:', image);
      onImageChange(image.url);
    },
    onError: (error: string) => {
      console.error('Library image upload error:', error);
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

  // Remove image
  const removeImage = useCallback(() => {
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
    <div className={`space-y-3 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Display or Upload Area */}
      {displayImageUrl ? (
        // Image Preview
        <div className="relative border border-gray-300 rounded-md overflow-hidden bg-gray-50">
          <div className="relative aspect-video bg-gray-100">
            <img
              src={displayImageUrl}
              alt="Library item preview"
              className="w-full h-full object-cover"
            />

            {/* Action Buttons Overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 group">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded shadow-sm transition-colors"
                  title="Change image"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                  type="button"
                  onClick={removeImage}
                  className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded shadow-sm transition-colors"
                  title="Remove image"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium">
                    Uploading... {progress}%
                  </p>
                  <div className="mt-2 w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
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
          <div className="px-3 py-2 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Image</span>
              {uploadedImages[0] && (
                <span>{formatFileSize(uploadedImages[0].size)}</span>
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
            relative border-2 border-dashed rounded-md p-6 transition-all duration-200 cursor-pointer
            ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : ''}
          `}
        >
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Uploading image...
                  </p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1 text-gray-600">{progress}%</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  {isDragOver ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-blue-500"
                    >
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-gray-400"
                    >
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
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {isDragOver ? 'Drop image here' : 'Upload an image'}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    {allowedTypes.map((type) => type.split('/')[1]).join(', ')}{' '}
                    • Max: {formatFileSize(maxSize)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="border border-red-200 rounded-md p-3 bg-red-50">
          <div className="flex items-start gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-red-500 mt-0.5 flex-shrink-0"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="15"
                y1="9"
                x2="9"
                y2="15"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="9"
                y1="9"
                x2="15"
                y2="15"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
