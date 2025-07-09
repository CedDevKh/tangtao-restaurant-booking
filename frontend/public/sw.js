// Simple service worker for TangTao PWA
const CACHE_NAME = 'tangtao-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => {
      // If fetch fails and it's a navigation request, return the main page
      if (event.request.mode === 'navigate') {
        return caches.match('/') || fetch('/');
      }
      // For other requests, just let them fail
      throw new Error('Network request failed');
    })
  );
});
