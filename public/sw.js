/**
 * The service worker (platform/offline-pwa → Cache-First Service Worker With
 * Explicit Updates).
 *
 * Immutable, integrity-checked releases. Open clients keep their release after
 * another tab accepts an update. Browser-generated client IDs are stored locally
 * only to retain their assets; no URLs, actions, or learner data are recorded.
 *
 * Plain JavaScript rather than a generated bundle, because it is short enough to
 * read and the project holds a dependency ceiling.
 */

// Replaced at build time with a hash of every precached file's URL and bytes.
const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_NAME = `opensimlab-${CACHE_VERSION}`;
const STATE_CACHE = 'opensimlab-runtime-v1';
const STATE_URL = '/__opensimlab_cache_state__';

/** Everything needed to reach an interactive cockpit offline. */
const PRECACHE = ['__PRECACHE_MANIFEST__'];
const INTEGRITY = __PRECACHE_INTEGRITY__;

const clientKey = (id) => `${STATE_URL}/client/${encodeURIComponent(id)}`;
let pruningStarted = false;

function releaseNames(names) {
  return names.filter((name) => /^opensimlab-[a-z0-9]+$/.test(name));
}

function canonicalDocument(path) {
  return path.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
}

async function liveClients() {
  return (await self.clients.matchAll({ includeUncontrolled: true, type: 'all' }))
    .filter((client) => client.url.startsWith(self.registration.scope));
}

async function pruneClosedClients() {
  const cache = await caches.open(STATE_CACHE);
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith(`${STATE_URL}/client/`)) continue;
    const id = decodeURIComponent(path.slice(`${STATE_URL}/client/`.length));
    // matchAll omits initializing documents/workers. get waits for readiness or
    // discard, so this must run outside activation (their imports may await it).
    if (!await self.clients.get(id)) await cache.delete(request);
  }
  // Only a later activation retires unpinned releases, after this worker's
  // in-flight fetches have finished recording any new document/worker pins.
}

async function prepareActivation() {
  const cache = await caches.open(STATE_CACHE);
  const saved = await cache.match(STATE_URL);
  const state = saved ? await saved.json() : {};
  const names = releaseNames(await caches.keys());
  const previous = state.pending?.previous ?? state.active
    ?? names.slice(0, names.indexOf(CACHE_NAME)).at(-1) ?? CACHE_NAME;
  // Separate entries avoid lost updates when the active worker records a new
  // client while this waiting worker prepares existing clients for activation.
  for (const client of await liveClients()) {
    if (!await cache.match(clientKey(client.id))) {
      await cache.put(clientKey(client.id), new Response(previous));
    }
  }
  // Preserve the previous release durably too: a client can appear between this
  // snapshot and activation, and activation-time writes can still fail.
  await cache.put(STATE_URL, new Response(JSON.stringify({ active: state.active ?? previous,
    pending: { release: CACHE_NAME, previous } })));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const existed = await caches.has(CACHE_NAME);
    const cache = await caches.open(CACHE_NAME);
    try {
      // addAll commits the batch only after every response succeeds. Fetch's
      // integrity check also rejects a successful response from another build.
      await cache.addAll(PRECACHE.map((url) => {
        if (!/^sha256-[A-Za-z0-9+/]{43}=$/.test(INTEGRITY[url] ?? '')) throw new Error('Missing release integrity');
        return new Request(new URL(url, self.location.origin), { cache: 'reload', integrity: INTEGRITY[url] });
      }));
    } catch (error) {
      if (!existed) await caches.delete(CACHE_NAME);
      throw error;
    }
    // No skipWaiting here: the learner accepts the update explicitly.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATE_CACHE);
    const saved = await cache.match(STATE_URL);
    const state = saved ? await saved.json() : {};
    // Natural activation has no clients of the previous worker. Explicit
    // activation carries a durable fallback for clients created during the gap.
    const previous = state.pending?.release === CACHE_NAME ? state.pending.previous : CACHE_NAME;
    const live = new Set((await liveClients()).map((client) => client.id));
    try {
      for (const id of live) {
        if (!await cache.match(clientKey(id))) await cache.put(clientKey(id), new Response(previous));
      }
      await cache.put(STATE_URL, new Response(JSON.stringify({ active: CACHE_NAME })));
    } catch { return; } // Retain every release and the durable fallback on failure.
    const retained = new Set([CACHE_NAME]);
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      if (!path.startsWith(`${STATE_URL}/client/`)) continue;
      // An absent client may still be initializing; retain every durable pin.
      retained.add(await (await cache.match(request)).text());
    }
    const names = releaseNames(await caches.keys());
    // Never touch a newer waiting/installing snapshot or an unrelated cache.
    for (const name of names.slice(0, names.indexOf(CACHE_NAME))) {
      if (!retained.has(name)) await caches.delete(name);
    }
    // Do not claim uncontrolled pages: their HTML may predate this deployment.
    // Already controlled clients switch workers as part of browser activation.
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skip-waiting') {
    event.waitUntil((async () => {
      try {
        // Activation errors do not roll back a worker. Commit pins BEFORE asking
        // the browser to activate, while storage failure can still leave A live.
        await prepareActivation();
        await self.skipWaiting();
      } catch { event.source?.postMessage({ type: 'update-preparation-failed' }); }
    })());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Same-origin application assets only. Turnstile is loaded by the page after
  // a learner opens the report dialog and never passes through this cache.
  if (url.origin !== self.location.origin) return;
  // Report configuration is an operational kill switch and must never be
  // cached or served stale. The report POST is already excluded by method.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith(STATE_URL) || url.pathname === '/sw.js') return;

  const response = (async () => {
    const navigation = request.mode === 'navigate';
    const metadata = await caches.open(STATE_CACHE);
    const pin = event.clientId ? await metadata.match(clientKey(event.clientId)) : null;
    const saved = pin || navigation ? null : await metadata.match(STATE_URL);
    const state = saved ? await saved.json() : {};
    const fallback = state.pending?.release === CACHE_NAME ? state.pending.previous : CACHE_NAME;
    const name = navigation ? CACHE_NAME : pin ? await pin.text() : fallback;
    // A failed new pin fails this request closed; already pinned clients do not
    // require a write. Never deliver a new document/worker with an unrecorded pin.
    const id = event.resultingClientId || event.clientId;
    if (id && (!pin || id !== event.clientId || navigation)) {
      await metadata.put(clientKey(id), new Response(name));
    }
    const cache = await caches.open(name);
    const path = navigation ? canonicalDocument(url.pathname) : url.pathname;
    const cached = await cache.match(path);
    if (cached) return cached;
    if (navigation) {
      const shell = await cache.match('/index.html');
      if (shell) return shell;
    }
    // Unknown resources may be fetched, but can never alter a release snapshot.
    // Missing shipped assets fail rather than silently mixing another release.
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')
      || url.pathname.startsWith('/catalog/')) return Response.error();
    return fetch(request);
  })();
  event.respondWith(response);
  if (!pruningStarted) {
    pruningStarted = true;
    event.waitUntil(response.then(pruneClosedClients).catch(() => {}));
  }
});
