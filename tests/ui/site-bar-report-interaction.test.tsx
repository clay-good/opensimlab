/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://opensimlab.com/"}
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteBar } from '@platform/ui/SiteBar';
import { ScenarioProblemReport } from '@platform/reporting/ScenarioProblemReport';
import type { ScenarioReportContext } from '@platform/reporting/contracts';

const context: ScenarioReportContext = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', appVersion: '0.1.0-alpha.1',
  engineVersion: '0.1.0', moduleId: 'anesthesia', maturity: 'draft', practiceRegion: 'US',
  fidelityClass: 'closed_loop_physiology', surface: 'prebrief', simulatedTick: 0,
  canonicalUrl: 'https://opensimlab.com/anesthesia/scenario/routine-induction',
};

describe('Browse and the shared problem report keep separate keyboard ownership', () => {
  let root: Root; let host: HTMLDivElement;
  const onClose = vi.fn();
  const fetchMock = vi.fn(async () => Response.json({
    sitekey: 'test-key', action: 'scenario-report', maintainer: 'Open Sim Lab maintainers',
    privacy_url: 'https://opensimlab.com/privacy#problem-reports',
  }));
  const browse = () => host.querySelector<HTMLDetailsElement>('.document__browse')!;
  const summary = () => browse().querySelector('summary')!;
  const reportTrigger = () => host.querySelector<HTMLButtonElement>('button[aria-label="Help us improve this"]')!;
  const dialog = () => host.querySelector<HTMLElement>('[role="dialog"]');
  async function escape(target: HTMLElement) {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    await act(async () => { target.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
  }

  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div'); document.body.append(host); root = createRoot(host);
    vi.stubGlobal('fetch', fetchMock);
    window.turnstile = {
      render: (_host, options) => { (options.callback as (token: string) => void)('test-token'); return 'widget'; },
      remove: vi.fn(), reset: vi.fn(),
    };
    await act(async () => { root.render(<><SiteBar /><main id="main">Scenario briefing</main>
      <ScenarioProblemReport context={context} onClose={onClose} /></>); });
  });
  afterEach(() => {
    act(() => root.unmount()); host.remove(); delete window.turnstile;
    vi.unstubAllGlobals(); vi.restoreAllMocks(); onClose.mockClear(); fetchMock.mockClear();
  });

  it.each(['note', 'report preview'] as const)('Escape from %s dismisses only the report, then Browse closes independently', async (from) => {
    summary().focus(); await act(async () => { summary().click(); });
    expect(browse().open).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    const trigger = reportTrigger(); trigger.focus();
    await act(async () => { trigger.click(); });
    const report = dialog()!;
    expect(report.contains(document.activeElement)).toBe(true);
    expect(browse().open).toBe(true);

    const control = from === 'note' ? report.querySelector('textarea')! : report.querySelector('summary')!;
    if (from === 'report preview') {
      await act(async () => { control.click(); });
      expect(report.querySelector('details')?.open).toBe(true);
    }
    control.focus(); await escape(control);
    expect(dialog()).toBeNull(); expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger); expect(browse().open).toBe(true);

    const link = browse().querySelector<HTMLAnchorElement>('a')!;
    link.focus(); await escape(link);
    expect(browse().open).toBe(false); expect(document.activeElement).toBe(summary());
    expect(onClose).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/reports/config', expect.objectContaining({ credentials: 'omit' }));
  });

  it('keeps report focus and Tab wrapping away from the expanded navigation', async () => {
    await act(async () => { summary().click(); });
    reportTrigger().focus(); await act(async () => { reportTrigger().click(); });
    const report = dialog()!;
    // Two different elements, deliberately. The corner close leads the dialog's
    // markup, so it is what Tab wraps to; initial focus and any refocus skip it,
    // because landing on `Close` announces the way out of a dialog before the
    // dialog. Conflating the two would let either behaviour regress unnoticed.
    const tabFirst = report.querySelector<HTMLButtonElement>('button[data-dialog-dismiss]')!;
    const refocusTarget = report.querySelector<HTMLAnchorElement>('a')!;
    const cancel = [...report.querySelectorAll('button')].find((button) => button.textContent === 'Cancel')!;
    summary().focus();
    expect(document.activeElement).toBe(refocusTarget);
    cancel.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    await act(async () => { cancel.dispatchEvent(tab); });
    expect(tab.defaultPrevented).toBe(true); expect(document.activeElement).toBe(tabFirst);
    expect(browse().open).toBe(true); expect(onClose).not.toHaveBeenCalled();
    await act(async () => { cancel.click(); });
    expect(document.activeElement).toBe(reportTrigger()); expect(browse().open).toBe(true);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/reports/config', expect.objectContaining({ credentials: 'omit' }));
  });
});
