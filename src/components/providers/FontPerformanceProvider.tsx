'use client';

import { useEffect } from 'react';
import { initializeFontPerformanceMonitoring } from '@/lib/font-performance';

/**
 * Client-side font performance monitoring provider
 * Initializes font loading and performance tracking
 */
export default function FontPerformanceProvider() {
  useEffect(() => {
    // Initialize font performance monitoring when component mounts
    initializeFontPerformanceMonitoring();
  }, []);

  return null; // This component doesn't render anything
}
