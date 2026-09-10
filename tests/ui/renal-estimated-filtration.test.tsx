/** @vitest-environment jsdom */
/**
 * The tray has to keep showing an empty line where the answer would be.
 *
 * A learner reads "measured filtration not available" and either accepts it or keeps looking
 * for the number; the whole lesson depends on that line being there and staying there. The
 * disclaimers about selecting no drug and no marker are asserted as visible text, because a lab
 * that argues against dosing on a reported value is exactly the shape that reads as a rule.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenalEstimatedFiltrationTray } from '../../src/modules/renal-electrolyte/RenalEstimatedFiltrationTray';
import { RenalEstimatedFiltration, RENAL_ESTIMATE_SECOND_MARKER_TICKS as MARKER,
  type RenalEstimateAction } from '../../src/modules/renal-electrolyte/estimated-filtration';
import { RENAL_ESTIMATE_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-estimated-filtration-tutor';

const labels: Record<RenalEstimateAction, string> = {
  'review-precision': 'Review what the reported estimate claims',
  'review-generation': 'Review what the estimate was generated from',
  'request-second-marker': 'Request a differently generated marker',
  'review-discordance': 'Record the disagreement between the estimates',
  'own-medicine-decision': 'Place the medicine decision with the team',
  'call-support': 'Call qualified renal and pharmacy support',
  monitor: 'Arrange continuing review',
  'check-creatinine': 'Check creatinine only', 'check-second-marker': 'Check the second marker only',
  reassess: 'Reassess both estimates and the bedside',
  handoff: 'Hand off the uncertainty and the owned decision',
  'dose-on-estimate': 'Start at the dose the estimate supports',
  'take-the-convenient-number': 'Adopt whichever estimate suits the plan',
};

describe('Renal estimated-filtration tray', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  const render = (model: RenalEstimatedFiltration, tick: number, extra: {
    onAction?: (action: RenalEstimateAction) => void; demonstrating?: boolean;
  } = {}) => {
    const onAction = extra.onAction ?? vi.fn();
    act(() => root.render(<RenalEstimatedFiltrationTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
      onAction={onAction} demonstrating={extra.demonstrating} />));
    return onAction;
  };
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label);

  it('offers every declared choice and dispatches the one that was pressed', () => {
    const model = new RenalEstimatedFiltration();
    for (const [action, label] of Object.entries(labels) as [RenalEstimateAction, string][]) {
      const onAction = render(model, 0);
      const control = button(label);
      expect(control, `${action} has no control`).toBeInstanceOf(HTMLButtonElement);
      act(() => control!.click());
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('frames the reported value as an estimate with a width', () => {
    render(new RenalEstimatedFiltration(), 0);
    expect(container.textContent).toContain('68 is an estimate. Ask how wide.');
    expect(container.textContent).toContain('The measured line stays empty.');
  });

  it('says on screen that it selects no drug, dose, equation, or marker', () => {
    render(new RenalEstimatedFiltration(), 0);
    expect(container.textContent).toContain('selects no drug, no dose, no adjustment, no equation, and no marker');
    expect(container.textContent).toContain('does not decide whether the medicine should be started');
  });

  it('explains the width and the generation only once each is reviewed', () => {
    const model = new RenalEstimatedFiltration();
    const before = renderToStaticMarkup(<RenalEstimatedFiltrationTray assessment={model.snapshot(0)}
      scenarioVersion="0.1.0" onAction={() => {}} />);
    expect(before).not.toContain('one value in seven');
    model.apply('review-precision', 1); model.apply('review-generation', 2);
    render(model, 2);
    expect(container.textContent).toContain('one value in seven outside even that band');
    expect(container.textContent).toContain('a population convention rather than her body');
    expect(container.textContent).toContain('None of this establishes that her filtration is low.');
  });

  it('has nothing to compare until the marker returns', () => {
    const model = new RenalEstimatedFiltration();
    model.apply('request-second-marker', 0);
    render(model, 0);
    expect(container.textContent).toContain('The second marker has not returned.');
    expect(container.textContent).not.toContain('38 against the first 68');
  });

  it('shows the disagreement, and refuses to settle it', () => {
    const model = new RenalEstimatedFiltration();
    model.apply('request-second-marker', 0); model.advance(MARKER + 1);
    render(model, MARKER + 1);
    expect(container.textContent).toContain('The second estimate is 38 against the first 68');
    model.apply('review-discordance', MARKER + 2);
    render(model, MARKER + 2);
    expect(container.textContent).toContain('neither is a measurement');
    expect(container.textContent).toContain('not a rule and not a correction factor');
  });

  it('keeps the measured line empty in the full assessment', () => {
    const model = new RenalEstimatedFiltration();
    model.apply('request-second-marker', 0); model.advance(MARKER + 1);
    model.apply('reassess', MARKER + 2);
    render(model, MARKER + 2);
    expect(container.textContent).toContain('measured filtration not available');
    expect(container.textContent).toContain('No measured filtration rate is supplied at any point');
  });

  it('reports a refused choice as a refusal with its reason', () => {
    const model = new RenalEstimatedFiltration();
    model.apply('dose-on-estimate', 0);
    render(model, 0);
    expect(container.textContent).toContain('Starting at the dose the reported estimate supports');
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const onAction = render(new RenalEstimatedFiltration(), 0, { demonstrating: true });
    expect(container.textContent).toContain('Watching the worked example');
    const control = button(labels['review-precision'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the source and calls its accuracy a population statistic', () => {
    render(new RenalEstimatedFiltration(), 0);
    expect(container.querySelector<HTMLAnchorElement>(`a[href="${RENAL_ESTIMATE_SOURCE_HREF}"]`))
      .toBeInstanceOf(HTMLAnchorElement);
    expect(container.textContent).toContain('population statistics from development and validation cohorts');
  });

  it('closes by handing over uncertainty rather than a number', () => {
    const model = new RenalEstimatedFiltration();
    for (const action of ['review-precision', 'review-generation', 'request-second-marker',
      'own-medicine-decision', 'call-support', 'monitor'] as const) model.apply(action, 0);
    model.advance(MARKER + 1); model.apply('review-discordance', MARKER + 2);
    model.apply('reassess', MARKER + 3); model.apply('handoff', MARKER + 4);
    render(model, MARKER + 4);
    expect(container.textContent).toContain('what is handed on is the uncertainty, stated as uncertainty');
    expect(button(labels.reassess)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('waits for the patient before rendering any control', () => {
    act(() => root.render(<RenalEstimatedFiltrationTray scenarioVersion="0.1.0" onAction={() => {}} />));
    expect(container.textContent).toContain('Preparing the fictional patient');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
