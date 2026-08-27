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

describe('Requirement: Explicit update acceptance waits for the intended controller', () => {
  class Worker extends EventTarget {
    state: ServiceWorkerState = 'installed';
    readonly postMessage = vi.fn();
  }
  class Container extends EventTarget {
    controller: Worker | null = new Worker();
    readonly getRegistration = vi.fn();
    readonly register = vi.fn();
  }
  let worker: Worker; let serviceWorker: Container;
  let registration: { waiting: Worker | null };
  let reload: ReturnType<typeof vi.fn>;
  let accept: () => Promise<void>;
  let failedEvent: string;
  let failures = vi.fn<() => void>();

  beforeEach(async () => {
    vi.resetModules(); worker = new Worker(); serviceWorker = new Container();
    registration = { waiting: worker }; serviceWorker.getRegistration.mockResolvedValue(registration);
    reload = vi.fn(); vi.stubGlobal('location', { reload });
    vi.stubGlobal('navigator', { serviceWorker, userAgent: 'TestRunner' });
    ({ acceptUpdate: accept, UPDATE_FAILED_EVENT: failedEvent } = await import('@platform/offline/register'));
    failures = vi.fn(); window.addEventListener(failedEvent, failures);
  });
  afterEach(() => { window.removeEventListener(failedEvent, failures); vi.unstubAllGlobals(); });

  function controls(target = worker) {
    serviceWorker.controller = target;
    serviceWorker.dispatchEvent(new Event('controllerchange'));
  }
  function failureMessage(source = worker, type = 'update-preparation-failed') {
    const event = new MessageEvent('message', { data: { type } });
    Object.defineProperty(event, 'source', { value: source });
    return event;
  }

  it('subscribes before the preparation request and permits retry after the intended worker fails', async () => {
    const subscribe = vi.spyOn(serviceWorker, 'addEventListener');
    worker.postMessage.mockImplementationOnce(() => {
      expect(subscribe).toHaveBeenCalledWith('message', expect.any(Function));
      serviceWorker.dispatchEvent(failureMessage());
    });
    await accept(); expect(failures).toHaveBeenCalledOnce(); expect(reload).not.toHaveBeenCalled();
    await accept(); expect(worker.postMessage).toHaveBeenCalledTimes(2);
    controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('ignores failure messages from another worker or with a different type', async () => {
    await accept();
    serviceWorker.dispatchEvent(failureMessage(new Worker()));
    serviceWorker.dispatchEvent(failureMessage(worker, 'unrelated-message'));
    expect(failures).not.toHaveBeenCalled(); await accept(); expect(worker.postMessage).toHaveBeenCalledOnce();
    controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('removes failure listeners and prevents a retained failed-attempt handler from canceling its retry', async () => {
    const subscribe = vi.spyOn(serviceWorker, 'addEventListener'); const remove = vi.spyOn(serviceWorker, 'removeEventListener');
    await accept(); const stale = subscribe.mock.calls.find(([type]) => type === 'message')![1] as EventListener;
    serviceWorker.dispatchEvent(failureMessage()); serviceWorker.dispatchEvent(failureMessage());
    expect(failures).toHaveBeenCalledOnce(); expect(remove).toHaveBeenCalledWith('message', stale);
    await accept(); stale(failureMessage()); await accept();
    expect(failures).toHaveBeenCalledOnce(); expect(worker.postMessage).toHaveBeenCalledTimes(2);
    controls(); serviceWorker.dispatchEvent(failureMessage());
    expect(failures).toHaveBeenCalledOnce(); expect(reload).toHaveBeenCalledOnce();
    expect(remove.mock.calls.filter(([type]) => type === 'message')).toHaveLength(2);
  });

  it('does not reload merely because skip-waiting was sent or an unrelated worker controls', async () => {
    await accept();
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'skip-waiting' });
    expect(reload).not.toHaveBeenCalled();
    controls(new Worker()); expect(reload).not.toHaveBeenCalled();
    controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('subscribes before postMessage so an immediate controllerchange is not missed', async () => {
    const subscribe = vi.spyOn(serviceWorker, 'addEventListener');
    worker.postMessage.mockImplementation(() => {
      expect(subscribe).toHaveBeenCalledWith('controllerchange', expect.any(Function));
      expect(reload).not.toHaveBeenCalled(); controls();
    });
    await accept(); expect(reload).toHaveBeenCalledOnce();
  });

  it('coalesces requests while registration is pending and reloads once across duplicate events and clicks', async () => {
    let resolve!: (value: typeof registration) => void;
    serviceWorker.getRegistration.mockReturnValue(new Promise<typeof registration>((done) => { resolve = done; }));
    const first = accept(); const second = accept();
    expect(serviceWorker.getRegistration).toHaveBeenCalledOnce();
    resolve(registration); await Promise.all([first, second]); await accept();
    expect(worker.postMessage).toHaveBeenCalledOnce(); expect(reload).not.toHaveBeenCalled();
    controls(); controls(); worker.dispatchEvent(new Event('statechange')); await accept();
    expect(reload).toHaveBeenCalledOnce(); expect(worker.postMessage).toHaveBeenCalledOnce();
  });

  it.each([null, undefined])('does not reload or leave listeners when there is no waiting worker (%s)', async (missing) => {
    serviceWorker.getRegistration.mockResolvedValue(missing === null ? { waiting: null } : undefined);
    const subscribe = vi.spyOn(serviceWorker, 'addEventListener');
    await accept(); controls();
    expect(subscribe).not.toHaveBeenCalled(); expect(worker.postMessage).not.toHaveBeenCalled(); expect(reload).not.toHaveBeenCalled();
    serviceWorker.getRegistration.mockResolvedValue(registration); await accept(); controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('contains registration lookup failure and permits an explicit retry without reloading', async () => {
    serviceWorker.getRegistration.mockRejectedValueOnce(new Error('lookup unavailable'));
    await expect(accept()).resolves.toBeUndefined(); expect(reload).not.toHaveBeenCalled();
    await accept(); controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('cleans up failed postMessage handlers and rejects their retained callbacks after retry', async () => {
    const subscribe = vi.spyOn(serviceWorker, 'addEventListener'); const remove = vi.spyOn(serviceWorker, 'removeEventListener');
    const workerSubscribe = vi.spyOn(worker, 'addEventListener');
    worker.postMessage.mockImplementationOnce(() => { throw new Error('worker disappeared'); });
    await expect(accept()).resolves.toBeUndefined(); expect(reload).not.toHaveBeenCalled();
    const stale = subscribe.mock.calls.find(([type]) => type === 'controllerchange')![1] as EventListener;
    const staleState = workerSubscribe.mock.calls.find(([type]) => type === 'statechange')![1] as EventListener;
    expect(remove).toHaveBeenCalledWith('controllerchange', stale);
    const failed = worker; worker = new Worker(); registration.waiting = worker;
    await accept(); serviceWorker.controller = failed; stale(new Event('controllerchange'));
    failed.state = 'redundant'; staleState(new Event('statechange')); await accept();
    expect(worker.postMessage).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled(); controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('ignores an already redundant waiting reference and keeps acceptance retryable', async () => {
    worker.state = 'redundant'; await accept();
    expect(worker.postMessage).not.toHaveBeenCalled(); expect(reload).not.toHaveBeenCalled();
    worker = new Worker(); registration.waiting = worker; await accept(); controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('abandons a redundant accepted worker, removes its listeners, and allows accepting a later worker', async () => {
    const removeContainer = vi.spyOn(serviceWorker, 'removeEventListener'); const removeWorker = vi.spyOn(worker, 'removeEventListener');
    await accept(); worker.state = 'redundant'; worker.dispatchEvent(new Event('statechange')); controls();
    expect(reload).not.toHaveBeenCalled();
    expect(removeContainer).toHaveBeenCalledWith('controllerchange', expect.any(Function));
    expect(removeContainer).toHaveBeenCalledWith('message', expect.any(Function));
    expect(removeWorker).toHaveBeenCalledWith('statechange', expect.any(Function));
    worker = new Worker(); registration.waiting = worker; await accept(); controls(); expect(reload).toHaveBeenCalledOnce();
  });

  it('removes successful listeners and never reloads a tab that did not accept the update', async () => {
    controls(); expect(reload).not.toHaveBeenCalled();
    const removeContainer = vi.spyOn(serviceWorker, 'removeEventListener'); const removeWorker = vi.spyOn(worker, 'removeEventListener');
    serviceWorker.controller = new Worker(); await accept(); controls();
    expect(removeContainer).toHaveBeenCalledWith('controllerchange', expect.any(Function));
    expect(removeWorker).toHaveBeenCalledWith('statechange', expect.any(Function));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does nothing in a browser without service worker support', async () => {
    vi.stubGlobal('navigator', {}); await accept(); expect(reload).not.toHaveBeenCalled();
  });
});
