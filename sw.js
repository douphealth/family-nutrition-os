/** ZENITH PRO offline PWA — atomic updates, fresh code, intact family data. */
const CACHE = 'zenith-v18-2026-11-15-1';
const CORE = [
  './','./index.html',
  './styles/tokens.css','./styles/base.css','./styles/components.css','./styles/views.css',
  './styles/revamp.css','./styles/fitness.css','./styles/fitness-calendar.css',
  './styles/performance.css','./styles/atlas.css','./styles/exercise-coach.css',
  './styles/workspace.css','./styles/studio.css','./styles/print.css',
  './assets/fonts/inter-greek-wght-normal.woff2','./assets/fonts/inter-latin-wght-normal.woff2',
  './src/theme-boot.js','./src/update-boot.js','./src/app.js','./src/experience.js',
  './src/views.js','./src/fitness-engine.js','./src/fitness-view.js',
  './src/fitness-calendar.js','./src/fitness-calendar-view.js',
  './src/performance-program.js','./src/exercise-library.js','./src/performance-view.js',
  './src/ui.js','./src/i18n.js','./src/art.js','./src/dates.js','./src/data.js',
  './src/foods.js','./src/recipes.js','./src/nutrition-engine.js','./src/storage.js',
  './manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png',
  './assets/icon-512.png','./assets/icon-maskable-512.png','./assets/icon-180.png',
  './assets/favicon.png'
];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function reliableFetch(url) {
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { cache: 'reload' });
      if (response.ok && response.type !== 'opaque') return response;
      last = new Error('Precache '+url+': HTTP '+response.status);
    } catch (error) { last = error; }
    if (attempt < 3) await delay((attempt + 1) * 350);
  }
  throw last || new Error('Precache failed: '+url);
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // A failed asset must never replace a complete offline version.
      // Small batches avoid intermittent GitHub Pages 503 responses.
      for (let i = 0; i < CORE.length; i += 6) {
        await Promise.all(CORE.slice(i, i + 6).map(async url => {
          await cache.put(url, await reliableFetch(url));
        }));
      }
      await self.skipWaiting();
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('zenith-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(clients.map(client => client.postMessage({ type: 'ZENITH_UPDATED', cache: CACHE })));
  })());
});
// A future GitHub commit can modify JS/CSS without changing the HTML or worker.
// Compare the immutable precache snapshot with the origin on each app reopen.
// This closes the stale-app gap even when no agent remembers to bump a version.
async function checkPublishedAssets() {
  const cache = await caches.open(CACHE);
  const paths = CORE.filter(path => /\.(?:js|css)$/.test(path) || path === './index.html');
  const fresh = [];
  let changed = false;
  for (let offset = 0; offset < paths.length; offset += 6) {
    const batch = await Promise.all(paths.slice(offset, offset + 6).map(async path => {
      const response = await reliableFetch(path);
      const old = await cache.match(path);
      const updatedBytes = new Uint8Array(await response.clone().arrayBuffer());
      const oldBytes = old ? new Uint8Array(await old.arrayBuffer()) : null;
      const differs = !oldBytes || oldBytes.length !== updatedBytes.length ||
        updatedBytes.some((byte, index) => byte !== oldBytes[index]);
      return { path, response, differs };
    }));
    fresh.push(...batch);
    if (batch.some(item => item.differs)) changed = true;
  }
  if (changed) {
    // Only advance the saved snapshot after every file was fetched successfully.
    await Promise.all(fresh.map(item => cache.put(item.path, item.response)));
  }
  return { available: changed, checked: paths.length, cache: CACHE };
}
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') { self.skipWaiting(); return; }
  if (event.data?.type === 'CHECK_ASSETS' && event.ports?.[0]) {
    const port = event.ports[0];
    event.waitUntil(checkPublishedAssets()
      .then(result => port.postMessage(result))
      .catch(error => port.postMessage({ error: String(error.message || error) })));
  }
});
async function savedAsset(request) {
  let cached = await caches.match(request);
  if (cached) return cached;
  const url = new URL(request.url);
  url.search = '';
  return caches.match(url.href);
}
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  const isCodeOrStyle = /\.(?:js|css)$/.test(url.pathname);
  if (req.mode === 'navigate' || isCodeOrStyle) {
    event.respondWith((async () => {
      try {
        // Never let the browser HTTP cache pin an earlier release.
        const response = await fetch(req, { cache: 'no-store' });
        if (!response.ok && response.status >= 500) throw new Error('Temporary origin HTTP '+response.status);
        if (response.ok && response.type === 'basic') {
          const key = req.mode === 'navigate' ? './index.html' : req;
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(key, copy)).catch(() => {}));
        }
        return response;
      } catch {
        const cached = req.mode === 'navigate'
          ? (await caches.match('./index.html') || await caches.match('./'))
          : await savedAsset(req);
        return cached || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) {
      event.waitUntil(fetch(req, { cache: 'no-store' }).then(res => {
        if (res.ok && res.type === 'basic') return caches.open(CACHE).then(c => c.put(req, res));
      }).catch(() => {}));
      return cached;
    }
    try {
      const response = await fetch(req, { cache: 'no-store' });
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}));
      }
      return response;
    } catch { return Response.error(); }
  })());
});
