/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PossibleSepsisTray } from '../../src/modules/infectious-disease/PossibleSepsisTray';
import { PossibleSepsis, POSSIBLE_SEPSIS_CEILING_TICKS as CEILING,
  POSSIBLE_SEPSIS_SHOCK_TICKS as SHOCK, POSSIBLE_SEPSIS_INVESTIGATION_TICKS as RETURNS,
  type PossibleSepsisAction } from '../../src/modules/infectious-disease/possible-sepsis';

const labels: Record<PossibleSepsisAction, string> = {
  'record-time-zero': 'Record the time infection was first suspected',
  'record-uncertainty': 'Record the uncertainty and request senior assessment',
  'request-time-limited-assessment': 'Request a time-limited rapid assessment',
  'record-antimicrobial-intent': 'Record bounded antimicrobial intent',
  'review-boundaries': 'Review the tiers and their certainty',
  monitor: 'Arrange close continuous monitoring',
  'check-labs': 'Check laboratory evidence only',
  'check-perfusion': 'Check perfusion only',
  reassess: 'Reassess perfusion and laboratory evidence',
  handoff: 'Hand off the clock and the open classification',
  'wait-and-see': 'Observe and review later',
  'assign-the-tier': 'Assign the likelihood tier yourself',
  'single-test-rules-out': 'Rule infection out on one biomarker',
  'defer-without-a-ceiling': 'Defer antimicrobials with no time limit',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: PossibleSepsis, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<PossibleSepsisTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Possible sepsis tray', () => {
  it('says the ceiling is running even before it is recorded', () => {
    render(new PossibleSepsis(), 0);
    expect(host.textContent).toContain('no ceiling is displayed. It is running regardless');
  });

  it('counts the ceiling down as the first thing on the page', () => {
    const model = new PossibleSepsis();
    model.apply('record-time-zero', 0);
    render(model, 600);
    const status = host.querySelector('[role="status"]')!;
    expect(status.textContent).toContain('179 simulated min remain of the three hours from first suspicion');
  });

  it('reports a passed ceiling rather than hiding it', () => {
    const model = new PossibleSepsis();
    model.apply('record-time-zero', 0);
    model.advance(CEILING + 10);
    render(model, CEILING + 10);
    expect(host.querySelector('[role="status"]')!.textContent)
      .toContain('The ceiling has passed, and that is recorded rather than hidden');
  });

  it('replaces the ceiling with the immediate path once the branch collapses', () => {
    const model = new PossibleSepsis();
    model.apply('record-time-zero', 0);
    model.advance(SHOCK + 10);
    render(model, SHOCK + 10);
    expect(host.querySelector('[role="status"]')!.textContent)
      .toContain('antimicrobial therapy is indicated within the hour');
    expect(host.textContent).not.toContain('remain of the three hours');
  });

  it('says the recorded clock stands after the run ends', () => {
    const model = new PossibleSepsis();
    for (const [tick, action] of [[0, 'record-time-zero'], [1, 'record-uncertainty'],
      [2, 'request-time-limited-assessment'], [3, 'record-antimicrobial-intent'],
      [4, 'review-boundaries'], [5, 'monitor'], [6, 'reassess'], [7, 'handoff']] as const) {
      model.apply(action, tick);
    }
    render(model, 8);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    // The countdown is over, but saying it was never recorded would contradict the line below it.
    expect(status).not.toContain('has not been recorded');
    expect(status).toContain('The recorded time of first suspicion stands');
    expect(host.textContent).toContain('recorded at simulated');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new PossibleSepsis(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new PossibleSepsis(), 0);
    act(() => button(labels['record-time-zero'])!.click());
    expect(onAction).toHaveBeenCalledWith('record-time-zero');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new PossibleSepsis();
    model.apply('record-uncertainty', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-uncertainty'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('keeps the returned assessment out of the tray until it is observed', () => {
    const model = new PossibleSepsis();
    model.apply('record-time-zero', 0);
    model.apply('request-time-limited-assessment', 1);
    model.advance(RETURNS + 10);
    render(model, RETURNS + 10);
    expect(host.textContent).not.toContain('Concern for infection persists and a source is identified');
    model.apply('reassess', RETURNS + 11);
    render(model, RETURNS + 12);
    expect(host.textContent).toContain('Concern for infection persists and a source is identified');
    expect(host.textContent).toContain('the ceiling has not moved');
  });

  it('says a bounded assessment is not an interval of observation', () => {
    render(new PossibleSepsis(), 0);
    expect(host.textContent).toContain('A time-limited assessment is not an interval of observation');
    expect(host.textContent).toContain('the clock does not pause while results are awaited');
  });

  it('keeps refused shortcuts visible without blocking a later handoff', () => {
    const model = new PossibleSepsis();
    model.apply('wait-and-see', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new PossibleSepsis();
    model.apply('record-antimicrobial-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['piperacillin', 'meropenem', 'vancomycin', 'ceftriaxone']) {
      expect(text).not.toContain(agent);
    }
    render(new PossibleSepsis(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
