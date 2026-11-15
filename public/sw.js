// ASTREON Progressive Web App Service Worker
const CACHE_NAME = 'astreon-cache-v4';
const IMAGE_CACHE_NAME = 'astreon-images-v3';
const MAX_CACHED_IMAGES = 80;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/robots.txt'
];

// Trim image cache to avoid unbounded storage growth
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map((key) => cache.delete(key)));
  }
}

// Install: Precache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up legacy caches
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, IMAGE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!validCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy routing
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests and non-HTTP schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(request.url);
  } catch {
    return;
  }

  // Bypass Firebase Auth handler routes, Netlify internal routes, and Google/Firebase identity/database endpoints
  if (
    parsedUrl.pathname.startsWith('/__/') ||
    parsedUrl.pathname.startsWith('/.netlify/') ||
    parsedUrl.hostname.includes('googleapis.com') ||
    parsedUrl.hostname.includes('accounts.google.com') ||
    parsedUrl.hostname.includes('firebaseapp.com')
  ) {
    return;
  }

  // Bypass caching for requests with Authorization headers, health pings, or admin API routes
  if (
    request.headers.has('Authorization') ||
    parsedUrl.pathname === '/api/health' ||
    parsedUrl.pathname.startsWith('/api/admin/')
  ) {
    return;
  }

  // 1. TMDB & Unsplash Poster / Backdrop Images: Stale-While-Revalidate with bounded cache
  if (
    request.url.includes('image.tmdb.org') ||
    request.url.includes('images.unsplash.com') ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && (response.status === 200 || response.type === 'opaque')) {
              cache.put(request, response.clone()).then(() => trimCache(IMAGE_CACHE_NAME, MAX_CACHED_IMAGES));
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          return cached;
        }
        const netRes = await networkPromise;
        return netRes || new Response('', { status: 504 });
      })
    );
    return;
  }

  // 2. Public API requests: Network-first with cached fallback
  if (parsedUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ offline: true, error: 'Connection offline' }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          );
        })
    );
    return;
  }

  // 3. Navigation & Static Assets: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // If HTML navigation fails, return cached index.html
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }

        return new Response('Offline: Network connection lost.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
