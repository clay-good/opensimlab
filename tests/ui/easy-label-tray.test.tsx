/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EasyLabelTray } from '../../src/modules/oncology/EasyLabelTray';
import { EasyLabel } from '../../src/modules/oncology/easy-label';
import { EASY_LABEL_HISTORY_TICKS as HISTORY, EASY_LABEL_TEAM_TICKS as TEAM, type EasyLabelAction } from '../../src/modules/oncology/easy-label';

const labels: Record<EasyLabelAction, string> = {
  'record-that-the-label-is-a-diagnosis-of-exclusion': 'Record that the label is a diagnosis of exclusion',
  'record-what-has-not-been-excluded': 'Record what has not been excluded',
  'escalate-so-both-can-start-together': 'Escalate so both can start together',
  'record-bounded-treatment-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-supplied-results': 'Check the supplied results only',
  reassess: 'Reassess the patient and the results',
  handoff: 'Hand off the open question',
  'start-immunosuppression-now-it-is-obviously-colitis': 'Start immunosuppression now, it is obviously colitis',
  'wait-for-every-result-before-telling-anyone': 'Wait for every result before telling anyone',
  'no-fever-so-it-cannot-be-infection': 'No fever, so it cannot be infection',
  'four-cycles-in-so-it-is-the-drug': 'Four cycles in, so it is the drug',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: EasyLabel, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<EasyLabelTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Diagnosis-of-exclusion tray', () => {
  it('leads with the label and what it still requires', () => {
    render(new EasyLabel(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('a diagnosis of exclusion');
    expect(status).toContain('are not excluded');
    expect(host.textContent).toContain('A label is not a diagnosis until the exclusion has happened');
  });

  it('says no microbiology has been reported and that a summary is unopened', () => {
    render(new EasyLabel(), 0);
    expect(host.textContent).toContain('No microbiological studies have been reported');
    expect(host.textContent).toContain('sits unopened in his record');
  });

  it('withholds both boundary statements until they are reviewed', () => {
    render(new EasyLabel(), 0);
    expect(host.textContent).not.toContain('increased risk of infectious colitis');
    const model = new EasyLabel();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('increased risk of infectious colitis');
    expect(host.textContent).toContain('only one of the two decisions has to wait for a result');
  });

  it('shows the surfaced history with the patient unchanged', () => {
    const model = new EasyLabel();
    model.advance(HISTORY + 10);
    render(model, HISTORY + 10);
    expect(host.textContent).toContain('admission and antibiotics three weeks ago');
    expect(host.textContent).toContain('nothing about him has changed');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new EasyLabel();
    model.apply('escalate-so-both-can-start-together', 0);
    model.advance(TEAM + 10);
    render(model, TEAM + 10);
    expect(host.textContent).not.toContain('gastroenterology have answered');
    model.apply('reassess', TEAM + 11);
    render(model, TEAM + 12);
    expect(host.textContent).toContain('gastroenterology have answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new EasyLabel(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new EasyLabel(), 0);
    act(() => button(labels['escalate-so-both-can-start-together'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-so-both-can-start-together');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new EasyLabel();
    model.apply('escalate-so-both-can-start-together', 0);
    const onAction = render(model, 1);
    const control = button(labels['escalate-so-both-can-start-together'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new EasyLabel();
    model.apply('record-bounded-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['prednisolone', 'methylprednisolone', 'infliximab', 'vedolizumab']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new EasyLabel(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
