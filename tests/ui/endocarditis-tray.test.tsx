/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EndocarditisHeartFailureTray } from '../../src/modules/infectious-disease/EndocarditisHeartFailureTray';
import { EndocarditisHeartFailure, ENDOCARDITIS_DECOMPENSATION_TICKS as DECOMP,
  type EndocarditisHeartFailureAction } from '../../src/modules/infectious-disease/endocarditis-heart-failure';

const labels: Record<EndocarditisHeartFailureAction, string> = {
  'recognize-mechanical-failure': 'Recognize mechanical failure, not drug failure',
  'call-endocarditis-team': 'Convene the endocarditis team and a surgical centre',
  'record-surgical-referral-intent': 'Record bounded urgent surgical-referral intent',
  'review-boundaries': 'Review the pulse pressure, vegetation, and timing tiers',
  monitor: 'Arrange perfusion and respiratory surveillance',
  'check-labs': 'Check laboratory evidence only',
  'check-perfusion': 'Check perfusion and breathing only',
  reassess: 'Reassess perfusion and laboratory response',
  handoff: 'Hand off a pending surgical decision',
  'markers-improving-means-better': 'Read the falling marker as an improving patient',
  'wide-pulse-pressure-expected': 'Exclude severe regurgitation on a narrow pulse pressure',
  'vegetation-size-alone-decides': 'Treat vegetation size as the surgical trigger',
  'continue-antimicrobials-and-review-tomorrow': 'Continue antimicrobials and review tomorrow',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: EndocarditisHeartFailure, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<EndocarditisHeartFailureTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Endocarditis tray', () => {
  it('separates the infection from the valve in the opening text', () => {
    render(new EndocarditisHeartFailure(), 0);
    const text = host.textContent ?? '';
    expect(text).toContain('The infection is responding');
    expect(text).toContain('no inflammatory marker measures that');
    expect(text).toContain('12 mm aortic vegetation');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new EndocarditisHeartFailure(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new EndocarditisHeartFailure(), 0);
    act(() => button(labels['call-endocarditis-team'])!.click());
    expect(onAction).toHaveBeenCalledWith('call-endocarditis-team');
  });

  it('marks a completed one-shot choice unavailable without removing it', () => {
    const model = new EndocarditisHeartFailure();
    model.apply('recognize-mechanical-failure', 0);
    const onAction = render(model, 1);
    const control = button(labels['recognize-mechanical-failure'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('shows the pulse pressure narrowing rather than widening', () => {
    render(new EndocarditisHeartFailure(), 0);
    expect(host.textContent).toContain('Current pulse pressure: 42 mmHg');
    const model = new EndocarditisHeartFailure();
    model.advance(DECOMP + 5);
    render(model, DECOMP + 6);
    expect(host.textContent).toContain('Current pulse pressure: 18 mmHg');
    expect(host.textContent).toContain('expected finding in acute severe regurgitation, not evidence against it');
  });

  it('names the marker divergence once the decompensation is observed', () => {
    const model = new EndocarditisHeartFailure();
    model.advance(DECOMP + 5);
    model.apply('reassess', DECOMP + 6);
    render(model, DECOMP + 7);
    expect(host.textContent).toContain('fallen further while the patient has become very much worse');
  });

  it('names no drug and no operation anywhere in the rendered tray', () => {
    const model = new EndocarditisHeartFailure();
    model.apply('record-surgical-referral-intent', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const forbidden of ['furosemide', 'flucloxacillin', 'vancomycin', 'noradrenaline']) {
      expect(text).not.toContain(forbidden);
    }
    expect(host.textContent).toContain('Nothing here selects an operation, a prosthesis, a theatre time, or an anaesthetic plan');
  });

  it('disables every control while a worked example is playing', () => {
    render(new EndocarditisHeartFailure(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
