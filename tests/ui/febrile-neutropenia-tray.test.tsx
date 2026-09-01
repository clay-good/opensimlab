/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FebrileNeutropeniaTray } from '../../src/modules/infectious-disease/FebrileNeutropeniaTray';
import { FebrileNeutropenia, FEBRILE_NEUTROPENIA_DELAY_TICKS as DELAY,
  type FebrileNeutropeniaAction } from '../../src/modules/infectious-disease/febrile-neutropenia';

const labels: Record<FebrileNeutropeniaAction, string> = {
  'recognize-neutropenic-fever': 'Recognize a neutropenic emergency',
  'activate-pathway': 'Activate the neutropenic sepsis pathway',
  'request-cultures': 'Request peripheral and line cultures',
  'record-antimicrobial-intent': 'Record bounded empiric antimicrobial intent',
  'review-boundaries': 'Review the timing target and the risk scores',
  monitor: 'Arrange continuous track-and-trigger surveillance',
  'check-labs': 'Check laboratory evidence only',
  'check-observations': 'Check observations only',
  reassess: 'Reassess observations and laboratory response',
  handoff: 'Hand off continuing neutropenia and pending cultures',
  'crp-reassures': 'Treat the modest marker as reassurance',
  'score-defers-antimicrobials': 'Use a low-risk score to defer therapy',
  'wait-for-source': 'Wait for a localizing sign or an image',
  'expect-leukocytosis': 'Read the flat white cell count as against infection',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: FebrileNeutropenia, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<FebrileNeutropeniaTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Febrile neutropenia tray', () => {
  it('explains why the examination is blind rather than negative', () => {
    render(new FebrileNeutropenia(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('Without neutrophils there is no pus');
    expect(text).toContain('three in five episodes never localize');
    expect(text).toContain('neutrophils 0.2 x10^9/L');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new FebrileNeutropenia(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new FebrileNeutropenia(), 0);
    act(() => button(labels['activate-pathway'])!.click());
    expect(onAction).toHaveBeenCalledWith('activate-pathway');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new FebrileNeutropenia();
    model.apply('activate-pathway', 0);
    const onAction = render(model, 1);
    const control = button(labels['activate-pathway'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('never names an antimicrobial agent or a dose', () => {
    const model = new FebrileNeutropenia();
    model.apply('record-antimicrobial-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['piperacillin', 'tazobactam', 'cefepime', 'meropenem', 'gentamicin']) {
      expect(text).not.toContain(agent);
    }
    expect(host.textContent).toContain('delegates the agent to local microbiology policy');
  });

  it('warns that the marker misleads in both directions', () => {
    render(new FebrileNeutropenia(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('uninformative at the door and its later climb is lag catching up');
    expect(text).toContain('a falling temperature here is deterioration, not recovery');
  });

  it('names the untreated deterioration when it has been observed', () => {
    const model = new FebrileNeutropenia();
    model.advance(DELAY + 5);
    model.apply('reassess', DELAY + 6);
    render(model, DELAY + 7);
    expect(host.textContent).toContain('That combination is worsening infection in a patient who cannot mount a count.');
  });

  it('disables every control while a worked example is playing', () => {
    render(new FebrileNeutropenia(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Febrile neutropenia tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new FebrileNeutropenia(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('refuses looking well as evidence', () => {
    render(new FebrileNeutropenia(), 0, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('How well he looks is not additional evidence');
  });

  it('treats the hour as a system margin rather than a threshold', () => {
    const model = new FebrileNeutropenia();
    for (const action of ['recognize-neutropenic-fever', 'activate-pathway', 'request-cultures',
      'record-antimicrobial-intent'] as const) model.apply(action, 0);
    render(model, 1, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('system-design safety margin');
    expect(text).not.toContain('must be given within one hour');
  });
});
