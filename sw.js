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

const CACHE = 'zenith-v15-2026-10-05-2';

const CORE = [
  './',
  './index.html',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './styles/views.css',
  './styles/print.css',
  './assets/fonts/inter-greek-wght-normal.woff2',
  './assets/fonts/inter-latin-wght-normal.woff2',
  './src/theme-boot.js',
  './src/app.js',
  './src/views.js',
  './src/ui.js',
  './src/i18n.js',
  './src/art.js',
  './src/dates.js',
  './src/data.js',
  './src/foods.js',
  './src/recipes.js',
  './src/nutrition-engine.js',
  './src/storage.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
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
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('zenith-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map(client => {
      try {
        const url = new URL(client.url);
        if (url.origin !== self.location.origin) return undefined;
        url.searchParams.set('__zenith_build', '15.0.1');
        return client.navigate(url.href);
      } catch {
        return undefined;
      }
    }));
  })());
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

  const url = new URL(req.url);
  const isCodeOrStyle = /\.(?:js|css)$/.test(url.pathname);

  // Code and CSS: network-first. Versioned URLs in index/module imports already
  // defeat older workers; this also prevents future open tabs from pinning code.
  if (isCodeOrStyle) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const exact = await caches.match(req);
          if (exact) return exact;
          url.search = '';
          return caches.match(url.href);
        })
    );
    return;
  }

  // Other same-origin assets can stay instant while refreshing in background.
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
