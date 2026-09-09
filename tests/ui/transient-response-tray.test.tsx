/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransientResponseTray } from '../../src/modules/surgery-trauma/TransientResponseTray';
import { TransientResponse } from '../../src/modules/surgery-trauma/transient-response';
import { TRANSIENT_RESPONSE_FALL_TICKS as FALL, TRANSIENT_RESPONSE_TEAM_TICKS as TEAM, TRANSIENT_RESPONSE_ACTIONS, type TransientResponseAction } from '../../src/modules/surgery-trauma/transient-response';

const labels: Record<TransientResponseAction, string> = {
  'record-the-mechanism-and-the-clock': 'Record the mechanism and the clock',
  'record-the-shape-of-the-response': 'Record the shape of the response',
  'record-what-a-picture-cannot-do': 'Record what a picture can and cannot do',
  'escalate-to-the-theatre-team': 'Call the team that can stop the bleeding',
  'record-bounded-operative-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-response-record': 'Check the response record only',
  reassess: 'Reassess observations and response record',
  handoff: 'Hand off the decision and its clock',
  'he-came-back-up-so-he-is-stable': 'He came back up, so he is stable',
  'send-him-for-a-scan-before-calling': 'Send him for a scan before calling',
  'give-another-litre-and-see': 'Give another litre and see',
  'wait-for-the-cross-matched-blood-before-calling': 'Wait for the cross-matched blood before calling',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: TransientResponse, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<TransientResponseTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Transient-response tray', () => {
  it('leads with the mechanism, the clock, and what has already been given', () => {
    render(new TransientResponse(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('40 minutes ago');
    expect(status).toContain('Free fluid reported');
    expect(status).toContain('2 warmed boluses');
    expect(host.textContent).toContain('Read the shape, not the reading');
  });

  it('shows the shrinking pattern and the pull toward the scanner', () => {
    render(new TransientResponse(), 0);
    expect(host.textContent).toContain('held it for 20 minutes');
    expect(host.textContent).toContain('held it for 9');
    expect(host.textContent).toContain('whether he should go to the scanner first');
  });

  it('offers every declared choice exactly once', () => {
    render(new TransientResponse(), 0);
    for (const action of TRANSIENT_RESPONSE_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(TRANSIENT_RESPONSE_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new TransientResponse(), 0);
    act(() => { button(labels['record-the-mechanism-and-the-clock'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-mechanism-and-the-clock');
  });

  it('retires a recording control once it has been used', () => {
    const model = new TransientResponse();
    model.apply('record-the-mechanism-and-the-clock', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-mechanism-and-the-clock'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new TransientResponse(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the third fall and the team reply once each has happened', () => {
    const before = new TransientResponse();
    render(before, 0);
    expect(host.textContent).not.toContain('fallen a third time');
    const after = new TransientResponse();
    after.apply('escalate-to-the-theatre-team', 0);
    after.advance(FALL + 1);
    after.advance(FALL + TEAM + 1);
    after.apply('reassess', FALL + TEAM + 2);
    render(after, FALL + TEAM + 2);
    expect(host.textContent).toContain('fallen a third time');
    expect(host.textContent).toContain('nothing was taken away to cause it');
    expect(host.textContent).toContain('naming the site does not change what has to happen to it');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new TransientResponse();
    model.apply('send-him-for-a-scan-before-calling', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, blood product, or operation anywhere, in any state', () => {
    const forbidden = ['morphine', 'propofol', 'midazolam', 'tranexamic', 'laparotomy', 'mg/kg'];
    for (const action of TRANSIENT_RESPONSE_ACTIONS) {
      const model = new TransientResponse();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
