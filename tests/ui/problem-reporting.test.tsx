/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScenarioProblemReport } from '@platform/reporting/ScenarioProblemReport';
import type { ScenarioReportContext } from '@platform/reporting/contracts';

const context: ScenarioReportContext = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', appVersion: '0.1.0-alpha.1',
  engineVersion: '0.1.0', moduleId: 'anesthesia', maturity: 'draft', practiceRegion: 'US',
  fidelityClass: 'closed_loop_physiology', surface: 'prebrief', simulatedTick: 0,
  canonicalUrl: 'https://opensimlab.com/anesthesia/scenario/routine-induction',
};

describe('shared problem report dialog', () => {
  let container: HTMLDivElement;
  let root: Root;
  const fetchMock = vi.fn(async () => Response.json({ sitekey: 'test-key', action: 'scenario-report' }));

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.stubGlobal('fetch', fetchMock);
    window.turnstile = {
      render: (_host, options) => {
        (options.callback as (token: string) => void)('test-token');
        return 'widget';
      },
      remove: vi.fn(), reset: vi.fn(),
    };
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete window.turnstile;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockClear();
  });

  it('loads nothing until opened, then shows one centered accessible 160-character form', async () => {
    const onOpen = vi.fn();
    await act(async () => { root.render(<ScenarioProblemReport context={context} onOpen={onOpen} />); });
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(onOpen).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.querySelector('.modal-backdrop')).not.toBeNull();
    expect(container.querySelector('textarea')?.maxLength).toBe(160);
    expect(container.textContent).toContain('0 / 160');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/reports/config', expect.objectContaining({ credentials: 'omit' }));
  });

  it('sends no report when canceled and restores the invoking control', async () => {
    const onClose = vi.fn();
    await act(async () => { root.render(<ScenarioProblemReport context={context} onClose={onClose} />); });
    const trigger = container.querySelector('button') as HTMLButtonElement;
    trigger.focus();
    await act(async () => { trigger.click(); await Promise.resolve(); });
    const cancel = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Cancel')!;
    await act(async () => { cancel.click(); });
    expect(onClose).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });

  it('does not contact Turnstile when the fail-closed config endpoint is unavailable', async () => {
    delete window.turnstile;
    fetchMock.mockResolvedValueOnce(new Response('{"ok":false}', { status: 503 }));
    await act(async () => { root.render(<ScenarioProblemReport context={context} />); });
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
    expect(container.textContent).toContain('temporarily unavailable');
  });
});
