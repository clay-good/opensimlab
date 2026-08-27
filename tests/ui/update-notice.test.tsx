/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateNotice } from '@platform/offline/UpdateNotice';
import { UPDATE_READY_EVENT, UPDATE_FAILED_EVENT, acceptUpdate } from '@platform/offline/register';

vi.mock('@platform/offline/register', () => ({
  UPDATE_READY_EVENT: 'opensimlab:update-ready', UPDATE_FAILED_EVENT: 'opensimlab:update-failed',
  acceptUpdate: vi.fn(async () => {}),
}));

describe('Quiet update preparation failure notice', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks(); container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    act(() => root.render(<StrictMode><UpdateNotice /></StrictMode>));
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const emit = (type: string) => act(() => window.dispatchEvent(new Event(type)));

  it('keeps the same focused retry button usable after a calm failure without auto-accepting', () => {
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

  it('cleans up both event listeners when the notice unmounts', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    act(() => root.render(null));
    expect(remove).toHaveBeenCalledWith(UPDATE_READY_EVENT, expect.any(Function));
    expect(remove).toHaveBeenCalledWith(UPDATE_FAILED_EVENT, expect.any(Function));
    emit(UPDATE_FAILED_EVENT); expect(container.textContent).toBe(''); expect(acceptUpdate).not.toHaveBeenCalled();
    remove.mockRestore();
  });
});
