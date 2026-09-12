/**
 * ZENITH PRO · service worker
 * ---------------------------------------------------------------------------
 * Strategy
 *   navigation  → network-first, falling back to the cached shell. v2 was
 *                 cache-first, which could pin an old build for a long time;
 *                 this picks up a deployed update on the next load.
 *   same-origin → stale-while-revalidate (instant from cache, refreshed after).
 *
 * Bump CACHE whenever any precached file changes.
 */

const CACHE = 'zenith-v3-2026-09-12-1';

const CORE = [
  './',
  './index.html',
  './styles/app.css',
  './src/app.js',
  './src/views.js',
  './src/ui.js',
  './src/data.js',
  './src/nutrition-engine.js',
  './src/storage.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png',
  './assets/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(CORE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  // Navigation: try the network so updates land, fall back to the offline shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // Assets: serve from cache immediately, refresh the cache in the background.
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
