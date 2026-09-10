/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeferredStepTray } from '../../src/modules/surgery-trauma/DeferredStepTray';
import { DeferredStep } from '../../src/modules/surgery-trauma/deferred-step';
import { DEFERRED_STEP_SLIP_TICKS as SLIP, DEFERRED_STEP_TEAM_TICKS as TEAM, DEFERRED_STEP_ACTIONS, type DeferredStepAction } from '../../src/modules/surgery-trauma/deferred-step';

const labels: Record<DeferredStepAction, string> = {
  'record-the-injury-and-the-clock': 'Record the injury and the clock',
  'record-the-step-that-is-waiting': 'Record the step that is waiting',
  'record-what-the-interval-is-attached-to': 'Record what the interval is attached to',
  'escalate-to-the-team-that-can-prescribe': 'Ask the team that can decide it now',
  'record-bounded-prescribing-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-wound-record': 'Check the wound record only',
  reassess: 'Reassess observations and wound record',
  handoff: 'Hand off the step and its clock',
  'orthopaedics-will-give-them-when-they-review-her': 'Orthopaedics will give them when they review her',
  'she-is-stable-so-there-is-no-hurry': 'She is stable, so there is no hurry',
  'it-can-go-on-the-morning-drug-chart': 'It can go on the morning drug chart',
  'wait-until-she-is-in-theatre-anyway': 'Wait until she is in theatre anyway',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: DeferredStep, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<DeferredStepTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Deferred-step tray', () => {
  it('leads with both clocks and the step that has not happened', () => {
    render(new DeferredStep(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('47 minutes since injury, 28 since arrival');
    expect(status).toContain('Antibiotic not given');
    expect(status).toContain('Anybody objecting: nobody');
    expect(host.textContent).toContain('Nobody has refused anything. Find the step anyway');
  });

  it('shows what the step is attached to without blaming anybody', () => {
    render(new DeferredStep(), 0);
    expect(host.textContent).toContain('orthopaedics will review her and give the antibiotics then');
    expect(host.textContent).toContain('in theatre with another case');
    const lowered = (host.textContent ?? '').toLowerCase();
    for (const term of ['should have', 'failed to', 'negligent']) expect(lowered).not.toContain(term);
  });

  it('offers every declared choice exactly once', () => {
    render(new DeferredStep(), 0);
    for (const action of DEFERRED_STEP_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(DEFERRED_STEP_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new DeferredStep(), 0);
    act(() => { button(labels['record-the-injury-and-the-clock'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-injury-and-the-clock');
  });

  it('retires a recording control once it has been used', () => {
    const model = new DeferredStep();
    model.apply('record-the-injury-and-the-clock', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-injury-and-the-clock'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new DeferredStep(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the slipped review and the team reply once each has happened', () => {
    const before = new DeferredStep();
    render(before, 0);
    expect(host.textContent).not.toContain('Theatre has rung');
    const after = new DeferredStep();
    after.apply('escalate-to-the-team-that-can-prescribe', 0);
    after.advance(SLIP + 1);
    after.advance(SLIP + TEAM + 1);
    after.apply('reassess', SLIP + TEAM + 2);
    render(after, SLIP + TEAM + 2);
    expect(host.textContent).toContain('Theatre has rung');
    expect(host.textContent).toContain('Nothing about the patient has changed');
    expect(host.textContent).toContain('did not need to see her first');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new DeferredStep();
    model.apply('orthopaedics-will-give-them-when-they-review-her', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, or route anywhere, in any state', () => {
    const forbidden = ['co-amoxiclav', 'cefazolin', 'cefuroxime', 'gentamicin', 'mg/kg'];
    for (const action of DEFERRED_STEP_ACTIONS) {
      const model = new DeferredStep();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
