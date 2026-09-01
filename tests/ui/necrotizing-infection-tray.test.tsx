/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NecrotizingInfectionTray } from '../../src/modules/infectious-disease/NecrotizingInfectionTray';
import { NecrotizingInfection, NECROTIZING_INFECTION_PROGRESSION_TICKS as PROGRESSION,
  type NecrotizingInfectionAction } from '../../src/modules/infectious-disease/necrotizing-infection';

const labels: Record<NecrotizingInfectionAction, string> = {
  'recognize-disproportionate-pain': 'Reconcile the pain with the whole patient',
  'mark-the-margin': 'Mark and time the erythema border',
  'call-surgery': 'Request urgent surgical review',
  'record-antimicrobial-intent': 'Record bounded antimicrobial intent',
  'review-boundaries': 'Review the score, the signs, and the clock',
  monitor: 'Arrange surveillance and recheck the border',
  'check-labs': 'Check laboratory evidence only',
  'check-limb': 'Check the limb only',
  reassess: 'Reassess the limb and laboratory evidence',
  handoff: 'Hand off an unconfirmed diagnosis and pending surgery',
  'score-excludes': 'Declare the diagnosis excluded by the score',
  'wait-for-imaging': 'Wait for imaging before surgical review',
  'absent-crepitus-excludes': 'Treat absent crepitus and bullae as reassurance',
  'continue-oral-antibiotics': 'Continue the oral course and review tomorrow',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: NecrotizingInfection, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<NecrotizingInfectionTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Necrotizing infection tray', () => {
  it('shows the reassuring score with its measured limit attached', () => {
    render(new NecrotizingInfection(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('Derived risk score 3, below its usual cutoff of 6');
    expect(text).toContain('roughly one confirmed case in three scores below it');
    expect(text).toContain('No crepitus. No bullae.');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new NecrotizingInfection(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new NecrotizingInfection(), 0);
    act(() => button(labels['call-surgery'])!.click());
    expect(onAction).toHaveBeenCalledWith('call-surgery');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new NecrotizingInfection();
    model.apply('mark-the-margin', 0);
    const onAction = render(model, 1);
    const control = button(labels['mark-the-margin'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('says plainly that the progression is not the learner’s to change', () => {
    render(new NecrotizingInfection(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('happens whatever you record');
    expect(text).toContain('whether the surgical team is already mobilized when it arrives');
    expect(text).toContain('Antimicrobials do not treat dead tissue');
  });

  it('frames the risen score as the lesson rather than a reward', () => {
    const model = new NecrotizingInfection();
    model.advance(PROGRESSION + 5);
    model.apply('reassess', PROGRESSION + 6);
    render(model, PROGRESSION + 7);
    expect(host.textContent).toContain('became useful only after the interval in which acting on it mattered');
  });

  it('names no antimicrobial agent anywhere in the rendered tray', () => {
    const model = new NecrotizingInfection();
    model.apply('record-antimicrobial-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['clindamycin', 'vancomycin', 'piperacillin', 'meropenem']) {
      expect(text).not.toContain(agent);
    }
  });

  it('disables every control while a worked example is playing', () => {
    render(new NecrotizingInfection(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Necrotizing infection tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new NecrotizingInfection(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('asks for the border to be marked with a time', () => {
    const model = new NecrotizingInfection();
    model.apply('recognize-disproportionate-pain', 0);
    render(model, 1, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('write the time on the skin');
    expect(text).toContain('converts a static impression into a rate');
  });

  it('answers each instrument with its sensitivity rather than alarm', () => {
    const model = new NecrotizingInfection();
    for (const action of ['recognize-disproportionate-pain', 'mark-the-margin', 'call-surgery',
      'record-antimicrobial-intent'] as const) model.apply(action, 0);
    render(model, 1, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('two-thirds sensitive');
    expect(text).toContain('rule in and rule out nothing');
  });
});
