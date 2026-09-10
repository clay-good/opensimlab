/** @vitest-environment jsdom */
/**
 * The tray has to name the surrogate before the learner reaches the buttons.
 *
 * "The target is standing in for something" is the sentence the lesson turns on, and the
 * calcification half of the trial is the sentence a learner is least likely to have met. Both
 * are asserted as visible text, along with the disclaimer that nothing here selects a binder,
 * because a lab arguing against a routine target reads as advice unless it says otherwise where
 * the learner is actually looking.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenalPhosphateTargetTray } from '../../src/modules/renal-electrolyte/RenalPhosphateTargetTray';
import { RenalPhosphateTarget, RENAL_PHOSPHATE_RECORDS_TICKS as RECORDS,
  type RenalPhosphateAction } from '../../src/modules/renal-electrolyte/phosphate-target';
import { RENAL_PHOSPHATE_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-phosphate-target-tutor';

const labels: Record<RenalPhosphateAction, string> = {
  'review-surrogate': 'Name the target as a surrogate',
  'review-trial': 'Review the randomised comparison',
  'own-decision': 'Place the binder decision with the team',
  'review-intake': 'Review what he is actually eating',
  'call-support': 'Call qualified renal and dietetic support',
  monitor: 'Arrange continuing biochemical and nutritional review',
  'check-phosphate': 'Check phosphate only', 'check-nutrition': 'Check weight and albumin only',
  reassess: 'Reassess phosphate, nutrition, and the record',
  handoff: 'Hand off the owned decision and its context',
  'treat-the-number': 'Start a binder to bring the value into range',
  'restrict-further': 'Tighten the dietary restriction again',
};

describe('Renal phosphate-target tray', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  const render = (model: RenalPhosphateTarget, tick: number, extra: {
    onAction?: (action: RenalPhosphateAction) => void; demonstrating?: boolean;
  } = {}) => {
    const onAction = extra.onAction ?? vi.fn();
    act(() => root.render(<RenalPhosphateTargetTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
      onAction={onAction} demonstrating={extra.demonstrating} />));
    return onAction;
  };
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label);

  it('offers every declared choice and dispatches the one that was pressed', () => {
    const model = new RenalPhosphateTarget();
    for (const [action, label] of Object.entries(labels) as [RenalPhosphateAction, string][]) {
      const onAction = render(model, 0);
      const control = button(label);
      expect(control, `${action} has no control`).toBeInstanceOf(HTMLButtonElement);
      act(() => control!.click());
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('names the target as a surrogate before anything else', () => {
    render(new RenalPhosphateTarget(), 0);
    const text = container.textContent ?? '';
    expect(text).toContain('The target is standing in for something.');
    expect(text.indexOf('The target is standing in for something.'))
      .toBeLessThan(text.indexOf('Two restrictions already. Six kilograms gone.'));
  });

  it('says on screen that it selects no binder, dose, diet, or target', () => {
    render(new RenalPhosphateTarget(), 0);
    expect(container.textContent).toContain('selects no binder, no dose, no diet, no target, and no education programme');
    expect(container.textContent).toContain('does not decide whether a binder should be started');
  });

  it('gives the calcification half of the trial only once it is reviewed', () => {
    const model = new RenalPhosphateTarget();
    expect(renderToStaticMarkup(<RenalPhosphateTargetTray assessment={model.snapshot(0)}
      scenarioVersion="0.1.0" onAction={() => {}} />)).not.toContain('calcification increased significantly');
    model.apply('review-trial', 1);
    render(model, 1);
    expect(container.textContent).toContain('calcification increased significantly against placebo');
    expect(container.textContent).toContain('Uncertainty in both directions');
  });

  it('shows the weight and albumin as findings rather than a diagnosis', () => {
    render(new RenalPhosphateTarget(), 0);
    expect(container.textContent).toContain('Weight 74 kg a year ago, 68 kg today');
    expect(container.textContent).toContain('not a diagnosis of malnutrition, and not proof the restrictions caused them');
  });

  it('shows the retrieved letters only once they arrive, and says what they do not establish', () => {
    const model = new RenalPhosphateTarget();
    model.apply('review-intake', 0);
    render(model, 0);
    expect(container.textContent).not.toContain('The previous clinic letters are open.');
    model.advance(RECORDS + 1);
    render(model, RECORDS + 1);
    expect(container.textContent).toContain('The previous clinic letters are open.');
    expect(container.textContent).toContain('They establish no cause for the weight and albumin change');
  });

  it('says the phosphate does not move because there is no treatment here', () => {
    const model = new RenalPhosphateTarget();
    model.apply('check-phosphate', 0);
    render(model, 0);
    expect(container.textContent).toContain('It has not changed, because nothing in this rehearsal is a treatment.');
  });

  it('reports a refused choice as a refusal with its reason', () => {
    const model = new RenalPhosphateTarget();
    model.apply('treat-the-number', 0);
    render(model, 0);
    expect(container.textContent).toContain('was refused');
    expect(container.textContent).toContain('it declines to make the number the reason');
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const onAction = render(new RenalPhosphateTarget(), 0, { demonstrating: true });
    expect(container.textContent).toContain('Watching the worked example');
    const control = button(labels['review-surrogate'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the source and its size', () => {
    render(new RenalPhosphateTarget(), 0);
    expect(container.querySelector<HTMLAnchorElement>(`a[href="${RENAL_PHOSPHATE_SOURCE_HREF}"]`))
      .toBeInstanceOf(HTMLAnchorElement);
    expect(container.textContent).toContain('One hundred and forty-eight patients over nine months');
    expect(container.textContent).toContain('the calcification findings secondary');
  });

  it('closes by handing over context rather than a target', () => {
    const model = new RenalPhosphateTarget();
    for (const action of ['review-surrogate', 'review-trial', 'review-intake', 'own-decision',
      'call-support', 'monitor'] as const) model.apply(action, 0);
    model.advance(RECORDS + 1); model.apply('reassess', RECORDS + 2); model.apply('handoff', RECORDS + 3);
    render(model, RECORDS + 3);
    expect(container.textContent).toContain('handed on with the context the number does not carry');
    expect(button(labels.reassess)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('waits for the patient before rendering any control', () => {
    act(() => root.render(<RenalPhosphateTargetTray scenarioVersion="0.1.0" onAction={() => {}} />));
    expect(container.textContent).toContain('Preparing the fictional patient');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
