/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OxygenTargetScaleTray } from '../../src/modules/medical-surgical-nursing/OxygenTargetScaleTray';
import { OxygenTargetScale, OXYGEN_TARGET_COLLEAGUE_TICKS as COLLEAGUE,
  OXYGEN_TARGET_REVIEW_TICKS as REVIEW,
  type OxygenTargetScaleAction } from '../../src/modules/medical-surgical-nursing/oxygen-target-scale';

const labels: Record<OxygenTargetScaleAction, string> = {
  'check-the-prescription': 'Read the prescription and the scale decision',
  'check-the-chart': 'Read the chart and its scale',
  'record-the-scale-mismatch': 'Record that the documents disagree',
  'rescore-on-the-prescribed-scale': 'Rescore on the prescribed scale',
  'record-what-the-rescore-changes': 'State what the rescore changes',
  'confirm-the-scale-with-the-team': 'Take the scale decision to the team',
  'review-boundaries': 'Review the boundaries and their certainty',
  monitor: 'Arrange observation on the corrected chart',
  reassess: 'Reassess the documents and the observation',
  handoff: 'Hand off the corrected score',
  'raise-the-oxygen-to-correct-it': 'Put oxygen on to bring it up',
  'assume-the-diagnosis-sets-the-scale': 'The diagnosis sets the scale',
  'a-lower-score-means-she-is-improving': 'A lower score means she improved',
  'score-both-and-take-the-higher': 'Score both and take the higher',
};

let host: HTMLDivElement; let root: Root;
beforeEach(() => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = (model: OxygenTargetScale, tick: number, onAction = vi.fn(), demonstrating = false) => {
  act(() => root.render(<OxygenTargetScaleTray assessment={model.snapshot(tick)}
    onAction={onAction} demonstrating={demonstrating} />));
  return onAction;
};
const button = (label: string) => [...host.querySelectorAll('button')]
  .find((entry) => entry.textContent?.trim() === label);

describe('Oxygen-target scoring tray', () => {
  it('never shows the score without the scale it was computed on', () => {
    render(new OxygenTargetScale(), 0);
    const status = host.querySelector('[role="status"]')!.textContent ?? '';
    expect(status).toContain('scored 3 on scale 1');
    expect(status).toContain('Prescribed target 88 to 92% on scale 2');
  });

  it('prints both published scales so the difference is visible, not asserted', () => {
    render(new OxygenTargetScale(), 0);
    const items = [...host.querySelectorAll('li')].map((entry) => entry.textContent ?? '');
    expect(items).toHaveLength(8);
    expect(items.find((text) => text.startsWith('Scale 1 — 91% or below'))).toContain(': 3');
    expect(items.find((text) => text.startsWith('Scale 2 — 88 to 92%'))).toContain(': 0');
  });

  it('says which documents have not been read', () => {
    render(new OxygenTargetScale(), 0);
    expect(host.textContent).toContain('The prescription and the documented scale decision have not been read.');
    const model = new OxygenTargetScale();
    model.apply('check-the-prescription', 0);
    render(model, 1);
    expect(host.textContent).toContain('the scale decision is documented in the notes');
  });

  it('withholds the recalculation and its consequences until each is done', () => {
    render(new OxygenTargetScale(), 0);
    expect(host.textContent).toContain('has not been recalculated against the prescribed range');
    const model = new OxygenTargetScale();
    model.apply('check-the-prescription', 0);
    model.apply('check-the-chart', 1);
    model.apply('record-the-scale-mismatch', 2);
    model.apply('rescore-on-the-prescribed-scale', 3);
    model.apply('record-what-the-rescore-changes', 4);
    render(model, 5);
    expect(host.textContent).toContain('scores 0 on the prescribed scale');
    expect(host.textContent).toContain('what it does not supply is evidence that she is well');
  });

  it('shows the colleague offer once it has happened', () => {
    render(new OxygenTargetScale(), 0);
    expect(host.textContent).not.toContain('offered to put oxygen on her');
    const model = new OxygenTargetScale();
    model.advance(COLLEAGUE + 10);
    render(model, COLLEAGUE + 10);
    expect(host.textContent).toContain('offered to put oxygen on her');
  });

  it('keeps the team review out of the tray until the learner looks', () => {
    const model = new OxygenTargetScale();
    model.apply('check-the-prescription', 0);
    model.apply('check-the-chart', 1);
    model.apply('record-the-scale-mismatch', 2);
    model.apply('rescore-on-the-prescribed-scale', 3);
    model.apply('confirm-the-scale-with-the-team', 4);
    model.advance(REVIEW + 20);
    render(model, REVIEW + 20);
    expect(host.textContent).not.toContain('has confirmed the documented decision');
    model.apply('reassess', REVIEW + 21);
    render(model, REVIEW + 22);
    expect(host.textContent).toContain('has confirmed the documented decision');
  });

  it('says a refused choice does not block a later appropriate handoff', () => {
    const model = new OxygenTargetScale();
    model.apply('raise-the-oxygen-to-correct-it', 0);
    render(model, 1);
    expect(host.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('offers every declared choice with an accessible label', () => {
    render(new OxygenTargetScale(), 0);
    for (const label of Object.values(labels)) expect(button(label)).toBeTruthy();
  });

  it('dispatches the exact action a control names', () => {
    const onAction = render(new OxygenTargetScale(), 0);
    act(() => button(labels['check-the-prescription'])!.click());
    expect(onAction).toHaveBeenCalledWith('check-the-prescription');
  });

  it('names no oxygen setting and disables everything during a worked example', () => {
    const model = new OxygenTargetScale();
    model.apply('review-boundaries', 0);
    render(model, 1);
    const text = (host.textContent ?? '').toLowerCase();
    for (const term of ['litres per minute', 'venturi', 'nasal cannula', 'l/min']) expect(text).not.toContain(term);
    render(new OxygenTargetScale(), 0, vi.fn(), true);
    expect(host.textContent).toContain('Watching the worked example');
    for (const entry of host.querySelectorAll('button')) {
      expect(entry.getAttribute('aria-disabled')).toBe('true');
    }
  });
});
