/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NegativeScanTray } from '../../src/modules/surgery-trauma/NegativeScanTray';
import { NegativeScan } from '../../src/modules/surgery-trauma/negative-scan';
import { NEGATIVE_SCAN_ROUND_TICKS as ROUND, NEGATIVE_SCAN_TEAM_TICKS as TEAM, NEGATIVE_SCAN_ACTIONS, type NegativeScanAction } from '../../src/modules/surgery-trauma/negative-scan';

const labels: Record<NegativeScanAction, string> = {
  'record-the-operative-course': 'Record the operation and the course it predicts',
  'record-the-failure-to-progress': 'Record the failure to progress against that course',
  'record-what-the-scan-excludes': 'Record what the scan does and does not exclude',
  'escalate-to-the-operating-team': 'Contact the team that made the anastomosis',
  'record-bounded-surgical-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-operative-record': 'Check the operative record only',
  reassess: 'Reassess observations and operative record',
  handoff: 'Hand off the course and what it rests on',
  'the-scan-was-negative-so-it-is-not-a-leak': 'The scan was negative, so it is not a leak',
  'abnormal-vitals-are-routine-after-bowel-surgery': 'These numbers are routine after bowel surgery',
  'repeat-the-scan-tomorrow-and-review-then': 'Repeat the scan tomorrow and review then',
  'treat-the-numbers-and-watch-overnight': 'Treat the numbers and watch overnight',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: NegativeScan, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<NegativeScanTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Negative-scan tray', () => {
  it('states the operation, the day, and how long this has been true, first', () => {
    render(new NegativeScan(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Day 5');
    expect(status).toContain('sigmoid resection with a primary colorectal anastomosis');
    expect(status).toContain('above 100 for 36 hours');
    expect(host.textContent).toContain('Read him against his own operation');
  });

  it('quotes the scan report as written rather than as heard', () => {
    render(new NegativeScan(), 0);
    expect(host.textContent).toContain('no evidence of an anastomotic leak');
    expect(host.textContent).toContain('No evidence of a leak is not the same sentence as no leak');
  });

  it('offers every declared choice exactly once', () => {
    render(new NegativeScan(), 0);
    for (const action of NEGATIVE_SCAN_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(NEGATIVE_SCAN_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new NegativeScan(), 0);
    act(() => { button(labels['record-the-operative-course'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-operative-course');
  });

  it('retires a recording control once it has been used rather than repeating it', () => {
    const model = new NegativeScan();
    model.apply('record-the-operative-course', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-operative-course'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new NegativeScan(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('shows the unchanged repeat round and the answered team only once each has happened', () => {
    const before = new NegativeScan();
    render(before, 0);
    expect(host.textContent).not.toContain('vomited once since the last round');
    const after = new NegativeScan();
    after.apply('escalate-to-the-operating-team', 0);
    after.advance(ROUND + 1);
    after.advance(TEAM + ROUND + 1);
    after.apply('reassess', TEAM + ROUND + 2);
    render(after, TEAM + ROUND + 2);
    expect(host.textContent).toContain('vomited once since the last round');
    expect(host.textContent).toContain('does not override a patient off his expected course');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new NegativeScan();
    model.apply('the-scan-was-negative-so-it-is-not-a-leak', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no drug, dose, or operation anywhere in the tray, in any state', () => {
    const forbidden = ['piperacillin', 'metronidazole', 'laparotomy', 'hartmann', 'mg/kg'];
    for (const action of NEGATIVE_SCAN_ACTIONS) {
      const model = new NegativeScan();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
