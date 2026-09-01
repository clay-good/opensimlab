/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LowScoreTray } from '../../src/modules/medical-surgical-nursing/LowScoreTray';
import { LowScore, LOW_SCORE_FAMILY_CONCERN_TICKS as CONCERN,
  LOW_SCORE_REVIEW_TICKS as REVIEW,
  type LowScoreAction } from '../../src/modules/medical-surgical-nursing/low-score';

const labels: Record<LowScoreAction, string> = {
  'record-observations-and-score': 'Record the observations and the score',
  'record-what-the-score-excludes': 'Record what the score does not exclude',
  'record-the-family-report': 'Record the family report as given',
  'escalate-on-concern': 'Request review on recorded concern',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Arrange increased observation',
  'check-observations': 'Check the observations only',
  'check-context': 'Check baseline and medication only',
  reassess: 'Reassess observations and context',
  handoff: 'Hand off the concern and what it rests on',
  'score-is-low-so-recheck-later': 'Score is low, recheck in four hours',
  'no-fever-so-not-infection': 'No fever, so not infection',
  'use-qsofa-instead': 'Use a more specific score instead',
  'document-and-move-on': 'Document the concern and move on',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: LowScore, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<LowScoreTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Low early-warning score tray', () => {
  it('states the score and that it is correct, first', () => {
    render(new LowScore(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('Aggregate early-warning score: 2');
    expect(status).toContain('it is calculated correctly');
    expect(host.textContent).toContain('Nothing here was done incorrectly');
  });

  it('names the family report as having no field on the chart', () => {
    render(new LowScore(), 0);
    expect(host.textContent).toContain('she is not herself');
    expect(host.textContent).toContain('There is no field for it on the chart');
  });

  it('withholds the sensitivity evidence until it is recorded', () => {
    render(new LowScore(), 0);
    expect(host.textContent).not.toContain('one in eight');
    const model = new LowScore();
    model.apply('record-what-the-score-excludes', 0);
    render(model, 1);
    expect(host.textContent).toContain('roughly one in eight');
    expect(host.textContent).toContain('cannot definitively rule out sepsis');
  });

  it('keeps the review out of the tray until the learner has looked', () => {
    const model = new LowScore();
    model.apply('escalate-on-concern', 0);
    model.advance(REVIEW + 10);
    render(model, REVIEW + 10);
    expect(host.textContent).not.toContain('The review has happened');
    model.apply('reassess', REVIEW + 11);
    render(model, REVIEW + 12);
    expect(host.textContent).toContain('The review has happened');
    expect(host.textContent).toContain('was still 2');
  });

  it('reports the repeated family concern without moving the number', () => {
    const model = new LowScore();
    model.advance(CONCERN + 10);
    render(model, CONCERN + 10);
    expect(host.textContent).toContain('said it again, more plainly');
    expect(host.querySelector('[role="status"]')!.textContent).toContain('score: 2');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new LowScore(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new LowScore(), 0);
    act(() => button(labels['escalate-on-concern'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-on-concern');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new LowScore();
    model.apply('record-observations-and-score', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-observations-and-score'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new LowScore();
    model.apply('escalate-on-concern', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['piperacillin', 'ceftriaxone', 'vancomycin', 'paracetamol']) {
      expect(text).not.toContain(agent);
    }
    render(new LowScore(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Low early-warning score tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new LowScore(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('reads the recorded steps when guidance is on', () => {
    const model = new LowScore();
    render(model, 0, vi.fn(), false, 'guided');
    expect(host.textContent).toContain('A moment to think');
    expect(host.textContent).toContain('Record the observations and the score exactly as they are');
    model.apply('record-observations-and-score', 0);
    render(model, 1, vi.fn(), false, 'guided');
    expect(host.textContent).toContain('Record what this score does not exclude');
  });

  it('never tells the learner the score is wrong', () => {
    render(new LowScore(), 0, vi.fn(), false, 'guided');
    expect(host.textContent).not.toContain('the score is wrong');
    expect(host.textContent).toContain('it is 2 correctly');
  });

  it('replaces the tutor with the way back to the controls while the example runs', () => {
    render(new LowScore(), 0, vi.fn(), true, 'guided');
    expect(host.textContent).toContain('Watching the worked example');
    expect(host.textContent).not.toContain('A moment to think');
  });
});
