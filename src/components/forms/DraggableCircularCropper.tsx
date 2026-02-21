'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableCircularCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

interface CropState {
  centerX: number; // Percentage of image width (0-100)
  centerY: number; // Percentage of image height (0-100)
  radius: number; // Percentage of smaller image dimension (10-50)
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  startX: number;
  startY: number;
  startCenterX: number;
  startCenterY: number;
  startRadius: number;
}

export default function DraggableCircularCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: DraggableCircularCropperProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  // Crop state - centered circle at 35% radius by default
  const [cropState, setCropState] = useState<CropState>({
    centerX: 50,
    centerY: 50,
    radius: 35,
  });

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    startCenterX: 0,
    startCenterY: 0,
    startRadius: 0,
  });

  // Load image using JavaScript Image object (reliable loading)
  useEffect(() => {
    if (!imageSrc) return;

    console.log(
      'Loading image for circular cropper:',
      imageSrc.substring(0, 50) + '...'
    );

    // Create timeout
    const timeout = setTimeout(() => {
      if (!imageLoaded) {
        console.error('Image loading timeout after 5 seconds');
        setLoadingTimeout(true);
        setImageError(true);
      }
    }, 5000);

    // Create new image for reliable loading
    const img = new Image();

    img.onload = () => {
      console.log('Image successfully loaded:', img.width, 'x', img.height);

      // Validate loaded image
      if (!img.width || !img.height || img.width < 10 || img.height < 10) {
        console.error('Invalid image dimensions:', img.width, 'x', img.height);
        setImageError(true);
        setImageLoaded(false);
        clearTimeout(timeout);
        return;
      }

      // Check for reasonable image size limits
      if (img.width > 4096 || img.height > 4096) {
        console.warn(
          'Large image detected:',
          img.width,
          'x',
          img.height,
          '- may impact performance'
        );
      }

      loadedImageRef.current = img;
      setImageNaturalSize({ width: img.width, height: img.height });
      setImageLoaded(true);
      setImageError(false);
      setCropError(null); // Clear any previous crop errors
      clearTimeout(timeout);
    };

    img.onerror = (error) => {
      console.error('Image failed to load:', error);
      setImageError(true);
      setImageLoaded(false);
      clearTimeout(timeout);
    };

    // Set image source to start loading
    img.src = imageSrc;

    return () => {
      clearTimeout(timeout);
      if (loadedImageRef.current) {
        loadedImageRef.current = null;
      }
    };
  }, [imageSrc, imageLoaded]);

  // Viewport size detection
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateViewportSize();

    // Add resize listener
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // Update preview when crop changes (debounced) with better error handling
  const updatePreview = useCallback(() => {
    const img = loadedImageRef.current;
    const canvas = previewCanvasRef.current;

    if (!img || !canvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Failed to get preview canvas context');
      return;
    }

    try {
      // Set preview canvas size
      const previewSize = 80;
      canvas.width = previewSize;
      canvas.height = previewSize;

      // Validate image dimensions
      if (!img.width || !img.height) {
        console.warn('Invalid image dimensions for preview');
        return;
      }

      // Calculate crop area in pixels with validation
      const smallerDimension = Math.min(img.width, img.height);
      const radiusPixels = Math.max(
        1,
        (cropState.radius / 100) * smallerDimension
      );

      const centerXPixels = Math.max(
        radiusPixels,
        Math.min(
          img.width - radiusPixels,
          (cropState.centerX / 100) * img.width
        )
      );
      const centerYPixels = Math.max(
        radiusPixels,
        Math.min(
          img.height - radiusPixels,
          (cropState.centerY / 100) * img.height
        )
      );

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        previewSize / 2,
        previewSize / 2,
        previewSize / 2,
        0,
        2 * Math.PI
      );
      ctx.clip();

      // Clear with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, previewSize, previewSize);

      // Draw cropped preview with bounds checking
      const sourceX = Math.max(0, centerXPixels - radiusPixels);
      const sourceY = Math.max(0, centerYPixels - radiusPixels);
      const sourceWidth = Math.min(radiusPixels * 2, img.width - sourceX);
      const sourceHeight = Math.min(radiusPixels * 2, img.height - sourceY);

      if (sourceWidth > 0 && sourceHeight > 0) {
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          previewSize,
          previewSize
        );
      }

      ctx.restore();
    } catch (error) {
      console.error('Error drawing circular preview:', error);
      // Clear canvas on error
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [cropState, imageLoaded]);

  // Debounce preview updates
  useEffect(() => {
    if (!imageLoaded) return;

    const timeoutId = setTimeout(updatePreview, 50);
    return () => clearTimeout(timeoutId);
  }, [updatePreview, imageLoaded]);

  // Generate final cropped image with comprehensive error handling
  const handleCrop = useCallback(async () => {
    const img = loadedImageRef.current;
    if (!img || !imageLoaded || isProcessing) {
      if (!img || !imageLoaded) {
        setCropError('Image not loaded properly');
      }
      return;
    }

    // Immediately set processing state to prevent double clicks
    setIsProcessing(true);
    setCropError(null);

    // Small delay to ensure UI updates before heavy processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // Validate image dimensions
      if (!img.width || !img.height) {
        throw new Error('Invalid image dimensions');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Set output size (square)
      const outputSize = 200;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Calculate crop area in pixels with validation
      const smallerDimension = Math.min(img.width, img.height);
      const radiusPixels = (cropState.radius / 100) * smallerDimension;

      const centerXPixels = (cropState.centerX / 100) * img.width;
      const centerYPixels = (cropState.centerY / 100) * img.height;

      // Validate crop coordinates
      if (
        centerXPixels < 0 ||
        centerYPixels < 0 ||
        centerXPixels > img.width ||
        centerYPixels > img.height ||
        radiusPixels <= 0 ||
        radiusPixels > smallerDimension / 2
      ) {
        throw new Error('Invalid crop coordinates');
      }

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI);
      ctx.clip();

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputSize, outputSize);

      // Draw final crop with error handling
      ctx.drawImage(
        img,
        Math.max(0, centerXPixels - radiusPixels),
        Math.max(0, centerYPixels - radiusPixels),
        radiusPixels * 2,
        radiusPixels * 2,
        0,
        0,
        outputSize,
        outputSize
      );

      ctx.restore();

      // Convert to blob with timeout and fallback
      const blobPromise = new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          0.9
        );
      });

      // Add timeout for blob creation
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Blob creation timeout')), 10000);
      });

      const blob = await Promise.race([blobPromise, timeoutPromise]);

      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Validate blob
      if (blob.size === 0) {
        throw new Error('Generated image blob is empty');
      }

      console.log(
        `Successfully created cropped image blob: ${(blob.size / 1024).toFixed(1)}KB`
      );
      onCropComplete(blob);
    } catch (error: any) {
      console.error('Error creating final circular crop:', error);
      const errorMessage = error.message || 'Failed to crop image';
      setCropError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [cropState, imageLoaded, onCropComplete, isProcessing]);

  // Get display dimensions and crop overlay position
  const getDisplayDimensions = useCallback(() => {
    if (!imageLoaded || !imageNaturalSize.width || !viewportSize.width)
      return null;

    // Responsive image sizing based on viewport
    let maxDisplayWidth, maxDisplayHeight;

    if (viewportSize.width < 768) {
      // Mobile: smaller image to fit screen
      maxDisplayWidth = Math.min(280, viewportSize.width * 0.8);
      maxDisplayHeight = Math.min(280, viewportSize.height * 0.4);
    } else if (viewportSize.width < 1024) {
      // Tablet: medium size
      maxDisplayWidth = Math.min(350, viewportSize.width * 0.6);
      maxDisplayHeight = Math.min(350, viewportSize.height * 0.45);
    } else {
      // Desktop: larger size but still reasonable
      maxDisplayWidth = Math.min(450, viewportSize.width * 0.5);
      maxDisplayHeight = Math.min(400, viewportSize.height * 0.5);
    }

    // Calculate display size maintaining aspect ratio
    const imgAspect = imageNaturalSize.width / imageNaturalSize.height;
    let displayWidth = maxDisplayWidth;
    let displayHeight = maxDisplayWidth / imgAspect;

    if (displayHeight > maxDisplayHeight) {
      displayHeight = maxDisplayHeight;
      displayWidth = maxDisplayHeight * imgAspect;
    }

    // Calculate crop circle position and size in display coordinates
    const smallerDisplayDimension = Math.min(displayWidth, displayHeight);
    const radiusDisplay = (cropState.radius / 100) * smallerDisplayDimension;

    const centerXDisplay = (cropState.centerX / 100) * displayWidth;
    const centerYDisplay = (cropState.centerY / 100) * displayHeight;

    return {
      displayWidth,
      displayHeight,
      centerX: centerXDisplay,
      centerY: centerYDisplay,
      radius: radiusDisplay,
    };
  }, [cropState, imageLoaded, imageNaturalSize, viewportSize]);

  // Convert screen coordinates to image percentages
  const _screenToImagePercent = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current;
      const displayDims = getDisplayDimensions();
      if (!container || !displayDims) return { x: 50, y: 50 };

      const rect = container.getBoundingClientRect();
      const relativeX = screenX - rect.left;
      const relativeY = screenY - rect.top;

      const percentX = (relativeX / displayDims.displayWidth) * 100;
      const percentY = (relativeY / displayDims.displayHeight) * 100;

      return {
        x: Math.max(0, Math.min(100, percentX)),
        y: Math.max(0, Math.min(100, percentY)),
      };
    },
    [getDisplayDimensions]
  );

  // Extract coordinates from mouse or touch event (handles both React and native events)
  const getEventCoordinates = useCallback(
    (
      e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
    ): { clientX: number; clientY: number } => {
      // Handle native TouchEvent and React TouchEvent
      if ('touches' in e && e.touches && e.touches.length > 0) {
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      }
      // Handle native MouseEvent and React MouseEvent
      else if ('clientX' in e && typeof e.clientX === 'number') {
        return { clientX: e.clientX, clientY: e.clientY };
      }
      return { clientX: 0, clientY: 0 };
    },
    []
  );

  // Unified pointer down handler - start drag or resize (works for mouse and touch)
  const handlePointerStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent | TouchEvent) => {
      e.preventDefault();
      const displayDims = getDisplayDimensions();
      if (!displayDims) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const coords = getEventCoordinates(e);
      const pointerX = coords.clientX - rect.left;
      const pointerY = coords.clientY - rect.top;

      // Check if click/touch is near the circle edge (resize) or inside (move)
      const dx = pointerX - displayDims.centerX;
      const dy = pointerY - displayDims.centerY;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      const isNearEdge = Math.abs(distanceFromCenter - displayDims.radius) < 20; // Increased for touch friendliness

      setDragState({
        isDragging: !isNearEdge,
        isResizing: isNearEdge,
        startX: coords.clientX,
        startY: coords.clientY,
        startCenterX: cropState.centerX,
        startCenterY: cropState.centerY,
        startRadius: cropState.radius,
      });
    },
    [cropState, getDisplayDimensions, getEventCoordinates]
  );

  // Unified pointer move handler - update drag or resize (works for mouse and touch)
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState.isDragging && !dragState.isResizing) return;

      const coords = getEventCoordinates(e);
      const deltaX = coords.clientX - dragState.startX;
      const deltaY = coords.clientY - dragState.startY;
      const displayDims = getDisplayDimensions();
      if (!displayDims) return;

      if (dragState.isDragging) {
        // Move the crop circle
        const deltaPercentX = (deltaX / displayDims.displayWidth) * 100;
        const deltaPercentY = (deltaY / displayDims.displayHeight) * 100;

        const newCenterX = dragState.startCenterX + deltaPercentX;
        const newCenterY = dragState.startCenterY + deltaPercentY;

        // Constrain to image bounds considering radius
        const constrainedCenterX = Math.max(
          cropState.radius,
          Math.min(100 - cropState.radius, newCenterX)
        );
        const constrainedCenterY = Math.max(
          cropState.radius,
          Math.min(100 - cropState.radius, newCenterY)
        );

        setCropState((prev) => ({
          ...prev,
          centerX: constrainedCenterX,
          centerY: constrainedCenterY,
        }));
      } else if (dragState.isResizing) {
        // Resize the crop circle
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const radiusDelta =
          (distance /
            Math.min(displayDims.displayWidth, displayDims.displayHeight)) *
          100;

        // Determine if we're making it bigger or smaller based on movement direction
        const isGrowing = deltaX > 0 || deltaY > 0;
        const newRadius = isGrowing
          ? Math.min(45, dragState.startRadius + radiusDelta * 0.5)
          : Math.max(10, dragState.startRadius - radiusDelta * 0.5);

        // Ensure the circle fits within image bounds
        const maxRadius = Math.min(
          cropState.centerX,
          100 - cropState.centerX,
          cropState.centerY,
          100 - cropState.centerY
        );

        setCropState((prev) => ({
          ...prev,
          radius: Math.min(newRadius, maxRadius),
        }));
      }
    },
    [dragState, cropState, getDisplayDimensions, getEventCoordinates]
  );

  // Unified pointer up handler - end drag (works for mouse and touch)
  const handlePointerEnd = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      isDragging: false,
      isResizing: false,
    }));
  }, []);

  // Add/remove global pointer event listeners (mouse and touch)
  useEffect(() => {
    if (dragState.isDragging || dragState.isResizing) {
      // Mouse events
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerEnd);

      // Touch events
      document.addEventListener('touchmove', handlePointerMove, {
        passive: false,
      });
      document.addEventListener('touchend', handlePointerEnd);

      return () => {
        // Remove mouse events
        document.removeEventListener('mousemove', handlePointerMove);
        document.removeEventListener('mouseup', handlePointerEnd);

        // Remove touch events
        document.removeEventListener('touchmove', handlePointerMove);
        document.removeEventListener('touchend', handlePointerEnd);
      };
    }
  }, [
    dragState.isDragging,
    dragState.isResizing,
    handlePointerMove,
    handlePointerEnd,
  ]);

  // Add manual non-passive touchstart event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Non-passive touch event handler
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // This works because listener is non-passive
      handlePointerStart(e as any);
    };

    // Add non-passive touchstart listener
    container.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handlePointerStart]);

  // Error state
  if (imageError) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-white mb-2">Failed to load image</p>
            {loadingTimeout && (
              <p className="text-red-300 text-sm mb-4">
                Loading timeout - the image may be too large or corrupted
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setImageError(false);
                  setImageLoaded(false);
                  setLoadingTimeout(false);
                  // Trigger reload by changing image source slightly
                  const img = new Image();
                  img.src = imageSrc + '?retry=' + Date.now();
                }}
                className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-2xl transition-colors text-sm font-medium"
              >
                Retry
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white mb-2">Loading image...</p>
            <p className="text-white/60 text-sm mb-4">
              Preparing your image for cropping
            </p>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayDims = getDisplayDimensions();
  if (!displayDims) return null;

  // Responsive modal sizing - using safe width calculations with scrolling
  const getModalClasses = () => {
    if (viewportSize.width < 768) {
      return 'bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 w-full max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto flex flex-col';
    } else if (viewportSize.width < 1024) {
      return 'bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 w-full max-w-[calc(100vw-64px)] max-h-[90vh] overflow-y-auto flex flex-col';
    } else {
      return 'bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-full max-w-[min(70vw,calc(100vw-128px),1024px)] max-h-[90vh] overflow-y-auto flex flex-col';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      style={{
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <div
        className={getModalClasses()}
        style={{
          position: 'relative',
          boxSizing: 'border-box',
          margin: '0 auto',
          scrollBehavior: 'smooth',
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between ${viewportSize.width < 768 ? 'mb-4' : 'mb-6'}`}
        >
          <h3
            className={`font-semibold text-white ${viewportSize.width < 768 ? 'text-lg' : 'text-xl'}`}
          >
            Crop Profile Picture
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          className={`flex flex-col ${viewportSize.width < 768 ? 'space-y-3' : 'space-y-4'} min-h-0`}
        >
          {/* Image with draggable circular crop overlay */}
          <div className="flex justify-center items-center">
            <div
              ref={containerRef}
              className="relative inline-block cursor-crosshair select-none"
              onMouseDown={handlePointerStart}
              style={{ touchAction: 'none' }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="rounded-lg pointer-events-none"
                style={{
                  filter: 'brightness(0.6)',
                  width: displayDims.displayWidth,
                  height: displayDims.displayHeight,
                }}
              />

              {/* Circular crop overlay */}
              <div
                className={`absolute border-2 border-white rounded-full pointer-events-none transition-opacity ${
                  dragState.isDragging || dragState.isResizing
                    ? 'opacity-80'
                    : 'opacity-60'
                }`}
                style={{
                  left: displayDims.centerX - displayDims.radius,
                  top: displayDims.centerY - displayDims.radius,
                  width: displayDims.radius * 2,
                  height: displayDims.radius * 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.3)`,
                }}
              />
            </div>
          </div>

          {/* Instructions - Centered under cropping image */}
          <div
            className={`flex flex-col items-center text-white/80 space-y-1 ${viewportSize.width < 768 ? 'text-xs' : 'text-sm'}`}
          >
            <p>
              {viewportSize.width < 768
                ? 'Tap and drag to move • Touch edges to resize'
                : 'Click and drag the circle to move • Drag near edges to resize'}
            </p>
            <p>
              Current size: {Math.round(cropState.radius * 2)}% • Final:
              200x200px
            </p>
            <p>
              <strong>
                Remember to click &ldquo;Save Profile&rdquo; after cropping to
                save your changes
              </strong>
            </p>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center">
            <p
              className={`text-white/80 font-medium mb-3 ${viewportSize.width < 768 ? 'text-xs' : 'text-sm'}`}
            >
              Preview:
            </p>
            <div
              className={`inline-block rounded-full overflow-hidden border-2 border-white/20 bg-neutral-800 ${viewportSize.width < 768 ? 'w-16 h-16' : 'w-20 h-20'}`}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full"
                style={{
                  width: viewportSize.width < 768 ? '64px' : '80px',
                  height: viewportSize.width < 768 ? '64px' : '80px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {cropError && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-red-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-300 text-sm font-medium">{cropError}</p>
            </div>
            <button
              onClick={() => setCropError(null)}
              className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex justify-end space-x-3 ${viewportSize.width < 768 ? 'mt-4 pb-2 sticky bottom-0 bg-gradient-to-t from-black/20 to-transparent pt-4' : 'mt-6 pb-4'} flex-shrink-0`}
        >
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors text-sm font-medium backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={isProcessing || !imageLoaded}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-800 dark:border border-neutral-600 text-white rounded-2xl dark:hover:bg-neutral-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px] relative"
          >
            {isProcessing ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
                <span>Processing...</span>
              </>
            ) : (
              'Apply Crop'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
