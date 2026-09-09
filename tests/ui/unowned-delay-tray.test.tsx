/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UnownedDelayTray } from '../../src/modules/surgery-trauma/UnownedDelayTray';
import { UnownedDelay } from '../../src/modules/surgery-trauma/unowned-delay';
import { UNOWNED_DELAY_LIST_TICKS as LIST, UNOWNED_DELAY_TEAM_TICKS as TEAM, UNOWNED_DELAY_ACTIONS, type UnownedDelayAction } from '../../src/modules/surgery-trauma/unowned-delay';

const labels: Record<UnownedDelayAction, string> = {
  'record-the-fracture-and-the-clock': 'Record the fracture and the clock',
  'record-what-each-delay-was-for': 'Record what each delay was for',
  'record-what-is-still-being-waited-for': 'Record what is still being waited for',
  'escalate-to-the-team-that-owns-the-list': 'Ask the team that owns the list to own the wait',
  'record-bounded-scheduling-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-delay-record': 'Check the delay record only',
  reassess: 'Reassess observations and delay record',
  handoff: 'Hand off the wait and its owner',
  'she-is-not-fit-until-the-echo-is-done': 'She is not fit until the echo is done',
  'the-list-is-full-so-it-is-out-of-our-hands': 'The list is full, so it is out of our hands',
  'one-more-night-will-not-make-a-difference': 'One more night will not make a difference',
  'keep-her-fasted-in-case-a-slot-appears': 'Keep her fasted in case a slot appears',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: UnownedDelay, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<UnownedDelayTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Unowned-delay tray', () => {
  it('leads with the total, the cancellations and the unbooked investigation', () => {
    render(new UnownedDelay(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('admitted 42 hours ago');
    expect(status).toContain('2 cancellations');
    expect(status).toContain('not booked');
    expect(host.textContent).toContain('Three reasons, no authors');
  });

  it('shows each delay with its missing author and the unchanged observations', () => {
    render(new UnownedDelay(), 0);
    expect(host.textContent).toContain('by nobody the record names');
    expect(host.textContent).toContain('the same numbers as on admission');
    expect(host.textContent).toContain('none documented');
  });

  it('offers every declared choice exactly once', () => {
    render(new UnownedDelay(), 0);
    for (const action of UNOWNED_DELAY_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(UNOWNED_DELAY_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new UnownedDelay(), 0);
    act(() => { button(labels['record-the-fracture-and-the-clock'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-fracture-and-the-clock');
  });

  it('retires a recording control once it has been used', () => {
    const model = new UnownedDelay();
    model.apply('record-the-fracture-and-the-clock', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-fracture-and-the-clock'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new UnownedDelay(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the lost evening and the team reply once each has happened', () => {
    const before = new UnownedDelay();
    render(before, 0);
    expect(host.textContent).not.toContain('this evening is gone');
    const after = new UnownedDelay();
    after.apply('escalate-to-the-team-that-owns-the-list', 0);
    after.advance(LIST + 1);
    after.advance(LIST + TEAM + 1);
    after.apply('reassess', LIST + TEAM + 2);
    render(after, LIST + TEAM + 2);
    expect(host.textContent).toContain('this evening is gone');
    expect(host.textContent).toContain('had not known she was still waiting');
    expect(host.textContent).toContain('is not a gate they recognise');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new UnownedDelay();
    model.apply('she-is-not-fit-until-the-echo-is-done', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, theatre time, or technique anywhere, in any state', () => {
    const forbidden = ['morphine', 'propofol', 'spinal anaesthetic', 'hemiarthroplasty', 'mg/kg'];
    for (const action of UNOWNED_DELAY_ACTIONS) {
      const model = new UnownedDelay();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
