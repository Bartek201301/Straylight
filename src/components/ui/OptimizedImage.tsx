'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
  showLoader?: boolean;
  aspectRatio?: 'square' | '16:9' | '4:3' | '3:2';
  onLoadComplete?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'blur',
  blurDataURL,
  objectFit = 'cover',
  fallbackSrc,
  showLoader = true,
  aspectRatio,
  onLoadComplete,
  onError,
  ...props
}: OptimizedImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (w: number, h: number): string => {
    if (typeof window === 'undefined') {
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  // Reset states when src changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();

    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageError(false);
      setIsLoading(true);
    }
  };

  // Error fallback
  if (imageError && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-neutral-200 dark:bg-neutral-800',
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === '16:9' && 'aspect-video',
          aspectRatio === '4:3' && 'aspect-[4/3]',
          aspectRatio === '3:2' && 'aspect-[3/2]',
          className
        )}
        style={{ width, height: aspectRatio ? 'auto' : height }}
      >
        <div className="text-center text-neutral-500 dark:text-neutral-400">
          <svg
            className="mx-auto h-8 w-8 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === '16:9' && 'aspect-video',
        aspectRatio === '4:3' && 'aspect-[4/3]',
        aspectRatio === '3:2' && 'aspect-[3/2]',
        className
      )}
    >
      {/* Loading skeleton */}
      {isLoading && showLoader && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
        </div>
      )}

      <Image
        src={currentSrc}
        alt={alt}
        width={aspectRatio ? undefined : width}
        height={aspectRatio ? undefined : height}
        fill={!!aspectRatio}
        priority={priority}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL || generateBlurDataURL(width, height)}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          !aspectRatio && `object-${objectFit}`
        )}
        style={aspectRatio ? { objectFit } : undefined}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

// Convenience component for responsive images
const _ResponsiveImage = ({
  src,
  alt,
  aspectRatio = '16:9',
  className = '',
  priority = false,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'>) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio={aspectRatio}
      className={className}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      {...props}
    />
  );
};
