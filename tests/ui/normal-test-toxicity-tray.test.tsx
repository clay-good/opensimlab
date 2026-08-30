/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NormalTestToxicityTray } from '../../src/modules/oncology/NormalTestToxicityTray';
import { NormalTestToxicity } from '../../src/modules/oncology/normal-test-toxicity';
import { NORMAL_TEST_TOXICITY_NEXT_DOSE_TICKS as NEXT_DOSE, NORMAL_TEST_TOXICITY_SERVICE_TICKS as SERVICE, type NormalTestToxicityAction } from '../../src/modules/oncology/normal-test-toxicity';

const labels: Record<NormalTestToxicityAction, string> = {
  'withhold-the-drug-now': 'Withhold the drug now',
  'record-what-the-normal-test-does-not-exclude': 'Record what the normal test does not exclude',
  'record-the-toxicity-and-its-severity': 'Record the toxicity and its severity',
  'escalate-to-acute-oncology': 'Contact acute oncology',
  'record-bounded-supportive-intent': 'Record bounded qualified-team intent',
  'review-boundaries': 'Review the boundaries and their certainty',
  'check-observations': 'Check the observations only',
  'check-the-treatment-record': 'Check the treatment record only',
  reassess: 'Reassess observations and treatment record',
  handoff: 'Hand off the stopped drug and what it rests on',
  'the-test-was-normal-so-not-the-drug': 'The test was normal, so not the drug',
  'wait-for-oncology-before-stopping': 'Wait for oncology before stopping',
  'advise-him-to-halve-the-dose': 'Advise him to halve the dose',
  'treat-the-symptoms-and-review-tomorrow': 'Treat the symptoms and review tomorrow',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: NormalTestToxicity, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<NormalTestToxicityTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Oral-anticancer-toxicity tray', () => {
  it('leads with the drug status and where the supply is', () => {
    render(new NormalTestToxicity(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('The drug is NOT withheld');
    expect(status).toContain('in his own bag');
    expect(host.textContent).toContain('One action here needs nobody’s permission');
  });

  it('names the normal pre-treatment panel where the letter puts it', () => {
    render(new NormalTestToxicity(), 0);
    expect(host.textContent).toContain('pre-treatment genotype panel was wild type');
  });

  it('withholds the cohort figures until they are recorded', () => {
    render(new NormalTestToxicity(), 0);
    expect(host.textContent).not.toContain('231 of 1018');
    const model = new NormalTestToxicity();
    model.apply('record-what-the-normal-test-does-not-exclude', 0);
    render(model, 1);
    expect(host.textContent).toContain('231 of 1018 wild-type patients');
  });

  it('shows whether the evening dose was taken, and why', () => {
    const idle = new NormalTestToxicity();
    idle.advance(NEXT_DOSE + 10);
    render(idle, NEXT_DOSE + 10);
    expect(host.textContent).toContain('he took it, because nobody had told him not to');
    const stopped = new NormalTestToxicity();
    stopped.apply('withhold-the-drug-now', 0);
    stopped.advance(NEXT_DOSE + 10);
    render(stopped, NEXT_DOSE + 10);
    expect(host.textContent).toContain('put it back');
  });

  it('keeps the service reply out of the tray until the learner has looked', () => {
    const model = new NormalTestToxicity();
    model.apply('escalate-to-acute-oncology', 0);
    model.advance(SERVICE + 10);
    render(model, SERVICE + 10);
    expect(host.textContent).not.toContain('Acute oncology has answered');
    model.apply('reassess', SERVICE + 11);
    render(model, SERVICE + 12);
    expect(host.textContent).toContain('Acute oncology has answered');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new NormalTestToxicity(), 0);
    for (const label of Object.values(labels)) expect(button(label), label).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new NormalTestToxicity(), 0);
    act(() => button(labels['withhold-the-drug-now'])!.click());
    expect(onAction).toHaveBeenCalledWith('withhold-the-drug-now');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new NormalTestToxicity();
    model.apply('withhold-the-drug-now', 0);
    const onAction = render(model, 1);
    const control = button(labels['withhold-the-drug-now'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new NormalTestToxicity();
    model.apply('record-bounded-supportive-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['capecitabine', 'fluorouracil', 'uridine', 'ondansetron']) {
      expect(text, agent).not.toContain(agent);
    }
    render(new NormalTestToxicity(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
