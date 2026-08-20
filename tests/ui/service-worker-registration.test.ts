/**
 * @vitest-environment jsdom
 *
 * Registration guards for platform/offline-pwa.
 *
 * The dev-mode case is here because it was a real hour lost: `sw.js` ships from
 * `public/` unprocessed, so on a dev server its cache version is still the
 * literal placeholder, and one unchanging cache name serves the first build it
 * ever saw until someone thinks to look in the application panel. A contributor
 * should never have to know that.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '@platform/offline/register';

describe('Requirement: The service worker never serves a stale development build', () => {
  let unregistered: number;
  let deleted: string[];

  beforeEach(() => {
    unregistered = 0;
    deleted = [];
    const registration = { unregister: () => { unregistered += 1; return Promise.resolve(true); } };
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh) TestRunner',
      serviceWorker: {
        register: () => Promise.reject(new Error('registration must not be attempted in dev')),
        getRegistrations: () => Promise.resolve([registration]),
        getRegistration: () => Promise.resolve(registration),
        controller: null,
        addEventListener: () => {},
      },
    });
    vi.stubGlobal('caches', {
      keys: () => Promise.resolve(['opensimlab-__CACHE_VERSION__', 'something-else']),
      delete: (name: string) => { deleted.push(name); return Promise.resolve(true); },
    });
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => store.clear(),
    });
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('Scenario: it declines to register, and says why', () => {
    const outcome = registerServiceWorker();
    expect(outcome.registered).toBe(false);
    expect(outcome.reason).toContain('development');
    expect(outcome.reason).toContain('stale');
  });

  it('Scenario: a contributor who already has one is released from it', async () => {
    registerServiceWorker();
    await Promise.resolve();
    await Promise.resolve();
    expect(unregistered).toBe(1);
    expect(deleted).toContain('opensimlab-__CACHE_VERSION__');
    // Someone else's cache on the same localhost origin is not ours to delete.
    expect(deleted).not.toContain('something-else');
  });
});
