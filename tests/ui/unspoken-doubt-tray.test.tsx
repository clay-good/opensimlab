/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UnspokenDoubtTray } from '../../src/modules/surgery-trauma/UnspokenDoubtTray';
import { UnspokenDoubt } from '../../src/modules/surgery-trauma/unspoken-doubt';
import { UNSPOKEN_DOUBT_KNIFE_TICKS as KNIFE, UNSPOKEN_DOUBT_TEAM_TICKS as TEAM, UNSPOKEN_DOUBT_ACTIONS, type UnspokenDoubtAction } from '../../src/modules/surgery-trauma/unspoken-doubt';

const labels: Record<UnspokenDoubtAction, string> = {
  'state-what-you-have-noticed': 'State what you have noticed',
  'state-what-would-make-you-wrong': 'State what would make you wrong',
  'state-the-cost-of-each-mistake': 'State the cost of each mistake',
  'say-it-before-the-incision': 'Say it before the incision',
  'record-bounded-team-intent': 'Record bounded team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-checklist-record': 'Check the checklist record only',
  reassess: 'Reassess observations and checklist record',
  handoff: 'Hand off what was said',
  'wait-until-someone-more-senior-notices': 'Wait until someone more senior notices',
  'you-are-probably-misreading-it': 'You are probably misreading it',
  'mention-it-afterwards': 'Mention it afterwards',
  'ask-a-colleague-quietly-first': 'Ask a colleague quietly first',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: UnspokenDoubt, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<UnspokenDoubtTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Unspoken-doubt tray', () => {
  it('leads with the three sides and that nobody else has raised it', () => {
    render(new UnspokenDoubt(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Consent form: left');
    expect(status).toContain('Skin marking: left');
    expect(status).toContain('Label on the displayed image: right');
    expect(status).toContain('Raised by anybody else: nobody');
    expect(host.textContent).toContain('Nobody has done anything wrong. You are the only one who has looked');
  });

  it('says the observations will not catch this and blames nobody', () => {
    render(new UnspokenDoubt(), 0);
    expect(host.textContent).toContain('no number here was ever going to catch a label');
    expect(host.textContent).toContain('Everybody in this room is competent');
    const lowered = (host.textContent ?? '').toLowerCase();
    for (const term of ['the wrong side', 'somebody has made an error']) expect(lowered).not.toContain(term);
  });

  it('offers every declared choice exactly once', () => {
    render(new UnspokenDoubt(), 0);
    for (const action of UNSPOKEN_DOUBT_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(UNSPOKEN_DOUBT_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new UnspokenDoubt(), 0);
    act(() => { button(labels['state-what-you-have-noticed'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('state-what-you-have-noticed');
  });

  it('retires a stating control once it has been used', () => {
    const model = new UnspokenDoubt();
    model.apply('state-what-you-have-noticed', 0);
    const onAction = render(model, 1);
    const control = button(labels['state-what-you-have-noticed'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new UnspokenDoubt(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the knife request and the reply once each has happened', () => {
    const before = new UnspokenDoubt();
    render(before, 0);
    expect(host.textContent).not.toContain('has asked for the knife');
    const after = new UnspokenDoubt();
    after.apply('say-it-before-the-incision', 0);
    after.advance(KNIFE + 1);
    after.advance(KNIFE + TEAM + 1);
    after.apply('reassess', KNIFE + TEAM + 2);
    render(after, KNIFE + TEAM + 2);
    expect(host.textContent).toContain('has asked for the knife');
    expect(host.textContent).toContain('Nobody was annoyed');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new UnspokenDoubt();
    model.apply('wait-until-someone-more-senior-notices', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, or procedure anywhere, in any state', () => {
    const forbidden = ['propofol', 'morphine', 'fentanyl', 'mg/kg', 'scalpel blade'];
    for (const action of UNSPOKEN_DOUBT_ACTIONS) {
      const model = new UnspokenDoubt();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
