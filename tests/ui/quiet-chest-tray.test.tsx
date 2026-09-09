/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuietChestTray } from '../../src/modules/surgery-trauma/QuietChestTray';
import { QuietChest } from '../../src/modules/surgery-trauma/quiet-chest';
import { QUIET_CHEST_FAMILY_TICKS as FAMILY, QUIET_CHEST_TEAM_TICKS as TEAM, QUIET_CHEST_ACTIONS, type QuietChestAction } from '../../src/modules/surgery-trauma/quiet-chest';

const labels: Record<QuietChestAction, string> = {
  'record-the-fall-and-what-was-broken': 'Record the fall and what it broke',
  'record-what-comfortable-at-rest-measures': 'Record what comfortable at rest measures',
  'record-what-the-count-predicts': 'Record what the count predicts',
  'escalate-to-the-admitting-team': 'Ask the team that owns the plan to take her',
  'record-bounded-admission-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-chest-record': 'Check the chest record only',
  reassess: 'Reassess observations and chest record',
  handoff: 'Hand off the plan and its interval',
  'her-numbers-are-normal-so-she-can-go-home': 'Her numbers are normal, so she can go home',
  'there-is-no-pneumothorax-on-the-film': 'There is no pneumothorax on the film',
  'she-says-the-pain-is-manageable': 'She says the pain is manageable',
  'send-her-home-with-tablets-and-review-in-a-week': 'Send her home with tablets and review in a week',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: QuietChest, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<QuietChestTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Quiet-chest tray', () => {
  it('leads with the fall, the count and the age', () => {
    render(new QuietChest(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('16 hours ago, aged 81');
    expect(status).toContain('4 left-sided rib fractures');
    expect(status).toContain('lives alone');
    expect(host.textContent).toContain('The chart is normal. Ask what it was measuring');
  });

  it('shows the normal chart and says what it was measuring', () => {
    render(new QuietChest(), 0);
    expect(host.textContent).toContain('every one was taken while she was lying still');
    expect(host.textContent).toContain('not been asked for or observed');
    expect(host.textContent).toContain('at home tonight');
  });

  it('offers every declared choice exactly once', () => {
    render(new QuietChest(), 0);
    for (const action of QUIET_CHEST_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(QUIET_CHEST_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new QuietChest(), 0);
    act(() => { button(labels['record-the-fall-and-what-was-broken'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-the-fall-and-what-was-broken');
  });

  it('retires a recording control once it has been used', () => {
    const model = new QuietChest();
    model.apply('record-the-fall-and-what-was-broken', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-fall-and-what-was-broken'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new QuietChest(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the telephone call and the team reply once each has happened', () => {
    const before = new QuietChest();
    render(before, 0);
    expect(host.textContent).not.toContain('daughter has telephoned');
    const after = new QuietChest();
    after.apply('escalate-to-the-admitting-team', 0);
    after.advance(FAMILY + 1);
    after.advance(FAMILY + TEAM + 1);
    after.apply('reassess', FAMILY + TEAM + 2);
    render(after, FAMILY + TEAM + 2);
    expect(host.textContent).toContain('daughter has telephoned');
    expect(host.textContent).toContain('lost the part that made it safe');
    expect(host.textContent).toContain('next two to three days rather than tonight');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new QuietChest();
    model.apply('her-numbers-are-normal-so-she-can-go-home', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, or discharge date anywhere, in any state', () => {
    const forbidden = ['morphine', 'paracetamol', 'ibuprofen', 'oxycodone', 'mg/kg'];
    for (const action of QUIET_CHEST_ACTIONS) {
      const model = new QuietChest();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
