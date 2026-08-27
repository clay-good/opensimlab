/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://opensimlab.com/"}
 */
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScenarioProblemReport } from '@platform/reporting/ScenarioProblemReport';
import type { ScenarioReportContext } from '@platform/reporting/contracts';
import { loadTurnstile, reportConfig, REPORT_REQUEST_TIMEOUT_MS } from '@platform/reporting/client';

const context: ScenarioReportContext = {
  scenarioId: 'routine-induction', contentVersion: '0.1.0', appVersion: '0.1.0-alpha.1',
  engineVersion: '0.1.0', moduleId: 'anesthesia', maturity: 'draft', practiceRegion: 'US',
  fidelityClass: 'closed_loop_physiology', surface: 'prebrief', simulatedTick: 0,
  canonicalUrl: 'https://opensimlab.com/anesthesia/scenario/routine-induction',
};
const reportingCss = readFileSync(join(process.cwd(), 'src/platform/reporting/reporting.css'), 'utf8');
const serviceConfig = {
  sitekey: 'test-key', action: 'scenario-report', maintainer: 'Open Sim Lab maintainers',
  privacy_url: 'https://opensimlab.com/privacy#problem-reports',
};

describe('shared problem report dialog', () => {
  let container: HTMLDivElement;
  let root: Root;
  const fetchMock = vi.fn(async (_input?: RequestInfo | URL, _init?: RequestInit) =>
    Response.json(serviceConfig));

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
    vi.useRealTimers();
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
    expect(container.querySelector('textarea')?.getAttribute('spellcheck')).toBe('false');
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('');
    expect([...container.querySelectorAll('button')].find((button) => button.textContent === 'Send report')?.disabled)
      .toBe(true);
    expect(container.textContent).toContain('0 / 160');
    expect(container.textContent).toContain('Reviewed by Open Sim Lab maintainers');
    expect(container.querySelector('a')?.href).toBe('https://opensimlab.com/privacy#problem-reports');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/reports/config', expect.objectContaining({ credentials: 'omit' }));
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('minimizes Turnstile fields and reports timeout or unsupported clients', async () => {
    let options: Record<string, unknown> = {};
    window.turnstile = {
      render: (_host, value) => { options = value; return 'widget'; },
      remove: vi.fn(), reset: vi.fn(),
    };
    await act(async () => { root.render(<ScenarioProblemReport context={context} />); });
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(options).toMatchObject({
      'response-field': false,
      'feedback-enabled': false,
    });
    await act(async () => { (options['timeout-callback'] as () => void)(); });
    expect(container.textContent).toContain('Security check expired');
    await act(async () => { (options['unsupported-callback'] as () => void)(); });
    expect(container.textContent).toContain('Security check unavailable');
  });

  it('rejects a cross-origin privacy notice or unsafe maintainer identity', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      ...serviceConfig, privacy_url: 'https://example.com/privacy',
    }));
    await expect(reportConfig()).rejects.toThrow('reporting unavailable');
    fetchMock.mockResolvedValueOnce(Response.json({
      ...serviceConfig, maintainer: 'Unsafe\nmaintainer',
    }));
    await expect(reportConfig()).rejects.toThrow('reporting unavailable');
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

  it('opens the same dialog for a nested source or limitation surface', async () => {
    const onOpen = vi.fn();
    await act(async () => {
      root.render(<ScenarioProblemReport context={{ ...context, surface: 'source' }}
        openRequest={1} onOpen={onOpen} />);
      await Promise.resolve();
    });
    expect(onOpen).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain('source');
    await act(async () => {
      root.render(<ScenarioProblemReport context={{ ...context, surface: 'source' }}
        openRequest={1} onOpen={onOpen} />);
    });
    expect(onOpen).toHaveBeenCalledOnce();
    const cancel = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Cancel')!;
    await act(async () => { cancel.click(); });
    await act(async () => {
      root.render(<ScenarioProblemReport context={{ ...context, surface: 'limitation' }}
        openRequest={2} onOpen={onOpen} />);
      await Promise.resolve();
    });
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('limitation');
  });

  for (const surface of ['source', 'limitation'] as const) {
    it(`submits the exact ${surface} surface through the shared dialog`, async () => {
      fetchMock
        .mockResolvedValueOnce(Response.json(serviceConfig))
        .mockResolvedValueOnce(new Response(null, { status: 202 }));
      await act(async () => {
        root.render(<ScenarioProblemReport context={{ ...context, surface }} openRequest={1} />);
        await Promise.resolve();
      });
      const select = container.querySelector('select') as HTMLSelectElement;
      await act(async () => {
        select.value = 'outdated-source';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      const send = [...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'Send report')!;
      await act(async () => { send.click(); await Promise.resolve(); });
      const request = fetchMock.mock.calls[1]![1] as RequestInit;
      expect(JSON.parse(request.body as string)).toMatchObject({ surface });
      expect(request.signal).toBeInstanceOf(AbortSignal);
    });
  }

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
    expect(container.textContent).toContain('unavailable on this host');
  });

  it('keeps sibling practice controls usable when report configuration cannot be reached', async () => {
    const practice = vi.fn();
    delete window.turnstile;
    fetchMock.mockRejectedValueOnce(new Error('network unavailable'));
    await act(async () => {
      root.render(<><button type="button" onClick={practice}>Continue practice</button>
        <ScenarioProblemReport context={context} /></>);
    });
    await act(async () => {
      (container.querySelector('[aria-label="Report a problem"]') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    expect(container.textContent).toContain('unavailable on this host');
    await act(async () => {
      ([...container.querySelectorAll('button')]
        .find((button) => button.textContent === 'Continue practice') as HTMLButtonElement).click();
    });
    expect(practice).toHaveBeenCalledOnce();
  });

  it('recovers from a failed submission without disturbing the dialog', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json(serviceConfig))
      .mockRejectedValueOnce(new Error('network unavailable'));
    await act(async () => { root.render(<ScenarioProblemReport context={context} />); });
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    const select = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      select.value = 'controls';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const send = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Send report')!;
    await act(async () => { send.click(); await Promise.resolve(); });
    expect(container.textContent).toContain('Report not sent');
    expect(send.disabled).toBe(true);
    expect(window.turnstile?.reset).toHaveBeenCalledWith('widget');
    expect([...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Cancel')?.disabled).toBe(false);
  });

  it('cannot dismiss the dialog while a report is being sent', async () => {
    let finish!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => { finish = resolve; });
    fetchMock
      .mockResolvedValueOnce(Response.json(serviceConfig))
      .mockReturnValueOnce(pending);
    await act(async () => { root.render(<ScenarioProblemReport context={context} />); });
    await act(async () => {
      (container.querySelector('button') as HTMLButtonElement).click();
      await Promise.resolve();
    });
    const select = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      select.value = 'controls';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const send = [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Send report')!;
    await act(async () => { send.click(); await Promise.resolve(); });
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain('Sending report');
    await act(async () => { finish(new Response(null, { status: 202 })); await pending; });
    expect(container.textContent).toContain('weekly review queue');
  });

  it('bounds a stalled Turnstile script load and removes the abandoned script', async () => {
    vi.useFakeTimers();
    delete window.turnstile;
    const pending = loadTurnstile();
    const rejected = expect(pending).rejects.toThrow('did not load in time');
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(REPORT_REQUEST_TIMEOUT_MS);
    await rejected;
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
  });
});
