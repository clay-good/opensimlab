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
    const attempt: PracticeAttempt = { schemaVersion: 1, scenarioId: 'routine-induction',
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
});
