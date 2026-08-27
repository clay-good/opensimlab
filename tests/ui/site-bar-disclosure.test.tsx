/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteBar } from '@platform/ui/SiteBar';

describe('Site navigation disclosure', () => {
  let root: Root; let host: HTMLDivElement; let outside: HTMLButtonElement;
  const details = () => host.querySelector('details')!;
  const summary = () => host.querySelector('summary')!;
  const link = () => host.querySelector<HTMLAnchorElement>('nav a')!;
  function key(target: HTMLElement, value: string, handled = false) {
    const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    if (handled) event.preventDefault();
    act(() => target.dispatchEvent(event));
    return event;
  }
  function open() { act(() => summary().click()); expect(details().open).toBe(true); }

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); outside = document.createElement('button');
    outside.textContent = 'Outside navigation'; document.body.append(host, outside);
    root = createRoot(host); act(() => root.render(<SiteBar />));
  });
  afterEach(() => { act(() => root.unmount()); host.remove(); outside.remove(); vi.restoreAllMocks(); });

  it('starts closed and leaves toggling to the native summary', () => {
    expect(details().open).toBe(false);
    expect(summary().textContent).toBe('Browse');
    open();
    act(() => summary().click());
    expect(details().open).toBe(false);
  });

  it.each(['summary', 'link'] as const)('closes on Escape from %s and restores Browse focus without scrolling', (target) => {
    const bubbled = vi.fn();
    act(() => root.render(<div onKeyDown={bubbled}><SiteBar /></div>));
    open();
    const control = target === 'summary' ? summary() : link(); control.focus();
    const focus = vi.spyOn(summary(), 'focus');
    expect(key(control, 'Escape').defaultPrevented).toBe(true);
    expect(details().open).toBe(false);
    expect(document.activeElement).toBe(summary());
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(bubbled).not.toHaveBeenCalled();
  });

  it('does not consume Escape while closed', () => {
    summary().focus(); const focus = vi.spyOn(summary(), 'focus');
    expect(key(summary(), 'Escape').defaultPrevented).toBe(false);
    expect(details().open).toBe(false); expect(focus).not.toHaveBeenCalled();
  });

  it('respects Escape already handled by a descendant', () => {
    open(); link().focus(); const focus = vi.spyOn(summary(), 'focus');
    expect(key(link(), 'Escape', true).defaultPrevented).toBe(true);
    expect(details().open).toBe(true); expect(document.activeElement).toBe(link());
    expect(focus).not.toHaveBeenCalled();
  });

  it.each(['Tab', 'Enter', ' ', 'ArrowDown', 'ArrowUp', 'Home', 'End'])('leaves %s to native navigation', (value) => {
    open(); summary().focus(); const focus = vi.spyOn(summary(), 'focus');
    expect(key(summary(), value).defaultPrevented).toBe(false);
    expect(focus).not.toHaveBeenCalled();
  });

  it('does not handle Escape or redirect focus outside navigation', () => {
    open(); outside.focus(); const focus = vi.spyOn(summary(), 'focus');
    expect(key(outside, 'Escape').defaultPrevented).toBe(false);
    expect(details().open).toBe(true); expect(document.activeElement).toBe(outside);
    expect(focus).not.toHaveBeenCalled();
  });

  it('preserves the native open state through an unrelated parent render', () => {
    open(); link().focus();
    act(() => root.render(<SiteBar current="/anesthesia" />));
    expect(details().open).toBe(true); expect(document.activeElement).toBe(link());
  });

  it('starts closed again after an actual remount', () => {
    open(); act(() => root.render(null)); act(() => root.render(<SiteBar />));
    expect(details().open).toBe(false);
  });
});
