/**
 * Service Worker for advanced asset caching
 * Implements cache-first, network-first, and stale-while-revalidate strategies
 */

const CACHE_NAME = 'straylight-v1';
const STATIC_CACHE = 'straylight-static-v1';
const DYNAMIC_CACHE = 'straylight-dynamic-v1';
const IMAGE_CACHE = 'straylight-images-v1';

// Assets to precache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Cache strategies for different asset types
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: [
    /\/_next\/static\//,
    /\.(?:js|css|woff|woff2|eot|ttf|otf)$/,
    /\/optimized\//,
  ],
  // Images - cache first with fallback
  images: [/\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/, /\/images\//],
  // API routes - network first
  api: [/\/api\//],
  // Pages - stale while revalidate
  pages: [/\/$/, /\/dashboard/, /\/articles/, /\/library/],
};

/**
 * Service Worker installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE),
      caches.open(DYNAMIC_CACHE),
      caches.open(IMAGE_CACHE),
    ]).then(() => {
      console.log('[SW] Caches opened');
      self.skipWaiting();
    })
  );
});

/**
 * Service Worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Clean up old caches
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== IMAGE_CACHE
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event handler with smart caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine caching strategy based on request
  const strategy = getCachingStrategy(request);

  event.respondWith(strategy(request));
});

/**
 * Determine appropriate caching strategy for request
 */
function getCachingStrategy(request) {
  const url = request.url;

  // Static assets - cache first
  if (CACHE_STRATEGIES.static.some((pattern) => pattern.test(url))) {
    return cacheFirst(STATIC_CACHE);
  }

  // Images - cache first with long TTL
  if (CACHE_STRATEGIES.images.some((pattern) => pattern.test(url))) {
    return cacheFirst(IMAGE_CACHE, { maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
  }

  // API routes - network first with short cache
  if (CACHE_STRATEGIES.api.some((pattern) => pattern.test(url))) {
    return networkFirst(DYNAMIC_CACHE, { maxAge: 5 * 60 * 1000 }); // 5 minutes
  }

  // Pages - stale while revalidate
  if (CACHE_STRATEGIES.pages.some((pattern) => pattern.test(url))) {
    return staleWhileRevalidate(DYNAMIC_CACHE);
  }

  // Default - network first
  return networkFirst(DYNAMIC_CACHE);
}

/**
 * Cache first strategy - serve from cache, fallback to network
 */
function cacheFirst(cacheName, options = {}) {
  return async (request) => {
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);

      if (cachedResponse && !isExpired(cachedResponse, options.maxAge)) {
        return cachedResponse;
      }

      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }

      return networkResponse;
    } catch (error) {
      console.error('[SW] Cache first failed:', error);
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  };
}

/**
 * Network first strategy - try network, fallback to cache
 */
function networkFirst(cacheName, options = {}) {
  return async (request) => {
    try {
      const cache = await caches.open(cacheName);

      try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (networkError) {
        console.warn('[SW] Network failed, trying cache:', networkError);

        const cachedResponse = await cache.match(request);

        if (cachedResponse && !isExpired(cachedResponse, options.maxAge)) {
          return cachedResponse;
        }

        throw networkError;
      }
    } catch (error) {
      console.error('[SW] Network first failed:', error);
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  };
}

/**
 * Stale while revalidate strategy - serve from cache, update in background
 */
function staleWhileRevalidate(cacheName) {
  return async (request) => {
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);

      // Trigger background update
      const fetchPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch((error) => {
          console.warn('[SW] Background update failed:', error);
        });

      // Return cached response if available, otherwise wait for network
      if (cachedResponse) {
        // Update in background
        fetchPromise.catch(() => {});
        return cachedResponse;
      }

      return await fetchPromise;
    } catch (error) {
      console.error('[SW] Stale while revalidate failed:', error);
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  };
}

/**
 * Check if cached response is expired
 */
function isExpired(response, maxAge) {
  if (!maxAge) return false;

  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;

  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();

  return now - responseTime > maxAge;
}

/**
 * Message handling for cache management
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (payload && payload.urls) {
        cacheUrls(payload.urls);
      }
      break;

    case 'CLEAR_CACHE':
      if (payload && payload.cacheName) {
        caches.delete(payload.cacheName);
      } else {
        clearAllCaches();
      }
      break;

    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage(stats);
      });
      break;
  }
});

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('[SW] Cached URLs:', urls);
  } catch (error) {
    console.error('[SW] Failed to cache URLs:', error);
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const cacheNames = await caches.keys();
    const stats = {};

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats[name] = keys.length;
    }

    return stats;
  } catch (error) {
    console.error('[SW] Failed to get cache stats:', error);
    return {};
  }
}
