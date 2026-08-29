/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RareEarlyMyocarditisTray } from '../../src/modules/oncology/RareEarlyMyocarditisTray';
import { RareEarlyMyocarditis } from '../../src/modules/oncology/rare-early-myocarditis';
import { RARE_EARLY_MYOCARDITIS_RHYTHM_TICKS as RHYTHM, RARE_EARLY_MYOCARDITIS_TEAM_TICKS as TEAMS, type RareEarlyMyocarditisAction } from '../../src/modules/oncology/rare-early-myocarditis';

const labels: Record<RareEarlyMyocarditisAction, string> = {
  'record-the-exposure-interval': 'Record the exposure interval',
  'record-what-is-present-that-is-not-cardiac': 'Record what does not sound cardiac',
  'arrange-continuous-rhythm-monitoring': 'Arrange continuous rhythm monitoring',
  'escalate-to-both-teams': 'Contact cardiology and oncology together',
  'record-bounded-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-supplied-results': 'Check the supplied results only',
  reassess: 'Reassess the patient and the results',
  handoff: 'Hand off the window and what it rests on',
  'it-is-too-rare-to-be-that': 'It is far too rare to be that',
  'the-troponin-is-raised-in-lots-of-things': 'Troponin is raised in lots of things',
  'repeat-the-troponin-in-a-week': 'Repeat the troponin in a week',
  'treat-it-as-a-coronary-syndrome-and-stop-there': 'Run the coronary pathway and stop there',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: RareEarlyMyocarditis, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<RareEarlyMyocarditisTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Checkpoint-myocarditis tray', () => {
  it('leads with the interval and whether he is monitored', () => {
    render(new RareEarlyMyocarditis(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('4 weeks and 2 cycles');
    expect(status).toContain('not on a monitor');
    expect(host.textContent).toContain('He is inside the described window');
  });

  it('keeps the shoulders and the absent chest pain on screen', () => {
    render(new RareEarlyMyocarditis(), 0);
    expect(host.textContent).toContain('aching and weak shoulders');
    expect(host.textContent).toContain('No chest pain');
  });

  it('withholds the incidence and fatality until the boundaries are reviewed', () => {
    render(new RareEarlyMyocarditis(), 0);
    expect(host.textContent).not.toContain('52 of 131');
    const model = new RareEarlyMyocarditis();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('52 of 131 reported cases');
  });

  it('says nothing is watching the conduction until monitoring is arranged', () => {
    render(new RareEarlyMyocarditis(), 0);
    expect(host.textContent).toContain('Nothing is watching his conduction');
    const model = new RareEarlyMyocarditis();
    model.apply('arrange-continuous-rhythm-monitoring', 0);
    model.advance(RHYTHM + 10);
    render(model, RHYTHM + 10);
    expect(host.textContent).toContain('now intermittent Mobitz type I');
    expect(host.textContent).not.toContain('Nothing is watching his conduction');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new RareEarlyMyocarditis();
    model.apply('escalate-to-both-teams', 0);
    model.advance(TEAMS + 10);
    render(model, TEAMS + 10);
    expect(host.textContent).not.toContain('Both teams have answered');
    model.apply('reassess', TEAMS + 11);
    render(model, TEAMS + 12);
    expect(host.textContent).toContain('Both teams have answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new RareEarlyMyocarditis(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new RareEarlyMyocarditis(), 0);
    act(() => button(labels['arrange-continuous-rhythm-monitoring'])!.click());
    expect(onAction).toHaveBeenCalledWith('arrange-continuous-rhythm-monitoring');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new RareEarlyMyocarditis();
    model.apply('record-the-exposure-interval', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-the-exposure-interval'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new RareEarlyMyocarditis();
    model.apply('record-bounded-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['methylprednisolone', 'infliximab', 'abatacept']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new RareEarlyMyocarditis(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
