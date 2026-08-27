/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateNotice, UpdateProvider, useUpdateAvailable } from '@platform/offline/UpdateNotice';
import { UPDATE_READY_EVENT, UPDATE_FAILED_EVENT, acceptUpdate } from '@platform/offline/register';

vi.mock('@platform/offline/register', () => ({
  UPDATE_READY_EVENT: 'opensimlab:update-ready', UPDATE_FAILED_EVENT: 'opensimlab:update-failed',
  acceptUpdate: vi.fn(async () => {}),
}));

function Availability() {
  const available = useUpdateAvailable();
  return <span data-update-available={String(available)} />;
}

type WaitingRegistration = { waiting: object | null } | undefined;
function deferredRegistration() {
  let resolve!: (registration: WaitingRegistration) => void;
  const promise = new Promise<WaitingRegistration>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('Shared quiet update offer', () => {
  let root: Root; let container: HTMLDivElement;
  let serviceWorkerDescriptor: PropertyDescriptor | undefined;
  let surfaces: { page: boolean; session: boolean };
  function render(patch: Partial<typeof surfaces> = {}) {
    surfaces = { ...surfaces, ...patch };
    act(() => root.render(<StrictMode><UpdateProvider>
      <Availability />
      {surfaces.page && <div data-surface="page"><UpdateNotice /></div>}
      {surfaces.session && <div data-surface="session"><UpdateNotice surface="session" /></div>}
    </UpdateProvider></StrictMode>));
  }
  const surface = (name: 'page' | 'session') => container.querySelector<HTMLElement>(`[data-surface="${name}"]`)!;
  const available = () => container.querySelector('[data-update-available]')?.getAttribute('data-update-available') === 'true';
  function mountWithRegistration(getRegistration: () => Promise<WaitingRegistration>, controller: object | null = {}, dev = false) {
    act(() => root.render(null));
    vi.stubEnv('DEV', dev);
    const serviceWorker = { controller, getRegistration };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
    render();
    return serviceWorker;
  }
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
    vi.clearAllMocks(); container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    surfaces = { page: true, session: false }; render();
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove(); vi.unstubAllEnvs(); vi.restoreAllMocks();
    if (serviceWorkerDescriptor) Object.defineProperty(navigator, 'serviceWorker', serviceWorkerDescriptor);
    else Reflect.deleteProperty(navigator, 'serviceWorker');
  });
  const emit = (type: string) => act(() => window.dispatchEvent(new Event(type)));

  it.each(['page', 'session'] as const)('keeps the same focused %s retry button usable after a calm failure without auto-accepting', (name) => {
    render({ page: name === 'page', session: name === 'session' });
    expect(container.textContent).toBe(''); emit(UPDATE_READY_EVENT);
    const retry = container.querySelector<HTMLButtonElement>('button')!; retry.focus();
    act(() => retry.click()); expect(acceptUpdate).toHaveBeenCalledOnce();
    emit(UPDATE_FAILED_EVENT);
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Update could not be prepared. Your session is unchanged. Try again later.');
    expect(container.querySelector('button')).toBe(retry); expect(document.activeElement).toBe(retry);
    expect(retry.disabled).toBe(false); expect(acceptUpdate).toHaveBeenCalledOnce();
    act(() => retry.click()); expect(acceptUpdate).toHaveBeenCalledTimes(2);
    expect(container.textContent).not.toContain('Update could not be prepared');
  });

  it('can dismiss the failure notice without retrying or changing the session', () => {
    emit(UPDATE_READY_EVENT); emit(UPDATE_FAILED_EVENT);
    const later = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Not now')!;
    act(() => later.click()); expect(container.textContent).toBe(''); expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('retains readiness for a session offer mounted after the page notice has unmounted', () => {
    const launcher = document.createElement('button'); document.body.append(launcher); launcher.focus();
    try {
      render({ page: false }); emit(UPDATE_READY_EVENT);
      expect(available()).toBe(true); expect(container.querySelector('button')).toBeNull();
      expect(document.activeElement).toBe(launcher);
      render({ session: true });
      expect(surface('session').textContent).toContain('A newer version is ready.');
      expect(surface('session').textContent).toContain('Reloading ends this session and clears its unsaved progress.');
      expect(surface('session').querySelectorAll('button')).toHaveLength(1);
      expect(surface('session').textContent).not.toContain('Not now');
      expect(document.activeElement).toBe(launcher);
      render({ session: false }); render({ session: true });
      expect(surface('session').textContent).toContain('A newer version is ready.');
      expect(acceptUpdate).not.toHaveBeenCalled();
    } finally { launcher.remove(); }
  });

  it('dismisses the page promotion and indicator without removing the update from session options', () => {
    emit(UPDATE_READY_EVENT); expect(available()).toBe(true);
    const later = [...surface('page').querySelectorAll('button')].find((button) => button.textContent === 'Not now')!;
    act(() => later.click()); expect(available()).toBe(false); expect(surface('page').textContent).toBe('');
    render({ session: true });
    expect(surface('session').textContent).toContain('A newer version is ready.');
    expect(surface('session').textContent).not.toContain('Not now');
    render({ page: false, session: false }); render({ page: true, session: true });
    expect(surface('page').textContent).toBe(''); expect(available()).toBe(false);
    expect(surface('session').querySelector('button')?.textContent).toBe('Reload to update');
    expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('retains late failure across closed and reopened session options, including after page dismissal', () => {
    emit(UPDATE_READY_EVENT);
    const later = [...surface('page').querySelectorAll('button')].find((button) => button.textContent === 'Not now')!;
    act(() => later.click()); render({ page: false }); emit(UPDATE_FAILED_EVENT);
    render({ session: true });
    expect(surface('session').textContent).toContain('Update could not be prepared. Your session is unchanged. Try again later.');
    expect(available()).toBe(false);
    render({ session: false }); render({ session: true });
    expect(surface('session').textContent).toContain('Update could not be prepared');
    expect(acceptUpdate).not.toHaveBeenCalled();
    const retry = surface('session').querySelector<HTMLButtonElement>('button')!; retry.focus();
    act(() => retry.click());
    expect(acceptUpdate).toHaveBeenCalledOnce();
    expect(surface('session').textContent).not.toContain('Update could not be prepared');
    expect(document.activeElement).toBe(retry);
  });

  it('retains subscriptions while offer surfaces unmount and cleans them up with the provider', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    render({ page: false, session: false });
    expect(remove).not.toHaveBeenCalledWith(UPDATE_READY_EVENT, expect.any(Function));
    expect(remove).not.toHaveBeenCalledWith(UPDATE_FAILED_EVENT, expect.any(Function));
    emit(UPDATE_READY_EVENT); expect(available()).toBe(true);
    act(() => root.render(null));
    expect(remove).toHaveBeenCalledWith(UPDATE_READY_EVENT, expect.any(Function));
    expect(remove).toHaveBeenCalledWith(UPDATE_FAILED_EVENT, expect.any(Function));
    emit(UPDATE_FAILED_EVENT); expect(container.textContent).toBe(''); expect(acceptUpdate).not.toHaveBeenCalled();
    remove.mockRestore();
  });

  it('renders no unsolicited offer or indicator outside a provider', () => {
    act(() => root.render(<StrictMode><Availability /><UpdateNotice /><UpdateNotice surface="session" /></StrictMode>));
    emit(UPDATE_READY_EVENT); emit(UPDATE_FAILED_EVENT);
    expect(available()).toBe(false); expect(container.textContent).toBe('');
    expect(container.querySelector('button')).toBeNull(); expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('recovers an already waiting update whose ready event preceded provider subscription', async () => {
    act(() => root.render(null)); emit(UPDATE_READY_EVENT);
    const pending = deferredRegistration();
    const getRegistration = vi.fn(() => pending.promise);
    mountWithRegistration(getRegistration);
    expect(available()).toBe(false);
    await act(async () => { pending.resolve({ waiting: {} }); await pending.promise; });
    expect(getRegistration).toHaveBeenCalled(); expect(available()).toBe(true);
    expect(surface('page').textContent).toContain('A newer version is ready.');
    expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'registration', registration: undefined, controller: {} },
    { label: 'waiting worker', registration: { waiting: null }, controller: {} },
    { label: 'controlling worker', registration: { waiting: {} }, controller: null },
  ])('does not offer a reconciled update without a $label', async ({ registration, controller }) => {
    const getRegistration = vi.fn(async () => registration);
    mountWithRegistration(getRegistration, controller);
    await act(async () => { await Promise.resolve(); });
    expect(getRegistration).toHaveBeenCalled(); expect(available()).toBe(false);
    expect(container.querySelector('button')).toBeNull(); expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('does not let a late registration lookup erase newer failure or dismissal state', async () => {
    const pending = deferredRegistration(); mountWithRegistration(() => pending.promise);
    emit(UPDATE_FAILED_EVENT);
    const later = [...surface('page').querySelectorAll('button')].find((button) => button.textContent === 'Not now')!;
    act(() => later.click()); render({ session: true });
    const retry = surface('session').querySelector<HTMLButtonElement>('button')!; retry.focus();
    await act(async () => { pending.resolve({ waiting: {} }); await pending.promise; });
    expect(available()).toBe(false); expect(surface('page').textContent).toBe('');
    expect(surface('session').textContent).toContain('Update could not be prepared. Your session is unchanged. Try again later.');
    expect(document.activeElement).toBe(retry); expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('ignores a stale Strict Mode lookup after the effect has cleaned up and subscribed again', async () => {
    const stale = deferredRegistration(); const current = deferredRegistration();
    const getRegistration = vi.fn(() => current.promise).mockImplementationOnce(() => stale.promise);
    mountWithRegistration(getRegistration); expect(getRegistration).toHaveBeenCalledTimes(2);
    await act(async () => { stale.resolve({ waiting: {} }); await stale.promise; });
    expect(available()).toBe(false); expect(container.querySelector('button')).toBeNull();
    await act(async () => { current.resolve(undefined); await current.promise; });
    expect(available()).toBe(false); expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('does not inspect a late lookup result after the provider unmounts', async () => {
    const pending = deferredRegistration(); const serviceWorker = mountWithRegistration(() => pending.promise);
    act(() => root.render(null));
    const controller = vi.fn(() => ({}));
    Object.defineProperty(serviceWorker, 'controller', { configurable: true, get: controller });
    await act(async () => { pending.resolve({ waiting: {} }); await pending.promise; });
    expect(controller).not.toHaveBeenCalled(); expect(container.textContent).toBe('');
    expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('contains registration lookup rejection and continues listening for a later ready event', async () => {
    const getRegistration = vi.fn(async () => { throw new Error('registration unavailable'); });
    mountWithRegistration(getRegistration);
    await act(async () => { await Promise.resolve(); });
    expect(getRegistration).toHaveBeenCalled(); expect(available()).toBe(false);
    expect(container.querySelector('button')).toBeNull(); emit(UPDATE_READY_EVENT);
    expect(available()).toBe(true); expect(acceptUpdate).not.toHaveBeenCalled();
  });

  it('never reconciles a leftover development worker', async () => {
    const getRegistration = vi.fn(async () => ({ waiting: {} }));
    mountWithRegistration(getRegistration, {}, true);
    await act(async () => { await Promise.resolve(); });
    expect(getRegistration).not.toHaveBeenCalled(); expect(available()).toBe(false);
    expect(container.querySelector('button')).toBeNull(); expect(acceptUpdate).not.toHaveBeenCalled();
  });
});
