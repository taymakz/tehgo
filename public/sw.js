/**
 * Service Worker for TehGo PWA
 *
 * This service worker enables:
 * - Offline functionality with cache-first strategy
 * - Background sync for data updates
 *
 * The service worker intercepts network requests and serves cached content
 * when offline, providing a seamless user experience.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
 * @see https://web.dev/learn/pwa/service-workers
 */

// Cache configuration
const CACHE_NAME = 'tehgo-v1';
const STATIC_CACHE_NAME = 'tehgo-static-v1';
const DYNAMIC_CACHE_NAME = 'tehgo-dynamic-v1';

/**
 * List of static assets to cache during service worker installation
 * These files are essential for the app to function offline
 */
const STATIC_ASSETS = [
  '/',
  '/fa',
  '/en',
  '/offline',
  '/manifest.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/apple-touch-icon.png',
];

/**
 * Routes that should be cached dynamically when accessed
 * Uses network-first strategy with cache fallback
 */
const DYNAMIC_ROUTES = [/^\/fa\/.*/, /^\/en\/.*/, /^\/api\/.*/];

/**
 * Routes that should never be cached
 * These require fresh data from the server
 */
const NO_CACHE_ROUTES = [/^\/api\/auth\/.*/, /^\/api\/backend\/.*/];

/**
 * Install Event Handler
 *
 * Called when the service worker is first installed.
 * Pre-caches essential static assets for offline use.
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event triggered');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Failed to pre-cache:', error);
      })
  );
});

/**
 * Activate Event Handler
 *
 * Called when the service worker is activated.
 * Cleans up old caches from previous versions.
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event triggered');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches that don't match current version
              return (
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME
              );
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event Handler
 *
 * Intercepts all network requests and applies caching strategies:
 * - Static assets: Cache-first (serve from cache, fallback to network)
 * - Dynamic routes: Network-first (try network, fallback to cache)
 * - No-cache routes: Network-only (always fetch from network)
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip no-cache routes
  if (NO_CACHE_ROUTES.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // Apply appropriate caching strategy
  if (request.method === 'GET') {
    // Check if request is for a static asset
    const isStaticAsset =
      STATIC_ASSETS.includes(url.pathname) ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js');

    if (isStaticAsset) {
      // Cache-first strategy for static assets
      event.respondWith(cacheFirst(request));
    } else if (DYNAMIC_ROUTES.some((pattern) => pattern.test(url.pathname))) {
      // Network-first strategy for dynamic routes
      event.respondWith(networkFirst(request));
    } else {
      // Stale-while-revalidate for everything else
      event.respondWith(staleWhileRevalidate(request));
    }
  }
});

/**
 * Cache-First Strategy
 *
 * Returns cached response if available, otherwise fetches from network
 * and caches the response for future use.
 *
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response from cache or network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[ServiceWorker] Serving from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);

    // Clone response as it can only be consumed once
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first fetch failed:', error);
    // Return offline page if available
    return caches.match('/offline');
  }
}

/**
 * Network-First Strategy
 *
 * Attempts to fetch from network first, falls back to cache on failure.
 * Updates cache with fresh network response.
 *
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response from network or cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE_NAME);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page as last resort
    return caches.match('/offline');
  }
}

/**
 * Stale-While-Revalidate Strategy
 *
 * Returns cached response immediately while fetching fresh version
 * in the background. Best for resources that update frequently but
 * don't need to be strictly up-to-date.
 *
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response from cache or network
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await caches.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[ServiceWorker] Background fetch failed:', error);
    });

  // Return cached version immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Background Sync Event Handler
 *
 * Enables offline data synchronization.
 * When the user comes back online, queued requests are processed.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync event:', event.tag);

  if (event.tag === 'sync-routes') {
    // Handle route sync when back online
    event.waitUntil(syncRoutes());
  }
});

/**
 * Sync Routes Function
 *
 * Processes queued route calculations that were made offline.
 */
async function syncRoutes() {
  console.log('[ServiceWorker] Syncing routes...');

  // Implementation would process queued route requests from IndexedDB
  // and sync them with the server when online
}

/**
 * Message Event Handler
 *
 * Handles messages from the main application.
 * Enables two-way communication between app and service worker.
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Force service worker update
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    // Cache specified URLs on demand
    const urlsToCache = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear all caches
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        )
    );
  }
});
