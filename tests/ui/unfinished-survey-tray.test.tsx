/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UnfinishedSurveyTray } from '../../src/modules/surgery-trauma/UnfinishedSurveyTray';
import { UnfinishedSurvey } from '../../src/modules/surgery-trauma/unfinished-survey';
import { UNFINISHED_SURVEY_WAKE_TICKS as WAKE, UNFINISHED_SURVEY_TEAM_TICKS as TEAM, UNFINISHED_SURVEY_ACTIONS, type UnfinishedSurveyAction } from '../../src/modules/surgery-trauma/unfinished-survey';

const labels: Record<UnfinishedSurveyAction, string> = {
  'record-why-he-could-not-be-examined': 'Record why he could not be examined',
  'record-what-the-injury-list-rests-on': 'Record what the injury list rests on',
  'record-that-the-third-survey-is-not-done': 'Record that the third survey is not done',
  'escalate-to-the-trauma-team': 'Ask the team that owns the survey to complete it',
  'record-bounded-survey-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-injury-record': 'Check the injury record only',
  reassess: 'Reassess observations and injury record',
  handoff: 'Hand off the unfinished assessment',
  'the-secondary-survey-is-documented-complete': 'The secondary survey is documented complete',
  'the-pan-scan-would-have-shown-it': 'The whole-body scan would have shown it',
  'he-has-not-complained-of-anything': 'He has not complained of anything',
  'clear-him-now-and-review-if-something-appears': 'Clear him now and review if something appears',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: UnfinishedSurvey, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<UnfinishedSurveyTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    guidance={guidance} onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Unfinished-survey tray', () => {
  it('leads with what the record says and what is missing from it', () => {
    render(new UnfinishedSurvey(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('14 hours ago');
    expect(status).toContain('4 injuries listed');
    expect(status).toContain('Secondary survey documented as complete');
    expect(status).toContain('Tertiary survey not documented');
    expect(host.textContent).toContain('The record is accurate. Read what it actually says');
  });

  it('shows the normal observations and the bed pressure without letting either reassure', () => {
    render(new UnfinishedSurvey(), 0);
    expect(host.textContent).toContain('none of them is abnormal');
    expect(host.textContent).toContain('Glasgow Coma Scale of 6 at the scene');
    expect(host.textContent).toContain('stepped down tonight');
  });

  it('offers every declared choice exactly once', () => {
    render(new UnfinishedSurvey(), 0);
    for (const action of UNFINISHED_SURVEY_ACTIONS) {
      expect(button(labels[action]), `${action} has no control`).toBeTruthy();
    }
    expect(host.querySelectorAll('button')).toHaveLength(UNFINISHED_SURVEY_ACTIONS.length);
  });

  it('dispatches the choice the learner pressed', () => {
    const onAction = render(new UnfinishedSurvey(), 0);
    act(() => { button(labels['record-why-he-could-not-be-examined'])!.click(); });
    expect(onAction).toHaveBeenCalledWith('record-why-he-could-not-be-examined');
  });

  it('retires a recording control once it has been used', () => {
    const model = new UnfinishedSurvey();
    model.apply('record-why-he-could-not-be-examined', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-why-he-could-not-be-examined'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => { control.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('takes no input while the worked example is driving', () => {
    const onAction = render(new UnfinishedSurvey(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    act(() => { button(labels.reassess)!.click(); });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the sedation window with everything monitored unchanged', () => {
    const before = new UnfinishedSurvey();
    render(before, 0);
    expect(host.textContent).not.toContain('Sedation has been lightened');
    const after = new UnfinishedSurvey();
    after.apply('escalate-to-the-trauma-team', 0);
    after.advance(WAKE + 1);
    after.advance(WAKE + TEAM + 1);
    after.apply('reassess', WAKE + TEAM + 2);
    render(after, WAKE + TEAM + 2);
    expect(host.textContent).toContain('Sedation has been lightened');
    expect(host.textContent).toContain('exactly as they were');
    expect(host.textContent).toContain('records an examination rather than an absence of injury');
  });

  it('keeps a refused shortcut visible without blocking a later handoff', () => {
    const model = new UnfinishedSurvey();
    model.apply('the-secondary-survey-is-documented-complete', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
    expect(button(labels.handoff)!.getAttribute('aria-disabled')).toBe('false');
  });

  it('names no agent, dose, imaging modality, or procedure anywhere, in any state', () => {
    const forbidden = ['morphine', 'propofol', 'midazolam', 'laparotomy', 'mg/kg', 'ultrasound'];
    for (const action of UNFINISHED_SURVEY_ACTIONS) {
      const model = new UnfinishedSurvey();
      model.apply(action, 0);
      render(model, 1);
      const text = (host.textContent ?? '').toLowerCase();
      for (const term of forbidden) expect(text, `${action} leaked ${term}`).not.toContain(term);
    }
  });
});
