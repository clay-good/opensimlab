/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrognosisQuestionTray } from '../../src/modules/oncology/PrognosisQuestionTray';
import { PrognosisQuestion, PROGNOSIS_QUESTION_REPEAT_TICKS as REPEAT,
  PROGNOSIS_QUESTION_READBACK_TICKS as READBACK,
  type PrognosisQuestionAction } from '../../src/modules/oncology/prognosis-question';

const labels: Record<PrognosisQuestionAction, string> = {
  'ask-what-he-wants-to-know': 'Ask what he wants the number for',
  'record-the-question-as-asked': 'Record the question in his own words',
  'check-what-he-believes-the-treatment-is-for': 'Check what he thinks the treatment is for',
  'answer-with-scenarios-not-a-number': 'Answer with scenarios, not a number',
  'state-the-direction-of-the-error': 'State which way the estimate is wrong',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-what-was-said': 'Check what has been said so far',
  reassess: 'Reassess the patient and the conversation',
  handoff: 'Hand off what he took from it',
  'give-a-single-number': 'Give him a single number',
  'say-nobody-can-know': 'Tell him nobody can know',
  'reassure-and-move-on': 'Reassure him and move on',
  'answer-before-asking-what-he-wants': 'Answer now, ask afterwards',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: PrognosisQuestion, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<PrognosisQuestionTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Prognosis-conversation tray', () => {
  it('leads with the question and says the monitor cannot answer it', () => {
    render(new PrognosisQuestion(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('how long have I got');
    expect(status).toContain('will not answer it however often they are taken');
    expect(host.textContent).toContain('Find the question behind the question first');
  });

  it('names what he has already said he does not want', () => {
    render(new PrognosisQuestion(), 0);
    expect(host.textContent).toContain('does not want \u201call the details\u201d');
  });

  it('withholds the scenario proportions until an answer is given', () => {
    render(new PrognosisQuestion(), 0);
    expect(host.textContent).not.toContain('63 percent');
    const model = new PrognosisQuestion();
    model.apply('ask-what-he-wants-to-know', 0);
    model.apply('answer-with-scenarios-not-a-number', 1);
    render(model, 2);
    expect(host.textContent).toContain('63 percent');
  });

  it('shows his reason once he has given it', () => {
    const model = new PrognosisQuestion();
    model.advance(REPEAT + 10);
    render(model, REPEAT + 10);
    expect(host.textContent).toContain('getting married in four months');
    expect(host.textContent).toContain('whether to buy a suit');
  });

  it('keeps the readback out of the tray until the learner has looked', () => {
    const model = new PrognosisQuestion();
    model.apply('ask-what-he-wants-to-know', 0);
    model.apply('answer-with-scenarios-not-a-number', 1);
    model.advance(READBACK + 10);
    render(model, READBACK + 10);
    expect(host.textContent).not.toContain('In the corridor');
    model.apply('reassess', READBACK + 11);
    render(model, READBACK + 12);
    expect(host.textContent).toContain('as the best case, on its own');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new PrognosisQuestion(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new PrognosisQuestion(), 0);
    act(() => button(labels['ask-what-he-wants-to-know'])!.click());
    expect(onAction).toHaveBeenCalledWith('ask-what-he-wants-to-know');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new PrognosisQuestion();
    model.apply('ask-what-he-wants-to-know', 0);
    const onAction = render(model, 1);
    const control = button(labels['ask-what-he-wants-to-know'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new PrognosisQuestion();
    model.apply('review-boundaries', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['morphine', 'oxycodone', 'midazolam']) expect(text, agent).not.toContain(agent);
    render(new PrognosisQuestion(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
