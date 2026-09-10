/** @vitest-environment jsdom */
/**
 * The tray puts the arithmetic in the heading, where it cannot be skipped.
 *
 * "168 to 312 is +86%. The band is ±124%." is the whole case in one line, and a learner who
 * reads only headings should still get it. The disclaimers matter as much: this lab declines a
 * treatment change and declines the progression label, and both refusals have to say on screen
 * that they are not the opposite claim.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenalProteinuriaRatioTray } from '../../src/modules/renal-electrolyte/RenalProteinuriaRatioTray';
import { RenalProteinuriaRatio, RENAL_PROTEINURIA_REPEAT_TICKS as REPEAT,
  type RenalProteinuriaAction } from '../../src/modules/renal-electrolyte/proteinuria-ratio';
import { RENAL_PROTEINURIA_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-proteinuria-ratio-tutor';

const labels: Record<RenalProteinuriaAction, string> = {
  'compare-variation': 'Compare the rise against the reference change',
  'review-sampling': 'Review how each sample was taken',
  'request-repeat': 'Request a matched first morning sample',
  'review-patient': 'Check the patient against the number',
  'own-decision': 'Place the treatment decision with the team',
  'call-support': 'Call qualified renal support',
  monitor: 'Arrange review with sampling conditions recorded',
  'check-ratio': 'Check the ratio only', 'check-clinical': 'Check the clinical findings only',
  reassess: 'Reassess the ratio and the clinical picture',
  handoff: 'Hand off the narrowed question and its basis',
  'change-treatment': 'Change treatment on this pair of values',
  'call-it-progression': 'Record the change as progression',
};

describe('Renal proteinuria-ratio tray', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  const render = (model: RenalProteinuriaRatio, tick: number, extra: {
    onAction?: (action: RenalProteinuriaAction) => void; demonstrating?: boolean;
  } = {}) => {
    const onAction = extra.onAction ?? vi.fn();
    act(() => root.render(<RenalProteinuriaRatioTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
      onAction={onAction} demonstrating={extra.demonstrating} />));
    return onAction;
  };
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label);

  it('offers every declared choice and dispatches the one that was pressed', () => {
    const model = new RenalProteinuriaRatio();
    for (const [action, label] of Object.entries(labels) as [RenalProteinuriaAction, string][]) {
      const onAction = render(model, 0);
      const control = button(label);
      expect(control, `${action} has no control`).toBeInstanceOf(HTMLButtonElement);
      act(() => control!.click());
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('puts the arithmetic in a heading', () => {
    render(new RenalProteinuriaRatio(), 0);
    expect(container.textContent).toContain('168 to 312 is +86%. The band is ±124%.');
  });

  it('explains what inside the band does and does not settle', () => {
    const model = new RenalProteinuriaRatio();
    model.apply('compare-variation', 0);
    render(model, 0);
    expect(container.textContent).toContain('does not establish it is noise, and does not establish it is real');
    expect(container.textContent).toContain('this pair cannot tell them apart');
  });

  it('says the unchanged patient is agreement rather than proof', () => {
    const model = new RenalProteinuriaRatio();
    model.apply('review-patient', 0);
    render(model, 0);
    expect(container.textContent).toContain('agreement between an unchanged patient and an uncertain measurement');
    expect(container.textContent).toContain('not proof that nothing is happening');
  });

  it('shows the matched value only once it returns, with its limits attached', () => {
    const model = new RenalProteinuriaRatio();
    model.apply('request-repeat', 0);
    expect(renderToStaticMarkup(<RenalProteinuriaRatioTray assessment={model.snapshot(0)}
      scenarioVersion="0.1.0" onAction={() => {}} />)).not.toContain('189');
    model.advance(REPEAT + 1); model.apply('reassess', REPEAT + 2);
    render(model, REPEAT + 2);
    expect(container.textContent).toContain('189 mg/g from the matched first morning sample');
    expect(container.textContent).toContain('not a timed collection, not a cause, and not proof that nothing changed');
  });

  it('says on screen that it selects no drug, dose, or treatment change', () => {
    render(new RenalProteinuriaRatio(), 0);
    expect(container.textContent).toContain('selects no drug, no dose, and no treatment change');
    expect(container.textContent).toContain('does not decide whether her treatment should change');
  });

  it('reports a refused choice as a refusal that is not the opposite claim', () => {
    const model = new RenalProteinuriaRatio();
    model.apply('call-it-progression', 0);
    render(model, 0);
    expect(container.textContent).toContain('Refusing the label is not the opposite label');
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const onAction = render(new RenalProteinuriaRatio(), 0, { demonstrating: true });
    expect(container.textContent).toContain('Watching the worked example');
    const control = button(labels['compare-variation'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the source and what its reference values describe', () => {
    render(new RenalProteinuriaRatio(), 0);
    expect(container.querySelector<HTMLAnchorElement>(`a[href="${RENAL_PROTEINURIA_SOURCE_HREF}"]`))
      .toBeInstanceOf(HTMLAnchorElement);
    expect(container.textContent).toContain('Fifty clinically stable outpatients');
    expect(container.textContent).toContain('rather than ruling out change in an unstable one');
  });

  it('closes on a narrower question rather than an answer', () => {
    const model = new RenalProteinuriaRatio();
    for (const action of ['compare-variation', 'review-sampling', 'review-patient', 'request-repeat',
      'own-decision', 'call-support', 'monitor'] as const) model.apply(action, 0);
    model.advance(REPEAT + 1); model.apply('reassess', REPEAT + 2); model.apply('handoff', REPEAT + 3);
    render(model, REPEAT + 3);
    expect(container.textContent).toContain('the question is narrower and still open');
    expect(button(labels.reassess)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('waits for the patient before rendering any control', () => {
    act(() => root.render(<RenalProteinuriaRatioTray scenarioVersion="0.1.0" onAction={() => {}} />));
    expect(container.textContent).toContain('Preparing the fictional patient');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
