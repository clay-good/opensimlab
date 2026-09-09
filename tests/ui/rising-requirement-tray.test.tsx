/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RisingRequirementTray } from '../../src/modules/surgery-trauma/RisingRequirementTray';
import { RisingRequirement } from '../../src/modules/surgery-trauma/rising-requirement';
import { RISING_REQUIREMENT_WORSENING_TICKS as WORSE, RISING_REQUIREMENT_TEAM_TICKS as TEAM, RISING_REQUIREMENT_ACTIONS, type RisingRequirementAction } from '../../src/modules/surgery-trauma/rising-requirement';

const labels: Record<RisingRequirementAction, string> = {
  'record-the-injury-and-the-clock': 'Record the injury and the hours on it',
  'record-the-rising-requirement': 'Record the rising requirement as the finding',
  'record-what-one-pressure-cannot-decide': 'Record what one reading cannot decide',
  'escalate-to-the-surgical-team': 'Call the team that owns the decision',
  'record-bounded-decompression-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-limb-record': 'Check the limb record only',
  reassess: 'Reassess observations and limb record',
  handoff: 'Hand off the clock and the direction',
  'pulses-are-present-so-perfusion-is-fine': 'Pulses are present, so perfusion is fine',
  'the-pressure-was-below-the-threshold': 'The pressure was below the threshold',
  'increase-analgesia-and-review-in-the-morning': 'Increase the analgesia and review in the morning',
  'wait-for-a-repeat-pressure-before-calling': 'Wait for a repeat pressure before calling',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: RisingRequirement, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<RisingRequirementTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Rising-requirement tray', () => {
  it('leads with the clock and the requirement, not the observations', () => {
    render(new RisingRequirement(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('8 hours ago');
    expect(status).toContain('3 escalating requests');
    expect(status).toContain('34 mmHg');
    expect(host.textContent).toContain('The only thing moving is how often he asks');
  });

  it('shows the reassuring findings and says they are not abnormal', () => {
    render(new RisingRequirement(), 0);
    expect(host.textContent).toContain('dorsalis pedis is easily felt');
    expect(host.textContent).toContain('none of them is abnormal');
    expect(host.textContent).toContain('the pressure was not diagnostic');
  });

  it('offers every declared choice exactly once', () => {
    render(new RisingRequirement(), 0);
    for (const action of RISING_REQUIREMENT_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(RISING_REQUIREMENT_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new RisingRequirement(), 0);
    act(() => { button(labels['record-the-injury-and-the-clock'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-injury-and-the-clock');
  });

  it('retires a recording control once it has been used', () => {
    const model = new RisingRequirement();
    model.apply('record-the-injury-and-the-clock', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-injury-and-the-clock'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new RisingRequirement(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the fourth request with everything else unchanged', () => {
    const before = new RisingRequirement();
    render(before, 0);
    expect(host.textContent).not.toContain('asked a fourth time');
    const after = new RisingRequirement();
    after.apply('escalate-to-the-surgical-team', 0);
    after.advance(WORSE + 1);
    after.advance(WORSE + TEAM + 1);
    after.apply('reassess', WORSE + TEAM + 2);
    render(after, WORSE + TEAM + 2);
    expect(host.textContent).toContain('asked a fourth time');
    expect(host.textContent).toContain('exactly as they were');
    expect(host.textContent).toContain('neither establishes nor excludes this');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new RisingRequirement();
    model.apply('the-pressure-was-below-the-threshold', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, or procedure anywhere in the tray, in any state', () => {
    const forbidden = ['morphine', 'fentanyl', 'ketamine', 'fasciotomy', 'mg/kg'];
    for (const action of RISING_REQUIREMENT_ACTIONS) {
      const model = new RisingRequirement();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
