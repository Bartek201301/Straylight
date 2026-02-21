'use client';

import { useState, useCallback, useRef } from 'react';

interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedImages: UploadedImage[];
}

export interface UploadedImage {
  id: string | null;
  fileName: string;
  originalName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface ImageUploadOptions {
  userId: string;
  documentId?: string;
  maxSize?: number; // in bytes, default 5MB
  allowedTypes?: string[];
  onSuccess?: (_image: UploadedImage) => void;
  onError?: (_error: string) => void;
  onProgress?: (_progress: number) => void;
}

// Default configuration
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export function useImageUpload(options: ImageUploadOptions) {
  const {
    userId,
    documentId,
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onSuccess,
    onError,
    onProgress,
  } = options;

  // State management
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedImages: [],
  });

  // File input ref for programmatic access
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file before upload
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        return `File too large. Maximum size: ${maxSizeMB}MB`;
      }

      // Warn about large files in base64 mode (console warning, not blocking)
      if (file.size > 1024 * 1024) {
        // 1MB
        console.warn(
          `Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Consider setting up Supabase storage for better performance.`
        );
      }

      return null; // File is valid
    },
    [allowedTypes, maxSize]
  );

  // Upload single file
  const uploadFile = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setState((prev) => ({ ...prev, error: validationError }));
        onError?.(validationError);
        return null;
      }

      // Reset state for new upload
      setState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
      }));

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        if (documentId) {
          formData.append('documentId', documentId);
        }

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        // Set up progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setState((prev) => ({ ...prev, progress }));
            onProgress?.(progress);
          }
        });

        // Create promise for xhr
        const uploadPromise = new Promise<UploadedImage>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                  // Log if using fallback storage
                  if (response.fallback) {
                    console.log(
                      'Using fallback base64 storage:',
                      response.message
                    );
                  }
                  resolve(response.data);
                } else {
                  reject(new Error(response.error || 'Upload failed'));
                }
              } catch (err) {
                reject(new Error('Invalid response format'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.error || `HTTP ${xhr.status}`));
              } catch (err) {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          };

          xhr.onerror = () => {
            reject(new Error('Network error during upload'));
          };

          xhr.ontimeout = () => {
            reject(new Error('Upload timeout'));
          };
        });

        // Configure and send request
        xhr.open('POST', '/api/images/upload');
        xhr.timeout = 60000; // 60 second timeout
        xhr.send(formData);

        // Wait for upload to complete
        const uploadedImage = await uploadPromise;

        // Update state with successful upload
        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          uploadedImages: [...prev.uploadedImages, uploadedImage],
        }));

        // Call success callback
        onSuccess?.(uploadedImage);

        return uploadedImage;
      } catch (error: any) {
        console.error('Upload error:', error);
        const errorMessage = error.message || 'Upload failed';

        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 0,
          error: errorMessage,
        }));

        onError?.(errorMessage);
        return null;
      }
    },
    [userId, documentId, validateFile, onSuccess, onError, onProgress]
  );

  // Upload multiple files
  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedImage[]> => {
      const results: UploadedImage[] = [];

      for (const file of files) {
        const result = await uploadFile(file);
        if (result) {
          results.push(result);
        }
      }

      return results;
    },
    [uploadFile]
  );

  // Handle file input change
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        uploadFiles(files);
      }

      // Reset input value to allow re-uploading same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadFiles]
  );

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        uploadFiles(imageFiles);
      } else if (files.length > 0) {
        const error = 'Only image files are allowed';
        setState((prev) => ({ ...prev, error }));
        onError?.(error);
      }
    },
    [uploadFiles, onError]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedImages: [],
    });
  }, []);

  // Remove uploaded image from state
  const removeImage = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    uploadFile,
    uploadFiles,
    handleFileSelect,
    handleDrop,
    openFileDialog,
    reset,
    removeImage,

    // Refs
    fileInputRef,

    // Configuration
    maxSize,
    allowedTypes,
  };
}
