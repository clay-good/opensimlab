/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeverePneumoniaTray } from '../../src/modules/infectious-disease/SeverePneumoniaTray';
import { SeverePneumonia, SEVERE_PNEUMONIA_DETERIORATION_TICKS as DETERIORATION,
  type SeverePneumoniaAction } from '../../src/modules/infectious-disease/severe-pneumonia';

const labels: Record<SeverePneumoniaAction, string> = {
  'reconcile-supplied-scores': 'Hold both instruments together',
  'recognize-instrument-mismatch': 'Ask what each instrument answers',
  'call-critical-care': 'Request critical-care review now',
  'record-escalation-intent': 'Record bounded escalation intent',
  'review-boundaries': 'Review what the triage evidence establishes',
  monitor: 'Arrange oxygen-requirement and conscious-level surveillance',
  'check-labs': 'Check laboratory evidence only',
  'check-respiratory': 'Check the respiratory assessment only',
  reassess: 'Reassess respiratory and laboratory response',
  handoff: 'Hand off a pending level-of-care decision',
  'mortality-score-decides-the-bed': 'Let the mortality score settle the ward decision',
  'wait-for-deterioration': 'Request review once he deteriorates',
  'marker-grades-severity': 'Grade severity by the C-reactive protein',
  'saturation-alone-is-adequate': 'Read the saturation as adequate on its own',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: SeverePneumonia, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<SeverePneumoniaTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Severe pneumonia tray', () => {
  it('presents both instruments as correct and disagreeing', () => {
    render(new SeverePneumonia(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('the mortality score reads 2');
    expect(text).toContain('severity criteria count 3');
    expect(text).toContain('Nothing is hidden and nothing is mismeasured');
  });

  it('names the two values that belong to neither instrument', () => {
    render(new SeverePneumonia(), 0);
    expect(host.textContent).toContain('C-reactive protein of 284 mg/L and the sodium of 129 mmol/L appear in neither instrument');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new SeverePneumonia(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new SeverePneumonia(), 0);
    act(() => button(labels['call-critical-care'])!.click());
    expect(onAction).toHaveBeenCalledWith('call-critical-care');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new SeverePneumonia();
    model.apply('reconcile-supplied-scores', 0);
    const onAction = render(model, 1);
    const control = button(labels['reconcile-supplied-scores'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('insists the saturation is read with its inspired fraction', () => {
    render(new SeverePneumonia(), 0);
    expect(host.textContent).toContain('92 percent on room air and 92 percent on a third inspired oxygen describe very different lungs');
  });

  it('frames the risen score as inevitable rather than vindicating', () => {
    const model = new SeverePneumonia();
    model.advance(DETERIORATION + 5);
    model.apply('reassess', DETERIORATION + 6);
    render(model, DETERIORATION + 7);
    expect(host.textContent).toContain('It was always going to, and it was never the instrument');
  });

  it('disables every control while a worked example is playing', () => {
    render(new SeverePneumonia(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Severe pneumonia tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new SeverePneumonia(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('asks for both scores side by side before anything is chosen', () => {
    render(new SeverePneumonia(), 0, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('side by side');
    expect(text).toContain('both are calculated correctly');
  });

  it('never calls the mortality score wrong', () => {
    const model = new SeverePneumonia();
    model.apply('reconcile-supplied-scores', 0);
    render(model, 1, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('an answer to a question you did not ask');
    expect(text).not.toContain('the score is wrong');
  });
});
