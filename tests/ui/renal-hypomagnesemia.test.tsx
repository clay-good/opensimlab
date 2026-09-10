/** @vitest-environment jsdom */
/**
 * The tray is where the lesson either lands or does not.
 *
 * A learner reads the number, the controls, and the status line, so those are asserted as
 * text rather than as state: the reference-range framing has to be visible before the choice
 * is made, the refused choices have to say why, and nothing may show a result that was not
 * requested. The controls must also actually be inert while the worked example runs.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenalHypomagnesemiaTray } from '../../src/modules/renal-electrolyte/RenalHypomagnesemiaTray';
import { RenalHypomagnesemia, RENAL_HYPOMAGNESEMIA_REPLETION_TICKS as REPLETION,
  type RenalHypomagnesemiaAction } from '../../src/modules/renal-electrolyte/hypomagnesemia';
import { RENAL_HYPOMAGNESEMIA_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hypomagnesemia-tutor';

const labels: Record<RenalHypomagnesemiaAction, string> = {
  monitor: 'Start monitoring and qualified QT review',
  'replace-magnesium': 'Request qualified magnesium repletion',
  'stop-exposure': 'Stop the long-term acid blocker with the team',
  'review-number': 'Review what this magnesium value excludes',
  'review-context': 'Review exposure, losses, and prior replacement',
  'call-support': 'Call qualified acute-care and renal support',
  'check-magnesium': 'Check magnesium only', 'check-potassium': 'Check potassium only',
  reassess: 'Reassess magnesium, potassium, calcium, and bedside response',
  handoff: 'Hand off repletion, medication review, and surveillance',
  'potassium-alone': 'Replace potassium again on its own',
  'normal-number-excludes': 'Record the magnesium as normal and exclude depletion',
};

describe('Renal hypomagnesemia tray', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  const render = (model: RenalHypomagnesemia, tick: number, extra: {
    onAction?: (action: RenalHypomagnesemiaAction) => void; demonstrating?: boolean;
  } = {}) => {
    const onAction = extra.onAction ?? vi.fn();
    act(() => root.render(<RenalHypomagnesemiaTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
      onAction={onAction} demonstrating={extra.demonstrating} />));
    return onAction;
  };
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label);

  it('offers every declared choice and dispatches the one that was pressed', () => {
    const model = new RenalHypomagnesemia();
    for (const [action, label] of Object.entries(labels) as [RenalHypomagnesemiaAction, string][]) {
      const onAction = render(model, 0);
      const control = button(label);
      expect(control, `${action} has no control`).toBeInstanceOf(HTMLButtonElement);
      act(() => control!.click());
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('shows the in-range framing before the learner commits to anything', () => {
    render(new RenalHypomagnesemia(), 0);
    expect(container.textContent).toContain('0.78 mmol/L is inside the range. It is not an all-clear.');
    expect(container.textContent).toContain('Decide what the supplied magnesium of 0.78 mmol/L excludes before you act on it');
  });

  it('explains what the value excludes only once that review is recorded', () => {
    const model = new RenalHypomagnesemia();
    expect(renderToStaticMarkup(<RenalHypomagnesemiaTray assessment={model.snapshot(0)}
      scenarioVersion="0.1.0" onAction={() => {}} />)).not.toContain('sustained from body pools');
    model.apply('review-number', 1);
    render(model, 1);
    expect(container.textContent).toContain('sustained from body pools');
    expect(container.textContent).toContain('does not establish it');
    expect(container.textContent).toContain('fractional excretion of magnesium of 1.4%');
  });

  it('shows no result that has not been requested', () => {
    const model = new RenalHypomagnesemia();
    model.apply('monitor', 0); model.apply('replace-magnesium', 1);
    const markup = renderToStaticMarkup(<RenalHypomagnesemiaTray assessment={model.snapshot(REPLETION + 5)}
      scenarioVersion="0.1.0" onAction={() => {}} />);
    expect(markup).toContain('No new magnesium-only measurement has been requested.');
    expect(markup).toContain('No new potassium-only measurement has been requested.');
    expect(markup).not.toContain('0.81');
    expect(markup).not.toContain('3.6 mmol/L');
  });

  it('reports a refused choice as a refusal with its reason', () => {
    const model = new RenalHypomagnesemia();
    model.apply('potassium-alone', 0);
    render(model, 0);
    expect(container.textContent).toContain('A third potassium replacement on its own was refused');
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('puts the requested full assessment on screen with the response where it belongs', () => {
    const model = new RenalHypomagnesemia();
    model.apply('monitor', 0); model.apply('replace-magnesium', 1);
    model.advance(REPLETION + 2); model.apply('reassess', REPLETION + 3);
    render(model, REPLETION + 3);
    expect(container.textContent).toContain('potassium 3.6 mmol/L');
    expect(container.textContent).toContain('ionized calcium 1.14 mmol/L');
    expect(container.textContent).toContain('cramping has settled');
    expect(container.textContent).toContain('magnesium 0.81 mmol/L');
    expect(container.textContent).toContain('historical observations, not live measurements');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const onAction = render(new RenalHypomagnesemia(), 0, { demonstrating: true });
    expect(container.textContent).toContain('Watching the worked example');
    const control = button(labels.monitor)!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the source and says what it is not', () => {
    render(new RenalHypomagnesemia(), 0);
    const link = container.querySelector<HTMLAnchorElement>(`a[href="${RENAL_HYPOMAGNESEMIA_SOURCE_HREF}"]`)!;
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link.rel).toBe('noreferrer');
    expect(container.textContent).toContain('It is a mechanistic review, not a trial');
  });

  it('closes with an unresolved handoff rather than a recovery', () => {
    const model = new RenalHypomagnesemia();
    for (const action of ['monitor', 'review-number', 'replace-magnesium', 'stop-exposure',
      'call-support', 'review-context'] as const) model.apply(action, 0);
    model.advance(REPLETION + 1); model.apply('reassess', REPLETION + 2); model.apply('handoff', REPLETION + 3);
    render(model, REPLETION + 3);
    expect(container.textContent).toContain('The deficit may be far from corrected');
    expect(container.textContent).toContain('this is not discharge readiness');
    expect(button(labels.reassess)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('waits for the patient before rendering any control', () => {
    act(() => root.render(<RenalHypomagnesemiaTray scenarioVersion="0.1.0" onAction={() => {}} />));
    expect(container.textContent).toContain('Preparing the fictional patient');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
