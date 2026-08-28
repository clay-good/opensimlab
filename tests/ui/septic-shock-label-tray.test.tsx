/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SepticShockLabelTray } from '../../src/modules/infectious-disease/SepticShockLabelTray';
import { SepticShockLabel, SEPTIC_SHOCK_LABEL_CEILING_TICKS as CEILING,
  SEPTIC_SHOCK_LABEL_TRIAL_TICKS as TRIAL,
  type SepticShockLabelAction } from '../../src/modules/infectious-disease/septic-shock-label';

const labels: Record<SepticShockLabelAction, string> = {
  'record-hypoperfusion': 'Record the hypoperfusion as measured',
  'activate-critical-care': 'Activate critical care on the pattern',
  'record-classification-open': 'Record the classification as open',
  'record-resuscitation-intent': 'Record bounded resuscitation intent',
  'review-boundaries': 'Review the targets and their certainty',
  monitor: 'Arrange continuous perfusion monitoring',
  'check-labs': 'Check laboratory evidence only',
  'check-perfusion': 'Check perfusion only',
  reassess: 'Reassess perfusion and laboratory evidence',
  handoff: 'Hand off the measured state and the label',
  'declare-shock-now': 'Declare septic shock now',
  'lactate-means-hypoxia': 'Read the lactate as tissue hypoxia',
  'resuscitate-to-normal-lactate': 'Give fluids until the lactate normalizes',
  'raise-the-map-target': 'Raise the pressure target above 65',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: SepticShockLabel, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<SepticShockLabelTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Septic shock label tray', () => {
  it('shows each criterion separately rather than one verdict', () => {
    render(new SepticShockLabel(), 0);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(3);
    // Two describe a treatment that has not happened; one is answerable now.
    expect(items.filter((text) => text.startsWith('Not yet decidable'))).toHaveLength(2);
    expect(items.filter((text) => text.startsWith('Met'))).toHaveLength(1);
    expect(items.find((text) => text.startsWith('Met'))).toContain('lactate above 2 mmol/L');
  });

  it('turns both undecidable criteria into answers once the trial completes', () => {
    const model = new SepticShockLabel();
    model.apply('record-resuscitation-intent', 0);
    model.advance(TRIAL + 10);
    render(model, TRIAL + 10);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items.filter((text) => text.startsWith('Met'))).toHaveLength(3);
    expect(items.some((text) => text.startsWith('Not yet decidable'))).toBe(false);
    expect(host.textContent).toContain('It did so only once the treatment had run');
  });

  it('says the label is not withheld out of caution', () => {
    render(new SepticShockLabel(), 0);
    expect(host.textContent).toContain('This is not caution');
    expect(host.textContent).toContain('Two of the three have no truth value yet');
  });

  it('reports that the task force left adequacy undefined', () => {
    render(new SepticShockLabel(), 0);
    expect(host.textContent).toContain('could not be explicitly specified, because they are highly user dependent');
    expect(host.textContent).toContain('Nothing here supplies the missing definition');
  });

  it('counts the one-hour ceiling down and reports it passing', () => {
    render(new SepticShockLabel(), 600);
    expect(host.querySelector('[role="status"]')!.textContent)
      .toContain('59 simulated min remain of the hour');
    const passed = new SepticShockLabel();
    passed.advance(CEILING + 10);
    render(passed, CEILING + 10);
    expect(host.querySelector('[role="status"]')!.textContent)
      .toContain('The ceiling has passed, and that is reported rather than hidden');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new SepticShockLabel(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new SepticShockLabel(), 0);
    act(() => button(labels['record-classification-open'])!.click());
    expect(onAction).toHaveBeenCalledWith('record-classification-open');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new SepticShockLabel();
    model.apply('record-hypoperfusion', 0);
    const onAction = render(model, 1);
    const control = button(labels['record-hypoperfusion'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('keeps the completed trial out of the tray until it is observed', () => {
    const model = new SepticShockLabel();
    model.apply('record-resuscitation-intent', 0);
    model.advance(TRIAL + 10);
    render(model, TRIAL + 10);
    expect(host.textContent).not.toContain('The authored resuscitation is complete and the pressure is held');
    model.apply('reassess', TRIAL + 11);
    render(model, TRIAL + 12);
    expect(host.textContent).toContain('The authored resuscitation is complete and the pressure is held');
  });

  it('names no fluid or agent and disables everything during a worked example', () => {
    const model = new SepticShockLabel();
    model.apply('record-resuscitation-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['noradrenaline', 'norepinephrine', 'vasopressin', 'saline', 'mcg/kg/min']) {
      expect(text).not.toContain(agent);
    }
    render(new SepticShockLabel(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
