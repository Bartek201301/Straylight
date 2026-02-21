'use client';

import { useEffect } from 'react';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
  enableServiceWorker?: boolean;
  enableInDevelopment?: boolean;
}

/**
 * Service Worker Provider for advanced caching and offline functionality
 */
export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({
  children,
  enableServiceWorker = true,
  enableInDevelopment = false,
}) => {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      enableServiceWorker &&
      (process.env.NODE_ENV === 'production' || enableInDevelopment)
    ) {
      registerServiceWorker();
    }
  }, [enableServiceWorker, enableInDevelopment]);

  return <>{children}</>;
};

/**
 * Register service worker with error handling
 */
async function registerServiceWorker() {
  try {
    console.log('🔧 Registering service worker...');

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      console.log('🔄 Service worker update found');

      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('✨ New service worker available');
            // Could show update notification here
            showUpdateNotification();
          }
        });
      }
    });

    // Handle successful registration
    if (registration.installing) {
      console.log('⏳ Service worker installing...');
    } else if (registration.waiting) {
      console.log('⏸️ Service worker waiting...');
    } else if (registration.active) {
      console.log('✅ Service worker active');

      // Get cache statistics
      getCacheStats().then((stats) => {
        console.log('📊 Cache stats:', stats);
      });
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener(
      'message',
      handleServiceWorkerMessage
    );
  } catch (error) {
    console.error('❌ Service worker registration failed:', error);
  }
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(event: MessageEvent) {
  const { type, payload } = event.data;

  switch (type) {
    case 'CACHE_UPDATED':
      console.log('🔄 Cache updated:', payload);
      break;

    case 'OFFLINE':
      console.log('📴 App is offline');
      // Could show offline indicator here
      break;

    case 'ONLINE':
      console.log('🌐 App is online');
      // Could hide offline indicator here
      break;
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // This could integrate with your toast system
  if (typeof window !== 'undefined' && window.confirm) {
    const shouldReload = window.confirm(
      'A new version of the app is available. Would you like to reload to get the latest updates?'
    );

    if (shouldReload) {
      window.location.reload();
    }
  }
}

/**
 * Get cache statistics from service worker
 */
async function getCacheStats(): Promise<Record<string, number>> {
  if (!navigator.serviceWorker.controller) {
    return {};
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data || {});
    };

    navigator.serviceWorker.controller?.postMessage(
      { type: 'GET_CACHE_STATS' },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve({}), 5000);
  });
}

/**
 * Utility functions for cache management
 */
const _serviceWorkerUtils = {
  /**
   * Skip waiting and activate new service worker immediately
   */
  skipWaiting: () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  },

  /**
   * Cache specific URLs
   */
  cacheUrls: (urls: string[]) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        payload: { urls },
      });
    }
  },

  /**
   * Clear specific cache
   */
  clearCache: (cacheName?: string) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        payload: { cacheName },
      });
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats,

  /**
   * Check if app is running in standalone mode (PWA)
   */
  isStandalone: () => {
    return (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    );
  },

  /**
   * Check if service worker is supported
   */
  isSupported: () => {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  },
};
