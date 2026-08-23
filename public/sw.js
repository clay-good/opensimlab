/**
 * The service worker (platform/offline-pwa → Cache-First Service Worker With
 * Explicit Updates).
 *
 * Cache-first from a VERSIONED cache. A new version is fetched in the background
 * when a network is available and applied only when the learner accepts it. The
 * new cache is fully populated before activation, and old caches are deleted only
 * after it, so a partially downloaded update can never serve mixed asset versions.
 *
 * Plain JavaScript rather than a generated bundle, because it is short enough to
 * read and the project holds a dependency ceiling.
 */

// Replaced at build time with a hash of every precached file's URL and bytes.
const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_NAME = `opensimlab-${CACHE_VERSION}`;

/** Everything needed to reach an interactive cockpit offline. */
const PRECACHE = ['__PRECACHE_MANIFEST__'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Populate FULLY before this version can ever be activated.
    await cache.addAll(PRECACHE.filter((url) => url && !url.startsWith('__')));
    // No skipWaiting here: the learner accepts the update explicitly.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Old caches are deleted only after the new one is active.
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Same-origin only. There is nothing else to fetch: the application makes no
  // request to any foreign origin, ever.
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) {
      // Refresh in the background so the next load has the newer copy, without
      // ever letting a network round trip delay this one.
      void fetch(request).then((response) => {
        if (response.ok) void cache.put(request, response.clone());
      }).catch(() => { /* offline: the cached copy is the answer */ });
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) void cache.put(request, response.clone());
      return response;
    } catch {
      // A navigation with nothing cached falls back to the shell.
      if (request.mode === 'navigate') {
        const shell = await cache.match('/index.html');
        if (shell) return shell;
      }
      throw new Error('Offline and not cached');
    }
  })());
});
