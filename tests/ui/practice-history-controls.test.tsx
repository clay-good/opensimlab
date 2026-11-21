/** @vitest-environment jsdom */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentRoute } from '@routes/DocumentRoute';
import { practiceHistoryExport, type PracticeAttempt } from '@anesthesia/catalog/practice-history';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe('private practice history controls', () => {
  it('keeps inspection, export, import, and erase together on the privacy page', () => {
    const markup = renderToStaticMarkup(<DocumentRoute path="/privacy" />);
    expect(markup).toContain('Your private practice history');
    expect(markup).toContain('<strong>0</strong> bounded attempt summaries');
    expect(markup).toContain('Export practice history');
    expect(markup).toContain('Merge into this device');
    expect(markup).toContain('Replace this device&#x27;s history');
    expect(markup).toContain('is the only way it moves');
    expect(markup).toContain('Erase practice history');
    expect(markup).toContain('No reflection, action list, physiology');
  });

  it('merges a progress file and says what it added and which statuses moved', () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(createElement(DocumentRoute, { path: '/privacy' })));
    const attempt: PracticeAttempt = { schemaVersion: 2, moduleId: 'anesthesia', scenarioId: 'routine-induction',
      contentVersion: '0.1.0', goalId: null, completedAt: '2026-09-03T09:30:00.000Z',
      simulatedSeconds: 120, objectives: [{ objectiveId: 'preoxygenate', outcome: 'met' }] };
    const textarea = container.querySelector<HTMLTextAreaElement>('#practice-history-import')!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
        .call(textarea, practiceHistoryExport([attempt]));
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const merge = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Merge into this device')!;
    act(() => merge.click());
    const status = container.querySelector('[role="status"]')?.textContent ?? '';
    expect(status).toContain('Merged. 1 added, 0 already here; 1 summaries stored.');
    expect(status).toContain('routine-induction preoxygenate: none → met');
    act(() => root.unmount());
  });

  /**
   * The progress file's privacy claim is that the file is the only way a
   * history moves. Every network surface a page could use is a spy here, and
   * the whole round trip - export, merge, replace, erase - has to leave all of
   * them untouched. This was resting on the offline suite, which proves the
   * app works without a network but not that this control never reaches for one.
   */
  it('exports, merges, replaces and erases without a single network request', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const network = {
      fetch: vi.fn(), sendBeacon: vi.fn(), xhrOpen: vi.fn(), webSocket: vi.fn(), eventSource: vi.fn(),
    };
    vi.stubGlobal('fetch', network.fetch);
    vi.stubGlobal('WebSocket', network.webSocket);
    vi.stubGlobal('EventSource', network.eventSource);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: network.sendBeacon });
    const open = vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(network.xhrOpen);
    vi.stubGlobal('confirm', () => true);
    let exported: Blob | null = null;
    const createObjectURL = vi.fn((blob: Blob) => { exported = blob; return 'blob:local'; });
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const attempt: PracticeAttempt = { schemaVersion: 2, moduleId: 'anesthesia', scenarioId: 'routine-induction',
      contentVersion: '0.1.0', goalId: null, completedAt: '2026-09-03T09:30:00.000Z',
      simulatedSeconds: 120, objectives: [{ objectiveId: 'preoxygenate', outcome: 'met' }] };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(createElement(DocumentRoute, { path: '/privacy' })));
    const button = (text: string) => [...container.querySelectorAll('button')].find((candidate) => candidate.textContent === text)!;
    const paste = (text: string) => act(() => {
      const textarea = container.querySelector<HTMLTextAreaElement>('#practice-history-import')!;
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, text);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    paste(practiceHistoryExport([attempt]));
    act(() => button('Merge into this device').click());
    act(() => button('Export practice history').click());
    expect(click).toHaveBeenCalledTimes(1);
    const file = await exported!.text();
    paste(file);
    act(() => button('Replace this device\'s history').click());
    expect(container.querySelector('[role="status"]')?.textContent).toContain('1 summaries stored');
    act(() => button('Erase practice history').click());

    expect(network.fetch).not.toHaveBeenCalled();
    expect(network.sendBeacon).not.toHaveBeenCalled();
    expect(network.xhrOpen).not.toHaveBeenCalled();
    expect(network.webSocket).not.toHaveBeenCalled();
    expect(network.eventSource).not.toHaveBeenCalled();
    act(() => root.unmount());
    open.mockRestore();
    click.mockRestore();
    vi.unstubAllGlobals();
  });
});
