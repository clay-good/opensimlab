/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountedRateTray } from '../../src/modules/medical-surgical-nursing/CountedRateTray';
import { CountedRate, COUNTED_RATE_REVIEW_TICKS as REVIEW,
  type CountedRateAction } from '../../src/modules/medical-surgical-nursing/counted-rate';

const labels: Record<CountedRateAction, string> = {
  'review-the-charted-trend': 'Review the charted trend',
  'count-for-a-full-minute': 'Count for a full minute',
  'record-the-discrepancy': 'Record the discrepancy',
  'escalate-on-the-counted-value': 'Escalate on the counted value',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Arrange counted observation',
  'check-chart': 'Review the chart only',
  'check-patient': 'Observe the patient only',
  reassess: 'Reassess the chart and the patient',
  handoff: 'Hand off both numbers',
  'trust-the-flat-trend': 'The trend is flat, so he is stable',
  'chart-the-monitor-value': 'Chart the monitor rate instead',
  'round-to-the-previous-entry': 'Record a value near the last one',
  'correct-the-earlier-entries': 'Correct the earlier entries',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: CountedRate, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<CountedRateTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Counted respiratory rate tray', () => {
  it('shows the charted column and says nothing has been counted', () => {
    render(new CountedRate(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('18, 18, 20, 18, 18, 20');
    expect(status).toContain('Nothing has been counted for a full minute');
  });

  it('shows both numbers together once one is counted', () => {
    const model = new CountedRate();
    model.apply('count-for-a-full-minute', 0);
    render(model, 1);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('18, 18, 20, 18, 18, 20');
    expect(status).toContain('Counted for a full minute: 28');
  });

  it('withholds the distribution reading until the trend is reviewed', () => {
    render(new CountedRate(), 0);
    expect(host.textContent).not.toContain('six values drawn from a set of two');
    const model = new CountedRate();
    model.apply('review-the-charted-trend', 0);
    render(model, 1);
    expect(host.textContent).toContain('six values drawn from a set of two');
  });

  it('never alters the charted column, even after a refused amendment', () => {
    const model = new CountedRate();
    model.apply('correct-the-earlier-entries', 0);
    render(model, 1);
    expect(host.querySelector('[role="status"]')!.textContent).toContain('18, 18, 20, 18, 18, 20');
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('keeps the review out of the tray until the learner has looked', () => {
    const model = new CountedRate();
    model.apply('count-for-a-full-minute', 0);
    model.apply('escalate-on-the-counted-value', 1);
    model.advance(REVIEW + 10);
    render(model, REVIEW + 10);
    expect(host.textContent).not.toContain('counted independently');
    model.apply('reassess', REVIEW + 11);
    render(model, REVIEW + 12);
    expect(host.textContent).toContain('counted independently and reached the same number');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new CountedRate(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new CountedRate(), 0);
    act(() => button(labels['count-for-a-full-minute'])!.click());
    expect(onAction).toHaveBeenCalledWith('count-for-a-full-minute');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new CountedRate();
    model.apply('review-the-charted-trend', 0);
    const onAction = render(model, 1);
    const control = button(labels['review-the-charted-trend'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new CountedRate();
    model.apply('count-for-a-full-minute', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['salbutamol', 'morphine', 'naloxone']) expect(text).not.toContain(agent);
    render(new CountedRate(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
