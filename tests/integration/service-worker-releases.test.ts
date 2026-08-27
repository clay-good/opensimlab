import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

const SOURCE = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://opensimlab.test';
const STATE_CACHE = 'opensimlab-runtime-v1';
const STATE_URL = '/__opensimlab_cache_state__';
const clientKey = (id: string) => `${STATE_URL}/client/${encodeURIComponent(id)}`;
const ROUTE = '/endocrine-metabolic/scenario/example';
const ASSET_A = '/assets/index-AAAA1111.js';
const ASSET_B = '/assets/index-BBBB2222.js';
const HTML_A = `<html>RELEASE_A<script src="${ASSET_A}"></script></html>`;
const HTML_B = `<html>RELEASE_B<script src="${ASSET_B}"></script></html>`;
type Input = string | URL | Request;
const absolute = (input: Input) => new URL(typeof input === 'string' || input instanceof URL ? input : input.url, ORIGIN).href;
class BrowserRequest extends Request {
  constructor(input: Input, init?: RequestInit) {
    super(typeof input === 'string' ? new URL(input, ORIGIN) : input, init);
  }
}

class MemoryCache {
  readonly entries = new Map<string, Response>();
  readonly writes: string[] = [];
  beforePut?: (input: Input) => void | Promise<void>;
  constructor(private readonly fetcher: (input: Input) => Promise<Response>) {}
  async match(input: Input, options?: { ignoreSearch?: boolean }) {
    const target = new URL(absolute(input));
    for (const [key, response] of this.entries) {
      const candidate = new URL(key);
      if (options?.ignoreSearch) { target.search = ''; candidate.search = ''; }
      if (candidate.href === target.href) return response.clone();
    }
    return undefined;
  }
  async put(input: Input, response: Response) {
    await this.beforePut?.(input);
    this.commit(input, response);
  }
  private commit(input: Input, response: Response) {
    this.entries.set(absolute(input), response.clone()); this.writes.push(absolute(input));
  }
  async addAll(inputs: Input[]) {
    const responses = await Promise.all(inputs.map(async (input) => {
      const response = await this.fetcher(input);
      if (!response.ok) throw new TypeError('Precache download failed');
      return response;
    }));
    // Native Cache.addAll is an atomic batch, including storage failures.
    for (const input of inputs) await this.beforePut?.(input);
    for (let index = 0; index < inputs.length; index += 1) this.commit(inputs[index]!, responses[index]!);
  }
  async keys() { return [...this.entries.keys()].map((url) => new Request(url)); }
  async delete(input: Input) { return this.entries.delete(absolute(input)); }
}

type WorkerEvent = {
  request: Request; clientId: string; resultingClientId: string; data: { type: string };
  source: { postMessage(message: { type: string }): void };
  waitUntil(promise: Promise<unknown>): void; respondWith(promise: Promise<Response> | Response): void;
};
type Listener = (event: Partial<WorkerEvent>) => void;
type BrowserClient = { id: string; url: string; type: string };

/** Real worker source; only browser infrastructure and network bytes are faked. */
function harness(version: string, options: { precache?: Record<string, string>; buckets?: Map<string, MemoryCache>;
  beforePut?: (name: string, input: Input) => void | Promise<void> } = {}) {
  const handlers = new Map<string, Listener>();
  const buckets = options.buckets ?? new Map<string, MemoryCache>();
  const release = options.precache ?? { [ROUTE]: version === 'A' ? HTML_A : HTML_B,
    '/index.html': version === 'A' ? HTML_A : HTML_B, [version === 'A' ? ASSET_A : ASSET_B]: `ASSET_${version}` };
  const precache = Object.keys(release);
  const integrity = Object.fromEntries(Object.entries(release).map(([url, body]) =>
    [url, `sha256-${createHash('sha256').update(body).digest('base64')}`]));
  const network = new Map<string, Response | Error>();
  const fetcher = vi.fn(async (input: Input) => {
    const response = network.get(new URL(absolute(input)).pathname) ?? new Response(HTML_B);
    if (response instanceof Error) throw response;
    // Browser fetch enforces Request.integrity. Keep that native contract in
    // the fake network so a worker must actually request the manifest digest.
    if (input instanceof Request && input.integrity && response.ok) {
      const actual = `sha256-${createHash('sha256').update(Buffer.from(await response.clone().arrayBuffer())).digest('base64')}`;
      if (input.integrity !== actual) throw new TypeError('Subresource integrity mismatch');
    }
    return response.clone();
  });
  const storage = {
    open: vi.fn(async (name: string) => {
      if (!buckets.has(name)) {
        const cache = new MemoryCache(fetcher);
        cache.beforePut = (input) => options.beforePut?.(name, input);
        buckets.set(name, cache);
      }
      return buckets.get(name)!;
    }),
    keys: vi.fn(async () => [...buckets.keys()]),
    has: vi.fn(async (name: string) => buckets.has(name)),
    delete: vi.fn(async (name: string) => buckets.delete(name)),
    match: vi.fn(async (input: Input, options?: { ignoreSearch?: boolean; cacheName?: string }) => {
      for (const [name, cache] of buckets) {
        if (options?.cacheName && name !== options.cacheName) continue;
        const found = await cache.match(input, options); if (found) return found;
      }
      return undefined;
    }),
  };
  const clients = { claim: vi.fn(async () => {}),
    get: vi.fn(async (id: string): Promise<BrowserClient | undefined> => ({ id, url: `${ORIGIN}${ROUTE}`, type: 'window' })),
    matchAll: vi.fn(async () => [
    { id: 'old-tab-A', url: `${ORIGIN}${ROUTE}`, type: 'window' },
    { id: 'new-tab-B', url: `${ORIGIN}${ROUTE}`, type: 'window' },
  ]) };
  const skipWaiting = vi.fn(async () => {});
  const source = SOURCE.replace('__CACHE_VERSION__', version.toLowerCase())
    .replace("'__PRECACHE_MANIFEST__'", precache.map((url) => JSON.stringify(url)).join(', '))
    .replace("'__PRECACHE_INTEGRITY__'", JSON.stringify(integrity))
    .replace('__PRECACHE_INTEGRITY__', JSON.stringify(integrity));
  runInNewContext(source, { URL, Request: BrowserRequest, Response, Headers, crypto: webcrypto, TextEncoder,
    self: { location: { origin: ORIGIN }, registration: { scope: `${ORIGIN}/` }, clients, skipWaiting,
      addEventListener: (type: string, listener: Listener) => handlers.set(type, listener) },
    caches: storage, fetch: fetcher });
  const seed = async (name: string, entries: Record<string, string>) => {
    const cache = await storage.open(name);
    for (const [url, body] of Object.entries(entries)) await cache.put(url, new Response(body));
    cache.writes.length = 0; return cache;
  };
  const lifetimes: Promise<unknown>[] = [];
  const settle = async () => { await Promise.all(lifetimes.splice(0)); };
  const dispatch = async (type: string, extra: Partial<WorkerEvent> = {}, awaitLifetime = true) => {
    const pending: Promise<unknown>[] = []; let answer: Promise<Response> | Response | undefined;
    handlers.get(type)!({ ...extra, waitUntil: (promise) => { pending.push(promise); }, respondWith: (promise) => { answer = promise; } });
    const response = answer ? await answer : undefined;
    if (awaitLifetime) await Promise.all(pending);
    else lifetimes.push(Promise.all(pending));
    // Settle detached background writes too, so the original defect is observable.
    await new Promise<void>((resolve) => setImmediate(resolve));
    return response;
  };
  const request = (path: string, mode = 'navigate', method = 'GET', clientId = 'old-tab-A',
    resultingClientId = clientId, destination = mode === 'navigate' ? 'document' : 'script', awaitLifetime = true) => {
    const value = new Request(new URL(path, ORIGIN), { method });
    Object.defineProperty(value, 'mode', { value: mode });
    Object.defineProperty(value, 'destination', { value: destination });
    return dispatch('fetch', { request: value, clientId, resultingClientId }, awaitLifetime);
  };
  return { seed, dispatch, request, settle, storage, buckets, network, fetcher, clients, skipWaiting, release };
}

describe('Service worker release consistency', () => {
  it('does not replace release A HTML with release B bytes before explicit activation', async () => {
    const worker = harness('A'); const cache = await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, [ASSET_A]: 'ASSET_A' });
    expect(await (await worker.request(ROUTE))!.text()).toBe(HTML_A);
    expect(await (await worker.request(ROUTE))!.text()).toBe(HTML_A);
    expect(worker.fetcher).not.toHaveBeenCalled(); expect(cache.writes).toEqual([]);
    expect(await cache.match(ASSET_B)).toBeUndefined();
  });

  it.each([`${ROUTE}?seed=7`, `${ROUTE}/`, `${ROUTE}/index.html?seed=7`])('canonicalizes navigation %s to the current release document', async (path) => {
    const worker = harness('A'); await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, '/index.html': 'SHELL_A' });
    expect(await (await worker.request(path))!.text()).toBe(HTML_A);
    expect(worker.fetcher).not.toHaveBeenCalled();
  });

  it.each(['online', 'offline'])('uses the same-release shell for an unknown application navigation while %s', async (connection) => {
    const worker = harness('A'); await worker.seed('opensimlab-a', { '/index.html': 'SHELL_A' });
    if (connection === 'offline') worker.network.set('/new-scenario', new Error('offline'));
    expect(await (await worker.request('/new-scenario?assignment=private'))!.text()).toBe('SHELL_A');
    expect(worker.fetcher).not.toHaveBeenCalled();
    expect(await worker.buckets.get('opensimlab-a')!.match('/new-scenario')).toBeUndefined();
  });

  it('keeps old-client hashed and stable assets consistent after another client accepts B, including worker restart', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, '/index.html': HTML_A,
      [ASSET_A]: 'JS_A', '/fonts/body.woff2': 'FONT_A', '/catalog/scenarios.json': 'CATALOG_A' });
    await worker.seed('opensimlab-b', { [ROUTE]: HTML_B, '/index.html': HTML_B,
      [ASSET_B]: 'JS_B', '/fonts/body.woff2': 'FONT_B', '/catalog/scenarios.json': 'CATALOG_B' });
    worker.network.set(ASSET_A, new Response('old asset removed', { status: 404 }));
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    await worker.dispatch('activate');
    expect(await (await worker.request(ASSET_A, 'cors', 'GET', 'old-tab-A'))!.text()).toBe('JS_A');
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'old-tab-A'))!.text()).toBe('FONT_A');
    expect(await (await worker.request('/catalog/scenarios.json', 'cors', 'GET', 'old-tab-A'))!.text()).toBe('CATALOG_A');
    expect(await (await worker.request(ROUTE, 'navigate', 'GET', 'new-tab-B'))!.text()).toBe(HTML_B);
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'new-tab-B'))!.text()).toBe('FONT_B');
    expect(worker.fetcher).not.toHaveBeenCalled();
    const restarted = harness('B', { buckets: worker.buckets });
    expect(await (await restarted.request(ASSET_A, 'cors', 'GET', 'old-tab-A'))!.text()).toBe('JS_A');
    expect(await (await restarted.request('/catalog/scenarios.json', 'cors', 'GET', 'old-tab-A'))!.text()).toBe('CATALOG_A');
    expect(await (await restarted.request('/fonts/body.woff2', 'cors', 'GET', 'new-tab-B'))!.text()).toBe('FONT_B');
    expect(restarted.fetcher).not.toHaveBeenCalled();
  });

  it('preserves unrelated origin caches during activation', async () => {
    const worker = harness('B'); await worker.seed('other-app-cache', { '/other': 'OTHER_APP' });
    await worker.seed('opensimlab-b', { '/index.html': HTML_B });
    await worker.dispatch('activate');
    expect(worker.buckets.has('other-app-cache')).toBe(true);
    expect(await (await worker.buckets.get('other-app-cache')!.match('/other'))!.text()).toBe('OTHER_APP');
  });

  it('pins a navigation to its resulting client without upgrading the initiating old page', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { [ROUTE]: HTML_B, '/fonts/body.woff2': 'FONT_B' });
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    await worker.dispatch('activate');
    expect(await (await worker.request(ROUTE, 'navigate', 'GET', 'old-tab-A', 'new-document'))!.text()).toBe(HTML_B);
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'new-document', ''))!.text()).toBe('FONT_B');
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'old-tab-A', ''))!.text()).toBe('FONT_A');
    expect(worker.fetcher).not.toHaveBeenCalled();
  });

  it('retains A and its dedicated worker through three updates and restarts while pruning closed clients', async () => {
    const initial = harness('A');
    await initial.seed('opensimlab-a', { [ROUTE]: HTML_A, [ASSET_A]: 'JS_A',
      '/fonts/body.woff2': 'FONT_A', '/catalog/scenarios.json': 'CATALOG_A' });
    initial.clients.matchAll.mockResolvedValue([{ id: 'old-tab-A', url: `${ORIGIN}${ROUTE}`, type: 'window' }]);
    await initial.dispatch('activate');
    const live = [{ id: 'old-tab-A', url: `${ORIGIN}${ROUTE}`, type: 'window' }];
    for (const version of ['B', 'C', 'D']) {
      const worker = harness(version, { buckets: initial.buckets });
      await worker.seed(`opensimlab-${version.toLowerCase()}`, { [ROUTE]: `HTML_${version}`,
        '/fonts/body.woff2': `FONT_${version}`, '/catalog/scenarios.json': `CATALOG_${version}` });
      worker.clients.matchAll.mockResolvedValue([...live]);
      await worker.dispatch('message', { data: { type: 'skip-waiting' } });
      await worker.dispatch('activate');
      if (version === 'B') {
        expect(await (await worker.request(ASSET_A, 'same-origin', 'GET', 'old-tab-A', 'worker-A', 'worker'))!.text()).toBe('JS_A');
        live.push({ id: 'worker-A', url: `${ORIGIN}${ASSET_A}`, type: 'worker' });
      }
      const restarted = harness(version, { buckets: initial.buckets });
      restarted.clients.get.mockImplementation(async (id) => live.find((client) => client.id === id));
      expect(await (await restarted.request('/fonts/body.woff2', 'cors', 'GET', 'old-tab-A', ''))!.text()).toBe('FONT_A');
      expect(await (await restarted.request('/catalog/scenarios.json', 'cors', 'GET', 'worker-A', ''))!.text()).toBe('CATALOG_A');
      expect(await (await restarted.request(ROUTE, 'navigate', 'GET', '', `new-tab-${version}`))!.text()).toBe(`HTML_${version}`);
      expect(await (await restarted.request('/catalog/scenarios.json', 'cors', 'GET', `new-tab-${version}`, ''))!.text()).toBe(`CATALOG_${version}`);
      expect(restarted.fetcher).not.toHaveBeenCalled();
      expect(worker.fetcher).not.toHaveBeenCalled();
      // The accepting tab closes before the next activation; A stays open.
    }
    expect(initial.buckets.has('opensimlab-a')).toBe(true);
    expect(initial.buckets.has('opensimlab-b')).toBe(false);
    // C's closed pin was removed during D's fetch, after D activation had
    // already retained its cache. A subsequent activation may retire C.
    expect(initial.buckets.has('opensimlab-c')).toBe(true);
    expect(initial.buckets.has('opensimlab-d')).toBe(true);
    const next = harness('E', { buckets: initial.buckets });
    await next.seed('opensimlab-e', { '/index.html': 'HTML_E' });
    next.clients.matchAll.mockResolvedValue(live);
    await next.dispatch('message', { data: { type: 'skip-waiting' } });
    await next.dispatch('activate');
    expect(initial.buckets.has('opensimlab-c')).toBe(false);
    expect(initial.buckets.has('opensimlab-a')).toBe(true);
  });

  it.each(['/assets/new-BBBB2222.js', '/fonts/new.woff2', '/catalog/new.json'])('fails closed for missing release asset %s without fetching another release', async (path) => {
    const worker = harness('A'); const cache = await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, [ASSET_A]: 'JS_A' });
    worker.network.set(path, new Response('NEW_RELEASE_BYTES'));
    expect((await worker.request(path, 'cors'))!.type).toBe('error');
    expect(worker.fetcher).not.toHaveBeenCalled();
    expect(cache.writes).toEqual([]);
    expect(await cache.match(path)).toBeUndefined();
  });

  it('fetches unrelated uncached resources without extending a sealed release', async () => {
    const worker = harness('A'); const cache = await worker.seed('opensimlab-a', { '/index.html': HTML_A });
    worker.network.set('/optional-resource.txt', new Response('NETWORK_ONLY'));
    expect(await (await worker.request('/optional-resource.txt', 'cors'))!.text()).toBe('NETWORK_ONLY');
    expect(worker.fetcher).toHaveBeenCalledOnce();
    expect(cache.writes).toEqual([]);
    expect(await cache.match('/optional-resource.txt')).toBeUndefined();
  });

  it('does not delete another release that is installing or waiting during B activation', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { '/index.html': HTML_A, [ASSET_A]: 'JS_A' });
    await worker.seed('opensimlab-b', { '/index.html': HTML_B });
    await worker.seed('opensimlab-c', { '/index.html': 'INSTALLING_C' });
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    await worker.dispatch('activate');
    expect(worker.buckets.has('opensimlab-c')).toBe(true);
    expect(await (await worker.buckets.get('opensimlab-c')!.match('/index.html'))!.text()).toBe('INSTALLING_C');
    expect(await (await worker.request(ASSET_A, 'cors', 'GET', 'old-tab-A', ''))!.text()).toBe('JS_A');
  });

  it.each([
    ['/api', 'GET'], ['/api/reports/config', 'GET'], ['/api/reports', 'POST'], [ROUTE, 'POST'],
    ['/sw.js', 'GET'], ['/__opensimlab_cache_state__', 'GET'],
    ['https://challenges.cloudflare.com/turnstile/v0/api.js', 'GET'],
  ])('does not intercept excluded request %s %s', async (path, method) => {
    const worker = harness('A');
    expect(await worker.request(path, 'cors', method)).toBeUndefined();
    expect(worker.storage.open).not.toHaveBeenCalled(); expect(worker.fetcher).not.toHaveBeenCalled();
  });

  it('populates the complete integrity-checked release without activating before acceptance', async () => {
    const worker = harness('B');
    for (const [url, body] of Object.entries(worker.release)) worker.network.set(url, new Response(body));
    await worker.dispatch('install');
    const cache = worker.buckets.get('opensimlab-b')!;
    for (const [url, body] of Object.entries(worker.release)) expect(await (await cache.match(url))!.text()).toBe(body);
    expect(worker.fetcher).toHaveBeenCalledTimes(Object.keys(worker.release).length);
    for (const [input] of worker.fetcher.mock.calls) {
      expect(input).toBeInstanceOf(Request);
      expect((input as Request).integrity).toMatch(/^sha256-/);
      expect((input as Request).cache).toBe('reload');
    }
    expect(worker.skipWaiting).not.toHaveBeenCalled(); expect(worker.clients.claim).not.toHaveBeenCalled();
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    expect(worker.skipWaiting).toHaveBeenCalledOnce();
  });

  it.each(['missing asset', 'newer HTML at a stable URL'])('rejects a partial or inconsistent installation: %s', async (failure) => {
    const worker = harness('B'); const original = await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, [ASSET_A]: 'JS_A' });
    for (const [url, body] of Object.entries(worker.release)) worker.network.set(url, new Response(body));
    if (failure === 'missing asset') worker.network.set(ASSET_B, new Response('missing', { status: 404 }));
    else worker.network.set(ROUTE, new Response('RELEASE_C_HTML_WITH_OTHER_ASSETS'));
    await expect(worker.dispatch('install')).rejects.toThrow();
    expect(await (await original.match(ROUTE))!.text()).toBe(HTML_A);
    expect(worker.buckets.get('opensimlab-b')?.entries.size ?? 0).toBe(0);
    expect(worker.skipWaiting).not.toHaveBeenCalled(); expect(worker.clients.claim).not.toHaveBeenCalled();
  });

  it('does not damage an existing same-version cache when a repeated install fails integrity', async () => {
    const worker = harness('B'); const cache = await worker.seed('opensimlab-b', worker.release);
    for (const [url, body] of Object.entries(worker.release)) worker.network.set(url, new Response(body));
    worker.network.set(ROUTE, new Response('DEPLOYMENT_CHANGED_DURING_INSTALL'));
    await expect(worker.dispatch('install')).rejects.toThrow('Subresource integrity mismatch');
    expect(worker.buckets.get('opensimlab-b')).toBe(cache);
    for (const [url, body] of Object.entries(worker.release)) expect(await (await cache.match(url))!.text()).toBe(body);
    expect(cache.writes).toEqual([]);
  });

  it('durably prepares old-client pins and a distinct pending release before skipWaiting', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { '/index.html': HTML_A });
    await worker.seed('opensimlab-b', { '/index.html': HTML_B });
    const metadata = await worker.seed(STATE_CACHE, { [STATE_URL]: JSON.stringify({ active: 'opensimlab-a' }) });
    let preparedState: unknown;
    let preparedPins: string[] = [];
    worker.skipWaiting.mockImplementationOnce(async () => {
      preparedState = await (await metadata.match(STATE_URL))!.json();
      preparedPins = await Promise.all(['old-tab-A', 'new-tab-B'].map(async (id) =>
        (await metadata.match(clientKey(id)))!.text()));
    });
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    expect(worker.skipWaiting).toHaveBeenCalledOnce();
    expect(preparedState).toEqual({ active: 'opensimlab-a',
      pending: { release: 'opensimlab-b', previous: 'opensimlab-a' } });
    expect(preparedPins).toEqual(['opensimlab-a', 'opensimlab-a']);
    expect(worker.clients.claim).not.toHaveBeenCalled();
    await worker.dispatch('activate');
    expect(await (await metadata.match(STATE_URL))!.json()).toEqual({ active: 'opensimlab-b' });
    expect(worker.clients.claim).not.toHaveBeenCalled();
  });

  it.each(['second client pin', 'pending release commit'])('does not activate when preparation storage fails at %s', async (failure) => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { '/fonts/body.woff2': 'FONT_B' });
    const metadata = await worker.seed(STATE_CACHE, { [STATE_URL]: JSON.stringify({ active: 'opensimlab-a' }) });
    const failingPath = failure === 'second client pin' ? clientKey('new-tab-B') : STATE_URL;
    metadata.beforePut = (input) => { if (new URL(absolute(input)).pathname === failingPath) throw new Error('QuotaExceededError'); };
    const source = { postMessage: vi.fn() };
    await worker.dispatch('message', { data: { type: 'skip-waiting' }, source });
    expect(worker.skipWaiting).not.toHaveBeenCalled();
    expect(source.postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'update-preparation-failed' });
    expect(await (await metadata.match(STATE_URL))!.json()).toEqual({ active: 'opensimlab-a' });
    expect(await (await metadata.match(clientKey('old-tab-A')))!.text()).toBe('opensimlab-a');
    expect(worker.buckets.has('opensimlab-a')).toBe(true);
    const active = harness('A', { buckets: worker.buckets });
    expect(await (await active.request('/fonts/body.woff2', 'cors', 'GET', 'old-tab-A', ''))!.text()).toBe('FONT_A');
    expect(active.fetcher).not.toHaveBeenCalled();
  });

  it.each(['late client pin', 'active release commit'])('preserves the durable A fallback through activation failure at %s and restart', async (failure) => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { [ROUTE]: HTML_A, '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { [ROUTE]: HTML_B, '/fonts/body.woff2': 'FONT_B' });
    await worker.seed('other-app-cache', { '/other': 'OTHER' });
    const metadata = await worker.seed(STATE_CACHE, { [STATE_URL]: JSON.stringify({ active: 'opensimlab-a' }) });
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    worker.clients.matchAll.mockResolvedValue([{ id: 'old-tab-A', url: `${ORIGIN}${ROUTE}`, type: 'window' },
      { id: 'gap-client-A', url: `${ORIGIN}${ROUTE}`, type: 'window' }]);
    const failingPath = failure === 'late client pin' ? clientKey('gap-client-A') : STATE_URL;
    metadata.beforePut = (input) => { if (new URL(absolute(input)).pathname === failingPath) throw new Error('QuotaExceededError'); };
    await worker.dispatch('activate');
    expect(worker.clients.claim).not.toHaveBeenCalled();
    expect(worker.storage.delete).not.toHaveBeenCalled();
    expect(await (await metadata.match(STATE_URL))!.json()).toEqual({ active: 'opensimlab-a',
      pending: { release: 'opensimlab-b', previous: 'opensimlab-a' } });
    metadata.beforePut = undefined;
    const restarted = harness('B', { buckets: worker.buckets });
    for (const id of ['old-tab-A', 'gap-client-A', 'unlisted-gap-client-A']) {
      expect(await (await restarted.request('/fonts/body.woff2', 'cors', 'GET', id, ''))!.text()).toBe('FONT_A');
    }
    expect(await (await restarted.request(ROUTE, 'navigate', 'GET', '', 'new-document-B'))!.text()).toBe(HTML_B);
    expect(await (await restarted.request('/fonts/body.woff2', 'cors', 'GET', 'new-document-B', ''))!.text()).toBe('FONT_B');
    expect(restarted.fetcher).not.toHaveBeenCalled();
    expect(worker.buckets.has('opensimlab-a')).toBe(true);
    expect(worker.buckets.has('other-app-cache')).toBe(true);
  });

  it('fails new document and worker delivery closed when their pin cannot persist, while existing pins remain readable', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { [ASSET_A]: 'JS_A', '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { [ROUTE]: HTML_B, '/fonts/body.woff2': 'FONT_B' });
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    await worker.dispatch('activate');
    const metadata = worker.buckets.get(STATE_CACHE)!;
    metadata.beforePut = () => { throw new Error('QuotaExceededError'); };
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'old-tab-A', ''))!.text()).toBe('FONT_A');
    await expect(worker.request(ROUTE, 'navigate', 'GET', '', 'new-document-B')).rejects.toThrow('QuotaExceededError');
    await expect(worker.request(ASSET_A, 'same-origin', 'GET', 'old-tab-A', 'new-worker-A', 'worker')).rejects.toThrow('QuotaExceededError');
    expect(await metadata.match(clientKey('new-document-B'))).toBeUndefined();
    expect(await metadata.match(clientKey('new-worker-A'))).toBeUndefined();
    expect(worker.fetcher).not.toHaveBeenCalled();
  });

  it('pins an uncontrolled first-load page to B during natural activation, not an obsolete A cache', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { '/fonts/body.woff2': 'FONT_B' });
    worker.clients.matchAll.mockResolvedValue([{ id: 'first-load-B', url: `${ORIGIN}${ROUTE}`, type: 'window' }]);
    await worker.dispatch('activate');
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'first-load-B', ''))!.text()).toBe('FONT_B');
    expect(worker.skipWaiting).not.toHaveBeenCalled();
    expect(worker.clients.claim).not.toHaveBeenCalled();
    expect(worker.buckets.has('opensimlab-a')).toBe(false);
  });

  it('rejects an installation quota failure without deleting A or unrelated caches', async () => {
    const worker = harness('B', { beforePut: (name, input) => {
      if (name === 'opensimlab-b' && new URL(absolute(input)).pathname === ASSET_B) throw new Error('QuotaExceededError');
    } });
    const original = await worker.seed('opensimlab-a', { [ROUTE]: HTML_A });
    await worker.seed('other-app-cache', { '/other': 'OTHER' });
    for (const [url, body] of Object.entries(worker.release)) worker.network.set(url, new Response(body));
    await expect(worker.dispatch('install')).rejects.toThrow('QuotaExceededError');
    expect(worker.storage.delete).toHaveBeenCalledExactlyOnceWith('opensimlab-b');
    expect(worker.buckets.has('opensimlab-b')).toBe(false);
    expect(await (await original.match(ROUTE))!.text()).toBe(HTML_A);
    expect(worker.buckets.has('other-app-cache')).toBe(true);
    expect(worker.skipWaiting).not.toHaveBeenCalled();
  });

  it('retains an initializing A client omitted by matchAll without waiting for its readiness during activation or delivery', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { [ASSET_A]: 'JS_A', '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { [ROUTE]: HTML_B, '/fonts/body.woff2': 'FONT_B' });
    const metadata = await worker.seed(STATE_CACHE, { [STATE_URL]: JSON.stringify({ active: 'opensimlab-a' }),
      [clientKey('initializing-worker-A')]: 'opensimlab-a' });
    worker.clients.matchAll.mockResolvedValue([{ id: 'old-tab-A', url: `${ORIGIN}${ROUTE}`, type: 'window' }]);
    let resolveReady!: (client: BrowserClient) => void;
    const ready = new Promise<BrowserClient>((resolve) => { resolveReady = resolve; });
    worker.clients.get.mockImplementation(async (id) => id === 'initializing-worker-A' ? ready
      : { id, url: `${ORIGIN}${ROUTE}`, type: 'window' });
    await worker.dispatch('message', { data: { type: 'skip-waiting' } });
    await worker.dispatch('activate');
    expect(worker.clients.get).not.toHaveBeenCalled();
    expect(worker.clients.claim).not.toHaveBeenCalled();
    expect(await (await metadata.match(clientKey('initializing-worker-A')))!.text()).toBe('opensimlab-a');
    expect(worker.buckets.has('opensimlab-a')).toBe(true);
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'initializing-worker-A', '', 'font', false))!.text()).toBe('FONT_A');
    expect(await (await worker.request(ROUTE, 'navigate', 'GET', '', 'new-document-B', 'document', false))!.text()).toBe(HTML_B);
    expect(worker.clients.get).toHaveBeenCalledWith('initializing-worker-A');
    let settled = false;
    const completion = worker.settle().then(() => { settled = true; });
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(settled).toBe(false);
    resolveReady({ id: 'initializing-worker-A', url: `${ORIGIN}${ASSET_A}`, type: 'worker' });
    await completion;
    expect(worker.clients.get.mock.calls.filter(([id]) => id === 'initializing-worker-A')).toHaveLength(1);
    const restarted = harness('B', { buckets: worker.buckets });
    expect(await (await restarted.request(ASSET_A, 'cors', 'GET', 'initializing-worker-A', ''))!.text()).toBe('JS_A');
    expect(restarted.fetcher).not.toHaveBeenCalled();
  });

  it('prunes only confirmed closed pins after delivery and retires their release only at a later activation', async () => {
    const worker = harness('B');
    await worker.seed('opensimlab-a', { '/fonts/body.woff2': 'FONT_A' });
    await worker.seed('opensimlab-b', { '/fonts/body.woff2': 'FONT_B' });
    const metadata = await worker.seed(STATE_CACHE, { [STATE_URL]: JSON.stringify({ active: 'opensimlab-a' }),
      [clientKey('closed-A')]: 'opensimlab-a', [clientKey('live-B')]: 'opensimlab-b' });
    const live = { id: 'live-B', url: `${ORIGIN}${ROUTE}`, type: 'window' };
    worker.clients.matchAll.mockResolvedValue([live]);
    worker.clients.get.mockImplementation(async (id) => id === live.id ? live : undefined);
    await worker.dispatch('activate');
    expect(worker.clients.get).not.toHaveBeenCalled();
    expect(await metadata.match(clientKey('closed-A'))).toBeDefined();
    expect(worker.buckets.has('opensimlab-a')).toBe(true);
    expect(await (await worker.request('/fonts/body.woff2', 'cors', 'GET', 'live-B', ''))!.text()).toBe('FONT_B');
    expect(await metadata.match(clientKey('closed-A'))).toBeUndefined();
    expect(await metadata.match(clientKey('live-B'))).toBeDefined();
    expect(worker.buckets.has('opensimlab-a')).toBe(true);
    const next = harness('C', { buckets: worker.buckets });
    await next.seed('opensimlab-c', { '/index.html': 'HTML_C' });
    next.clients.matchAll.mockResolvedValue([live]);
    await next.dispatch('message', { data: { type: 'skip-waiting' } });
    await next.dispatch('activate');
    expect(worker.buckets.has('opensimlab-a')).toBe(false);
    expect(worker.buckets.has('opensimlab-b')).toBe(true);
    expect(next.clients.get).not.toHaveBeenCalled();
    expect(next.clients.claim).not.toHaveBeenCalled();
  });
});
