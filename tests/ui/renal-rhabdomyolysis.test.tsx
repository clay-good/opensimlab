/** @vitest-environment jsdom */
/**
 * The tray has to point at the bedside before it points at the number.
 *
 * Layout is teaching here: the first heading a learner reads decides whether they examine the
 * limbs or argue about 48,000. The disclaimers are asserted as visible text rather than trusted
 * to the limitations register, because a lab that argues against dialysis and against two
 * familiar drugs is exactly the shape that could be read as a rule.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenalRhabdomyolysisTray } from '../../src/modules/renal-electrolyte/RenalRhabdomyolysisTray';
import { RenalRhabdomyolysis, RENAL_RHABDOMYOLYSIS_SERIAL_TICKS as SERIAL,
  type RenalRhabdomyolysisAction } from '../../src/modules/renal-electrolyte/rhabdomyolysis';
import { RENAL_RHABDOMYOLYSIS_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-rhabdomyolysis-tutor';

const labels: Record<RenalRhabdomyolysisAction, string> = {
  'examine-compartments': 'Examine the limbs for compartment syndrome',
  'review-cause': 'Establish the cause',
  'arrange-fluids': 'Arrange qualified fluid ownership',
  'review-number': 'Review what the creatine kinase decides',
  'review-additions': 'Review bicarbonate and mannitol',
  'call-support': 'Call qualified acute-care and renal support',
  monitor: 'Arrange serial review and repeat examination',
  'check-creatine-kinase': 'Check creatine kinase only', 'check-renal': 'Check kidney findings only',
  reassess: 'Reassess creatine kinase, kidney, and examination',
  handoff: 'Hand off fluid ownership and repeat examination',
  'dialyse-on-number': 'Request replacement therapy on the creatine kinase',
  'add-bicarbonate-and-mannitol': 'Add bicarbonate and mannitol',
};

describe('Renal rhabdomyolysis tray', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  const render = (model: RenalRhabdomyolysis, tick: number, extra: {
    onAction?: (action: RenalRhabdomyolysisAction) => void; demonstrating?: boolean;
  } = {}) => {
    const onAction = extra.onAction ?? vi.fn();
    act(() => root.render(<RenalRhabdomyolysisTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
      onAction={onAction} demonstrating={extra.demonstrating} />));
    return onAction;
  };
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label);

  it('offers every declared choice and dispatches the one that was pressed', () => {
    const model = new RenalRhabdomyolysis();
    for (const [action, label] of Object.entries(labels) as [RenalRhabdomyolysisAction, string][]) {
      const onAction = render(model, 0);
      const control = button(label);
      expect(control, `${action} has no control`).toBeInstanceOf(HTMLButtonElement);
      act(() => control!.click());
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('leads with the bedside, not the number', () => {
    render(new RenalRhabdomyolysis(), 0);
    const text = container.textContent ?? '';
    expect(text).toContain('The urgent finding is not in the blood.');
    expect(text).toContain('48,000 is alarming. It is not a decision.');
    expect(text.indexOf('The urgent finding is not in the blood.'))
      .toBeLessThan(text.indexOf('48,000 is alarming. It is not a decision.'));
  });

  it('says a compartment examination is a finding that must be repeated', () => {
    const model = new RenalRhabdomyolysis();
    model.apply('examine-compartments', 0);
    render(model, 0);
    expect(container.textContent).toContain('which has to be repeated, because it is a finding and not a result');
    expect(container.textContent).toContain('no procedure is performed here');
  });

  it('gives the cohort distribution only once the cause is established, and calls it a distribution', () => {
    const model = new RenalRhabdomyolysis();
    expect(renderToStaticMarkup(<RenalRhabdomyolysisTray assessment={model.snapshot(0)}
      scenarioVersion="0.1.0" onAction={() => {}} />)).not.toContain('58.5%');
    model.apply('review-cause', 1);
    render(model, 1);
    expect(container.textContent).toContain('58.5% after cardiac arrest');
    expect(container.textContent).toContain('not a prognosis for him');
  });

  it('says the additions review is not proof and not a reason to withhold fluid', () => {
    const model = new RenalRhabdomyolysis();
    model.apply('review-additions', 0);
    render(model, 0);
    expect(container.textContent).toContain('an absence of demonstrated benefit rather than a demonstrated absence');
    expect(container.textContent).toContain('not a reason to withhold fluid');
  });

  it('shows no result that has not been requested', () => {
    const model = new RenalRhabdomyolysis();
    model.apply('examine-compartments', 0); model.apply('arrange-fluids', 1);
    const markup = renderToStaticMarkup(<RenalRhabdomyolysisTray assessment={model.snapshot(SERIAL + 5)}
      scenarioVersion="0.1.0" onAction={() => {}} />);
    expect(markup).toContain('No new creatine-kinase-only measurement has been requested.');
    expect(markup).toContain('No new kidney-only measurement has been requested.');
    expect(markup).not.toContain('61,000');
  });

  it('puts the divergence on screen once the serial results are requested', () => {
    const model = new RenalRhabdomyolysis();
    model.apply('examine-compartments', 0); model.apply('arrange-fluids', 1);
    model.advance(SERIAL + 2); model.apply('reassess', SERIAL + 3);
    render(model, SERIAL + 3);
    expect(container.textContent).toContain('creatine kinase 61,000 U/L');
    expect(container.textContent).toContain('creatinine 88 µmol/L');
    expect(container.textContent).toContain('establishes no peak, no trajectory, and no disposition');
  });

  it('reports a refused choice as a refusal with its reason', () => {
    const model = new RenalRhabdomyolysis();
    model.apply('dialyse-on-number', 0);
    render(model, 0);
    expect(container.textContent).toContain('Requesting replacement therapy on the strength of the creatine kinase value was refused');
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const onAction = render(new RenalRhabdomyolysis(), 0, { demonstrating: true });
    expect(container.textContent).toContain('Watching the worked example');
    const control = button(labels['examine-compartments'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the source and says what kind of study it is', () => {
    render(new RenalRhabdomyolysis(), 0);
    expect(container.querySelector<HTMLAnchorElement>(`a[href="${RENAL_RHABDOMYOLYSIS_SOURCE_HREF}"]`))
      .toBeInstanceOf(HTMLAnchorElement);
    expect(container.textContent).toContain('Retrospective, two hospitals in one city');
    expect(container.textContent).toContain('not a prediction for any individual');
  });

  it('closes without a peak, a prognosis, or a discharge criterion', () => {
    const model = new RenalRhabdomyolysis();
    for (const action of ['examine-compartments', 'review-cause', 'arrange-fluids', 'review-number',
      'review-additions', 'call-support', 'monitor'] as const) model.apply(action, 0);
    model.advance(SERIAL + 1); model.apply('reassess', SERIAL + 2); model.apply('handoff', SERIAL + 3);
    render(model, SERIAL + 3);
    expect(container.textContent).toContain('No peak and no prognosis is named');
    expect(button(labels.reassess)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('waits for the patient before rendering any control', () => {
    act(() => root.render(<RenalRhabdomyolysisTray scenarioVersion="0.1.0" onAction={() => {}} />));
    expect(container.textContent).toContain('Preparing the fictional patient');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
