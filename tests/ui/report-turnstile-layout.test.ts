/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderTurnstile } from '@platform/reporting/client';

describe('report security check in a narrow dialog', () => {
  it('hides the optional update notice while a modal owns the reading surface', () => {
    const css = readFileSync(join(process.cwd(), 'src/platform/tokens/base.css'), 'utf8');
    const rule = css.match(/body:has\(\[aria-modal='true'\]\)\s+\.update-notice--page\s*\{[^}]+\}/)?.[0];
    expect(rule).toContain('visibility: hidden');
    const style = document.createElement('style'); style.textContent = rule!;
    const notice = document.createElement('div'); notice.className = 'update-notice update-notice--page';
    const dialog = document.createElement('div'); dialog.setAttribute('aria-modal', 'true');
    const inlineNotice = document.createElement('div'); inlineNotice.className = 'update-notice update-notice--session';
    dialog.append(inlineNotice);
    document.head.append(style); document.body.append(notice);
    try {
      expect(getComputedStyle(notice).visibility).toBe('visible');
      document.body.append(dialog);
      expect(getComputedStyle(notice).visibility).toBe('hidden');
      expect(getComputedStyle(inlineNotice).visibility).toBe('visible');
      expect(getComputedStyle(inlineNotice).display).not.toBe('none');
      dialog.remove();
      expect(getComputedStyle(notice).visibility).toBe('visible');
    } finally { style.remove(); notice.remove(); dialog.remove(); }
  });

  it('uses the 150 px compact widget without changing its security or privacy options', () => {
    const render = vi.fn(() => 'widget');
    const host = document.createElement('div');
    const callbacks = { ready: vi.fn(), expired: vi.fn(), error: vi.fn() };
    const api = { render, remove: vi.fn(), reset: vi.fn() };
    expect(renderTurnstile(api, host, 'test-sitekey', callbacks)).toBe('widget');
    expect(render).toHaveBeenCalledExactlyOnceWith(host, {
      sitekey: 'test-sitekey', action: 'scenario-report', appearance: 'interaction-only',
      size: 'compact', theme: 'auto', 'response-field': false, 'feedback-enabled': false,
      callback: callbacks.ready, 'expired-callback': callbacks.expired,
      'timeout-callback': callbacks.expired, 'unsupported-callback': callbacks.error,
      'error-callback': callbacks.error,
    });
    expect(api.remove).not.toHaveBeenCalled(); expect(api.reset).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('resize'));
    expect(render).toHaveBeenCalledOnce();
    expect(api.remove).not.toHaveBeenCalled(); expect(api.reset).not.toHaveBeenCalled();
  });

  it('reserves the documented compact height and centers it without scaling or clipping', () => {
    const css = readFileSync(join(process.cwd(), 'src/platform/reporting/reporting.css'), 'utf8');
    const rule = css.match(/\.problem-report__turnstile\s*\{([^}]+)\}/)?.[1];
    expect(rule).toContain('min-block-size: 140px');
    expect(rule).toContain('display: flex');
    expect(rule).toContain('justify-content: center');
    expect(rule).not.toMatch(/transform|overflow:\s*(hidden|clip)|scale/);
  });
});
