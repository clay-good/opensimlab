/**
 * @vitest-environment jsdom
 *
 * Acceptance tests for design/layout's resizable regions.
 *
 * The cockpit's geometry used to be fixed pixels: a 220 px action region whatever
 * the display, and a divider the specification called draggable that nothing
 * could drag. These cover the behaviour that replaced it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createElement, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useResizableRegion } from '@anesthesia/ui/useResizableRegion';

function Harness({ axis, invert }: { axis: 'row' | 'column'; invert?: boolean }) {
  const region = useResizableRegion({
    storageKey: `test.${axis}`,
    label: 'Test region',
    axis,
    min: 100,
    max: 500,
    ...(invert === undefined ? {} : { invert }),
    measure: () => 200,
  });
  const ref = useRef<HTMLDivElement>(null);
  return createElement('div', {
    ref,
    'data-size': region.size === null ? 'default' : String(region.size),
    ...region.handleProps,
  });
}

describe('Requirement: The Divider Is Draggable Within Bounds', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // This jsdom build ships no `localStorage`, which is exactly why the hook
    // guards every access to it: a device that refuses storage still resizes,
    // it just does not remember across loads.
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => store.clear(),
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const render = (axis: 'row' | 'column', invert?: boolean) => {
    act(() => { root.render(createElement(Harness, { axis, ...(invert === undefined ? {} : { invert }) })); });
    return container.firstElementChild as HTMLElement;
  };

  const press = (element: HTMLElement, key: string) => {
    act(() => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    });
  };

  it('Scenario: it exposes itself as a separator with its value and its bounds', () => {
    const handle = render('row', true);
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    expect(handle.getAttribute('aria-valuemin')).toBe('100');
    expect(handle.getAttribute('aria-valuemax')).toBe('500');
    expect(Number(handle.getAttribute('aria-valuenow'))).toBe(200);
    expect(handle.tabIndex).toBe(0);
  });

  it('Scenario: the arrow keys move it, and every press counts', () => {
    // Reading the size from the closure loses presses: four presses moved the
    // region one step, because each computed from the same stale value.
    const handle = render('row', true);
    for (let i = 0; i < 4; i += 1) press(handle, 'ArrowUp');
    expect(handle.dataset.size).toBe('264');
  });

  it('Scenario: up grows the region below the handle, down shrinks it', () => {
    const handle = render('row', true);
    press(handle, 'ArrowUp');
    expect(Number(handle.dataset.size)).toBeGreaterThan(200);
    press(handle, 'ArrowDown');
    press(handle, 'ArrowDown');
    expect(Number(handle.dataset.size)).toBeLessThan(200);
  });

  it('Scenario: right grows the region left of a vertical handle', () => {
    const handle = render('column');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    press(handle, 'ArrowRight');
    expect(Number(handle.dataset.size)).toBeGreaterThan(200);
  });

  it('Scenario: it snaps back inside its bounds rather than going past them', () => {
    const handle = render('row', true);
    for (let i = 0; i < 60; i += 1) press(handle, 'ArrowUp');
    expect(Number(handle.dataset.size)).toBe(500);
    for (let i = 0; i < 120; i += 1) press(handle, 'ArrowDown');
    expect(Number(handle.dataset.size)).toBe(100);
  });

  it('Scenario: the chosen size persists on this device', () => {
    const handle = render('row', true);
    press(handle, 'ArrowUp');
    expect(localStorage.getItem('test.row')).toBe(String(handle.dataset.size));
    // Stored as a whole number, not a measured fraction.
    expect(localStorage.getItem('test.row')).toMatch(/^\d+$/);
  });

  it('Scenario: Home restores the default and forgets the preference', () => {
    const handle = render('row', true);
    press(handle, 'ArrowUp');
    expect(localStorage.getItem('test.row')).not.toBeNull();
    press(handle, 'Home');
    expect(handle.dataset.size).toBe('default');
    expect(localStorage.getItem('test.row')).toBeNull();
  });
});
