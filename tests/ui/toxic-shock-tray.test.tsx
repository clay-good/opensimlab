/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToxicShockTray } from '../../src/modules/infectious-disease/ToxicShockTray';
import { ToxicShock, TOXIC_SHOCK_DETERIORATION_TICKS as DETERIORATION,
  type ToxicShockAction } from '../../src/modules/infectious-disease/toxic-shock';

const labels: Record<ToxicShockAction, string> = {
  'recognize-toxin-pattern': 'Recognize the toxin-mediated pattern',
  'activate-critical-care': 'Activate critical care on the pattern',
  'request-cultures': 'Request blood and sterile-site cultures',
  'record-treatment-intent': 'Record bounded treatment intent',
  'record-definition-status': 'Record the definition as unmet, with the reason',
  'review-boundaries': 'Review what a surveillance definition is for',
  monitor: 'Arrange perfusion and organ-function surveillance',
  'check-labs': 'Check laboratory evidence only',
  'check-perfusion': 'Check perfusion and the rash only',
  reassess: 'Reassess perfusion and organ evidence',
  handoff: 'Hand off an explicitly open diagnosis',
  'declare-confirmed': 'Declare a confirmed case',
  'criteria-count-excludes': 'Exclude it because thresholds are not crossed',
  'pending-cultures-exclude': 'Treat four-hour no-growth as negative',
  'negative-cultures-mean-no-infection': 'Read negative cultures as no infection',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: ToxicShock, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<ToxicShockTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Toxic shock tray', () => {
  it('states that the two definitions fail for different reasons', () => {
    render(new ToxicShock(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('not for the same reason');
    expect(text).toContain('needs desquamation one to two weeks after the rash, which cannot have happened');
    expect(text).toContain('needs the organism to grow, and it has not');
  });

  it('explains that one culture answers one definition and violates the other', () => {
    render(new ToxicShock(), 0);
    expect(host.textContent).toContain('one requires negative cultures and the other requires an isolate');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new ToxicShock(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new ToxicShock(), 0);
    act(() => button(labels['record-definition-status'])!.click());
    expect(onAction).toHaveBeenCalledWith('record-definition-status');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new ToxicShock();
    model.apply('recognize-toxin-pattern', 0);
    const onAction = render(model, 1);
    const control = button(labels['recognize-toxin-pattern'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('records the open status with a named re-check horizon', () => {
    const model = new ToxicShock();
    model.apply('record-definition-status', 0);
    render(model, 1);
    expect(host.textContent).toContain('re-check horizon of one to two weeks is named');
    expect(host.textContent).toContain('may remain unmet permanently');
  });

  it('says accumulating criteria close nothing', () => {
    const model = new ToxicShock();
    model.advance(DETERIORATION + 5);
    model.apply('reassess', DETERIORATION + 6);
    render(model, DETERIORATION + 7);
    expect(host.textContent).toContain('Neither has closed, and the reasons are unchanged.');
    expect(host.textContent).toContain('move both definitions closer and close neither');
  });

  it('names no agent and disables everything during a worked example', () => {
    const model = new ToxicShock();
    model.apply('record-treatment-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const agent of ['clindamycin', 'vancomycin', 'noradrenaline']) expect(text).not.toContain(agent);
    render(new ToxicShock(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
