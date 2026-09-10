/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KnownLabelTray } from '../../src/modules/surgery-trauma/KnownLabelTray';
import { KnownLabel } from '../../src/modules/surgery-trauma/known-label';
import { KNOWN_LABEL_HANDOVER_TICKS as HANDOVER, KNOWN_LABEL_TEAM_TICKS as TEAM, KNOWN_LABEL_ACTIONS, type KnownLabelAction } from '../../src/modules/surgery-trauma/known-label';

const labels: Record<KnownLabelAction, string> = {
  'record-the-label-and-what-it-explains': 'Record the label and what it explains',
  'record-what-has-changed-according-to-someone-who-knows-him': 'Record what changed, from someone who knows him',
  'record-what-the-label-cannot-exclude': 'Record what the label cannot exclude',
  'escalate-to-the-surgical-team': 'Ask the surgical team to see him',
  'record-bounded-adjustment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-behaviour-record': 'Check the behaviour record only',
  reassess: 'Reassess observations and behaviour record',
  handoff: 'Hand off the assessment and what it needs',
  'this-is-his-baseline-behaviour': 'This is his baseline behaviour',
  'the-notes-say-chronic-constipation': 'The notes say chronic constipation',
  'he-cannot-tell-us-where-it-hurts-so-we-cannot-assess-him': 'He cannot tell us where it hurts, so we cannot assess him',
  'give-him-something-for-his-bowels-and-review': 'Give him something for his bowels and review',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: KnownLabel, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<KnownLabelTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Known-label tray', () => {
  it('leads with the label, the informant, and the unachieved examination', () => {
    render(new KnownLabel(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Chronic constipation recorded for 9 years');
    expect(status).toContain('Informant of 6 years is present');
    expect(status).toContain('not achieved');
    expect(host.textContent).toContain('The label is probably right. That is the difficulty');
  });

  it('shows what is different about today without naming another diagnosis', () => {
    render(new KnownLabel(), 0);
    expect(host.textContent).toContain('usually loud, agitated and self-injurious');
    expect(host.textContent).toContain('this is not it');
    const lowered = (host.textContent ?? '').toLowerCase();
    for (const term of ['obstruction', 'perforation', 'volvulus']) expect(lowered).not.toContain(term);
  });

  it('offers every declared choice exactly once', () => {
    render(new KnownLabel(), 0);
    for (const action of KNOWN_LABEL_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(KNOWN_LABEL_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new KnownLabel(), 0);
    act(() => { button(labels['record-the-label-and-what-it-explains'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-label-and-what-it-explains');
  });

  it('retires a recording control once it has been used', () => {
    const model = new KnownLabel();
    model.apply('record-the-label-and-what-it-explains', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-label-and-what-it-explains'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new KnownLabel(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the shift change and the team reply once each has happened', () => {
    const before = new KnownLabel();
    render(before, 0);
    expect(host.textContent).not.toContain('relief worker');
    const after = new KnownLabel();
    after.apply('escalate-to-the-surgical-team', 0);
    after.advance(HANDOVER + 1);
    after.advance(HANDOVER + TEAM + 1);
    after.apply('reassess', HANDOVER + TEAM + 2);
    render(after, HANDOVER + TEAM + 2);
    expect(host.textContent).toContain('relief worker');
    expect(host.textContent).toContain('the only comparison anybody had');
    expect(host.textContent).toContain('explaining part of the picture rather than as excluding anything');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new KnownLabel();
    model.apply('this-is-his-baseline-behaviour', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, or competing diagnosis anywhere, in any state', () => {
    const forbidden = ['morphine', 'macrogol', 'senna', 'enema', 'mg/kg', 'obstruction', 'perforation'];
    for (const action of KNOWN_LABEL_ACTIONS) {
      const model = new KnownLabel();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
