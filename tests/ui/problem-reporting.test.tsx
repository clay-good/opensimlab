/** @vitest-environment jsdom */
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
const reportingCss = readFileSync(join(process.cwd(), 'src/platform/reporting/reporting.css'), 'utf8');

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
    expect(container.querySelector('button')?.getAttribute('aria-label')).toBe('Report a problem');
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(onOpen).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.querySelector('.modal-backdrop')).not.toBeNull();
    expect(container.querySelector('textarea')?.maxLength).toBe(160);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('');
    expect([...container.querySelectorAll('button')].find((button) => button.textContent === 'Send report')?.disabled)
      .toBe(true);
    expect(container.textContent).toContain('0 / 160');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/reports/config', expect.objectContaining({ credentials: 'omit' }));
  });

  it('collects bounded simulation context only after explicit consent and previews it', async () => {
    const collectRecentContext = vi.fn(() => ({
      seed: 7,
      actions: [{ tick: 12, type: 'review-state', outcome: 'accepted' as const, payload: {} }],
      snapshot: { patient: { heartRateBpm: 88 }, equipment: { 'airway.device': 'facemask' } },
    }));
    await act(async () => {
      root.render(<ScenarioProblemReport context={{ ...context, collectRecentContext }} />);
    });
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(collectRecentContext).not.toHaveBeenCalled();
    await act(async () => { (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click(); });
    expect(collectRecentContext).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Included');
    expect(container.querySelector('.problem-report__context-preview')?.textContent)
      .toContain('heartRateBpm');
  });

  it('keeps the report trigger clear of simulator controls on phones', () => {
    expect(reportingCss).toContain(
      '@media (max-width: 767px), (max-height: 499px) and (orientation: landscape)',
    );
    expect(reportingCss).toMatch(/\.problem-report\s*\{[^}]*inset-inline-start:\s*var\(--space-3\)/s);
    expect(reportingCss).toMatch(/\.problem-report\s*>\s*\.button\s*\{[^}]*min-block-size:\s*44px/s);
    expect(reportingCss).toContain('@media (max-width: 400px)');
    expect(reportingCss).toContain('.problem-report__label-short { display: inline; }');
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
