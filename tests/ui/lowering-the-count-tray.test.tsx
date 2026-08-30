/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoweringTheCountTray } from '../../src/modules/oncology/LoweringTheCountTray';
import { LoweringTheCount } from '../../src/modules/oncology/lowering-the-count';
import { LOWERING_THE_COUNT_DETERIORATION_TICKS as WORSE, LOWERING_THE_COUNT_TEAM_TICKS as TEAM, type LoweringTheCountAction } from '../../src/modules/oncology/lowering-the-count';

const labels: Record<LoweringTheCountAction, string> = {
  'record-the-clinical-picture-not-the-count': 'Record the clinical picture, not the count',
  'record-what-the-count-does-and-does-not-license': 'Record what the count does not license',
  'escalate-to-haematology-now': 'Call haematology now',
  'record-bounded-cytoreduction-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-supplied-results': 'Check the supplied results only',
  reassess: 'Reassess the patient and the results',
  handoff: 'Hand off what makes it an emergency',
  'send-him-for-apheresis-and-stand-down': 'Send him for apheresis and stand down',
  'the-count-alone-makes-the-diagnosis': 'The count alone makes the diagnosis',
  'wait-for-the-marrow-before-calling': 'Wait for the marrow before calling',
  'treat-the-confusion-as-delirium': 'Treat the confusion as delirium',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: LoweringTheCount, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<LoweringTheCountTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Hyperleukocytosis tray', () => {
  it('leads with the count and the findings together', () => {
    render(new LoweringTheCount(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('240');
    expect(status).toContain('breathless at rest and confused');
    expect(host.textContent).toContain('The findings, not the number, make this an emergency');
  });

  it('says there is no marrow result and where the registrar is', () => {
    render(new LoweringTheCount(), 0);
    expect(host.textContent).toContain('no marrow result');
    expect(host.textContent).toContain('elsewhere in the hospital');
  });

  it('withholds the meta-analytic figures until the boundaries are reviewed', () => {
    render(new LoweringTheCount(), 0);
    expect(host.textContent).not.toContain('0.69 to 1.13');
    const model = new LoweringTheCount();
    model.apply('review-boundaries', 0);
    render(model, 1);
    expect(host.textContent).toContain('0.69 to 1.13');
    expect(host.textContent).toContain('includes benefit as well as harm');
  });

  it('shows the deterioration with the count unchanged', () => {
    const model = new LoweringTheCount();
    model.advance(WORSE + 10);
    render(model, WORSE + 10);
    expect(host.textContent).toContain('more breathless and harder to rouse');
    expect(host.textContent).toContain('it is the same sample');
  });

  it('keeps the team reply out of the tray until the learner has looked', () => {
    const model = new LoweringTheCount();
    model.apply('escalate-to-haematology-now', 0);
    model.advance(TEAM + 10);
    render(model, TEAM + 10);
    expect(host.textContent).not.toContain('Haematology has answered');
    model.apply('reassess', TEAM + 11);
    render(model, TEAM + 12);
    expect(host.textContent).toContain('Haematology has answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new LoweringTheCount(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new LoweringTheCount(), 0);
    act(() => button(labels['escalate-to-haematology-now'])!.click());
    expect(onAction).toHaveBeenCalledWith('escalate-to-haematology-now');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new LoweringTheCount();
    model.apply('escalate-to-haematology-now', 0);
    const onAction = render(model, 1);
    const control = button(labels['escalate-to-haematology-now'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new LoweringTheCount();
    model.apply('record-bounded-cytoreduction-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['hydroxycarbamide', 'hydroxyurea', 'cytarabine', 'rasburicase']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new LoweringTheCount(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
