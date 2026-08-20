/**
 * @vitest-environment jsdom
 *
 * The application does not fall over because of state it did not write.
 *
 * Local storage is writable by anything the learner runs — an extension, a
 * console paste, a half-finished write from an older build. A preference that
 * came back as the wrong type used to reach a component and take the whole
 * simulator down with it, and the learner got a white page with no way to tell
 * whether the site was broken or they were.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useLocalPreference } from '@platform/ui';
import { ErrorBoundary } from '@platform/ui/ErrorBoundary';
import { getRegion, requireRegion } from '@anesthesia/region/profiles';

function stubStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  });
  return store;
}

function Preference({ name, fallback }: { name: string; fallback: unknown }) {
  const [value] = useLocalPreference(name, fallback as never);
  return createElement('output', {}, `${typeof value}:${JSON.stringify(value)}`);
}

describe('Requirement: Stored State Cannot Break The Application', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const render = (node: ReactNode) => { act(() => { root.render(node); }); };

  it('Scenario: a stored value of the wrong type is discarded', () => {
    stubStorage({
      'opensimlab.a-boolean': '"not-a-boolean"',
      'opensimlab.a-number': '{}',
      'opensimlab.an-array': '"nope"',
    });
    render(createElement(Preference, { key: 'b1', name: 'a-boolean', fallback: false }));
    expect(container.textContent).toBe('boolean:false');
    render(createElement(Preference, { key: 'n1', name: 'a-number', fallback: 42 }));
    expect(container.textContent).toBe('number:42');
    render(createElement(Preference, { key: 'a1', name: 'an-array', fallback: [] }));
    expect(container.textContent).toBe('object:[]');
  });

  it('Scenario: a value of the right type is still honoured', () => {
    stubStorage({ 'opensimlab.a-boolean': 'true', 'opensimlab.a-number': '288' });
    render(createElement(Preference, { key: 'b1', name: 'a-boolean', fallback: false }));
    expect(container.textContent).toBe('boolean:true');
    render(createElement(Preference, { key: 'n1', name: 'a-number', fallback: 42 }));
    expect(container.textContent).toBe('number:288');
  });

  it('Scenario: unparseable stored text falls back rather than throwing', () => {
    stubStorage({ 'opensimlab.a-boolean': '{ not json' });
    render(createElement(Preference, { name: 'a-boolean', fallback: true }));
    expect(container.textContent).toBe('boolean:true');
  });

  it('Scenario: a browser that refuses storage still works', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('storage disabled'); },
      setItem: () => { throw new Error('storage disabled'); },
      removeItem: () => { throw new Error('storage disabled'); },
    });
    render(createElement(Preference, { name: 'a-boolean', fallback: true }));
    expect(container.textContent).toBe('boolean:true');
  });

  it('Scenario: an unknown practice region is a miss, not a crash', () => {
    // This id comes from stored state. It used to throw from inside a render.
    expect(getRegion('not-a-country')).toBeUndefined();
    expect(() => requireRegion('not-a-country')).toThrow();
  });
});

describe('Requirement: A Render Error Leaves A Page, Not A White Screen', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    stubStorage();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function Explodes(): ReactNode {
    throw new Error('the physiology exploded');
  }

  it('Scenario: the learner is told what happened and how to recover', () => {
    act(() => {
      root.render(createElement(ErrorBoundary, {
        surface: 'simulator',
        children: createElement(Explodes),
      }));
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Something in the simulator broke');
    // It says whose fault it is, which matters when the reader is deciding
    // whether to report it or assume they are holding it wrong.
    expect(text).toContain('not something you did');
    // And it carries the detail a useful report needs.
    expect(text).toContain('the physiology exploded');
    // Three ways out, all things a stuck browser application responds to.
    const actions = [...container.querySelectorAll('button')].map((b) => b.textContent ?? '');
    expect(actions).toHaveLength(3);
    expect(actions.join(' ')).toContain('Reload');
    expect(actions.join(' ')).toContain('Clear stored settings');
  });

  it('Scenario: nothing about the error is sent anywhere', () => {
    // There is no error-reporting service here and there will not be one.
    const source = ErrorBoundary.toString();
    expect(source).not.toMatch(/fetch\(|sendBeacon|XMLHttpRequest/);
  });
});
