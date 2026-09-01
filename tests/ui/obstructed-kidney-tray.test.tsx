/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObstructedKidneyTray } from '../../src/modules/infectious-disease/ObstructedKidneyTray';
import { ObstructedKidney, OBSTRUCTED_KIDNEY_DELAY_TICKS as DELAY,
  type ObstructedKidneyAction } from '../../src/modules/infectious-disease/obstructed-kidney';

const labels: Record<ObstructedKidneyAction, string> = {
  'recognize-obstruction': 'Reconcile the infection and the obstruction',
  'call-urology': 'Involve urology and interventional radiology',
  'request-cultures': 'Request blood, urine, and collecting-system cultures',
  'record-decompression-intent': 'Record bounded urgent decompression intent',
  'defer-stone-treatment': 'Defer definitive stone treatment',
  'review-boundaries': 'Review timing, modality, and evidence limits',
  monitor: 'Arrange track-and-trigger surveillance',
  'check-labs': 'Check laboratory evidence only',
  'check-observations': 'Check observations only',
  reassess: 'Reassess observations and laboratory response',
  handoff: 'Hand off unresolved infection and pending drainage',
  'antibiotics-are-enough': 'Continue antimicrobials alone',
  'wait-for-crp': 'Wait for the C-reactive protein trend',
  'choose-modality': 'Declare one drainage modality correct',
  'treat-stone-now': 'Proceed to definitive stone treatment now',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: ObstructedKidney, tick: number, onAction = vi.fn(), demonstrating = false,
  guidance: 'unassisted' | 'coached' | 'guided' = 'unassisted') => {
  act(() => root.render(<ObstructedKidneyTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
    onAction={onAction} guidance={guidance} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Obstructed kidney tray', () => {
  it('states the antimicrobial premise rather than implying a learner chose it', () => {
    render(new ObstructedKidney(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('supplied premise of this lesson, not a learner decision');
    expect(text).toContain('8 mm obstructing distal ureteric stone');
    expect(text).toContain('creatinine 148 µmol/L against a baseline near 70');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new ObstructedKidney(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new ObstructedKidney(), 0);
    act(() => button(labels['record-decompression-intent'])!.click());
    expect(onAction).toHaveBeenCalledWith('record-decompression-intent');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new ObstructedKidney();
    model.apply('call-urology', 0);
    const onAction = render(model, 1);
    const control = button(labels['call-urology'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('never presents either drainage route as the right answer', () => {
    const model = new ObstructedKidney();
    model.apply('review-boundaries', 0);
    render(model, 1);
    const text = host.textContent ?? '';
    expect(text).toContain('this lesson marks neither as the right answer');
    expect(text).toContain('no guideline states an hour threshold here');
    expect(text).toContain('conditional on very-low-certainty observational evidence');
  });

  it('names the undrained deterioration when it has been observed', () => {
    const model = new ObstructedKidney();
    model.advance(DELAY + 5);
    model.apply('reassess', DELAY + 6);
    render(model, DELAY + 7);
    expect(host.textContent).toContain('deterioration after six authored hours of antimicrobial care with the kidney still obstructed');
  });

  it('warns that the marker can rise while the patient improves', () => {
    render(new ObstructedKidney(), 0);
    expect(host.textContent).toContain('C-reactive protein lags by many hours, so it can keep rising while the patient improves');
    expect(host.textContent).toContain('Drainage is not cure');
  });

  it('disables every control while a worked example is playing', () => {
    render(new ObstructedKidney(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});

describe('Obstructed kidney tutor', () => {
  it('says nothing at all on the unassisted setting', () => {
    render(new ObstructedKidney(), 0);
    expect(host.textContent).not.toContain('A moment to think');
  });

  it('reads the fever and the obstruction as one thing', () => {
    render(new ObstructedKidney(), 0, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('describe one thing rather than two');
  });

  it('picks no drainage route and names no hour threshold', () => {
    const model = new ObstructedKidney();
    for (const action of ['recognize-obstruction', 'call-urology', 'request-cultures',
      'record-decompression-intent', 'defer-stone-treatment'] as const) model.apply(action, 0);
    render(model, 1, vi.fn(), false, 'guided');
    const text = host.textContent ?? '';
    expect(text).toContain('has not separated nephrostomy from stenting');
    expect(text).not.toContain('within one hour');
  });
});
