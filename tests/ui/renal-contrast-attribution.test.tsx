/** @vitest-environment jsdom */
/**
 * The tray has to make the label look like what it is, and has to keep saying what it is not.
 *
 * The sentence a learner reads first decides whether this lesson lands: "someone wrote the
 * cause down, no result reported it" is the whole frame. And because a lesson that argues
 * against a contrast attribution could be misread as clinical permission, the disclaimer is
 * asserted as visible text rather than trusted to sit in a limitations register.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RenalContrastAttributionTray } from '../../src/modules/renal-electrolyte/RenalContrastAttributionTray';
import { RenalContrastAttribution, RENAL_CONTRAST_RECORD_TICKS as RECORD,
  type RenalContrastAction } from '../../src/modules/renal-electrolyte/contrast-attribution';
import { RENAL_CONTRAST_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-contrast-attribution-tutor';

const labels: Record<RenalContrastAction, string> = {
  'review-label': 'Read the written label as an attribution',
  'review-alternatives': 'Review what the label did not exclude',
  'withdraw-exposures': 'Withdraw the nephrotoxic exposures with the team',
  'review-evidence': 'Review what a rise after an exposure shows',
  'call-support': 'Call qualified renal and ward support',
  monitor: 'Arrange serial review with the source question open',
  'check-creatinine': 'Check creatinine only', 'check-perfusion': 'Check the observation record only',
  reassess: 'Reassess creatinine, perfusion, and exposures',
  handoff: 'Hand off an unresolved cause and an open search',
  'attribute-to-contrast': 'Record the injury as caused by contrast',
  'stop-looking': 'Accept the label and close the search',
};

describe('Renal contrast-attribution tray', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

  const render = (model: RenalContrastAttribution, tick: number, extra: {
    onAction?: (action: RenalContrastAction) => void; demonstrating?: boolean;
  } = {}) => {
    const onAction = extra.onAction ?? vi.fn();
    act(() => root.render(<RenalContrastAttributionTray assessment={model.snapshot(tick)} scenarioVersion="0.1.0"
      onAction={onAction} demonstrating={extra.demonstrating} />));
    return onAction;
  };
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((entry) => entry.textContent?.trim() === label);

  it('offers every declared choice and dispatches the one that was pressed', () => {
    const model = new RenalContrastAttribution();
    for (const [action, label] of Object.entries(labels) as [RenalContrastAction, string][]) {
      const onAction = render(model, 0);
      const control = button(label);
      expect(control, `${action} has no control`).toBeInstanceOf(HTMLButtonElement);
      act(() => control!.click());
      expect(onAction).toHaveBeenCalledWith(action);
    }
  });

  it('frames the label as an attribution before anything else', () => {
    render(new RenalContrastAttribution(), 0);
    expect(container.textContent).toContain('Someone wrote the cause down. No result reported it.');
    expect(container.textContent).toContain('No laboratory result, imaging report, biopsy, or nephrology opinion says it.');
  });

  it('says on screen that nothing here decides whether to give contrast', () => {
    render(new RenalContrastAttribution(), 0);
    expect(container.textContent).toContain('decides whether contrast should be given to anyone');
    expect(container.textContent).toContain('It is about a sentence in a set of notes.');
  });

  it('lists the alternatives only once they are reviewed, and calls none of them the cause', () => {
    const model = new RenalContrastAttribution();
    expect(renderToStaticMarkup(<RenalContrastAttributionTray assessment={model.snapshot(0)}
      scenarioVersion="0.1.0" onAction={() => {}} />)).not.toContain('141 mg/L');
    model.apply('review-alternatives', 1);
    render(model, 1);
    expect(container.textContent).toContain('141 mg/L');
    expect(container.textContent).toContain('None of these is thereby the cause.');
  });

  it('shows the ward summary until the full chart is open, then shows what it was hiding', () => {
    const model = new RenalContrastAttribution();
    model.apply('check-perfusion', 0);
    render(model, 0);
    expect(container.textContent).toContain('2 episodes below a systolic 90 mmHg, lowest 88 mmHg');
    expect(container.textContent).toContain('the full chart has not been opened yet');

    model.apply('review-alternatives', 1); model.advance(RECORD + 2); model.apply('reassess', RECORD + 3);
    render(model, RECORD + 3);
    expect(container.textContent).toContain('four episodes below a systolic 90 mmHg and a lowest pressure of 78');
    expect(container.textContent).toContain('They were available from the start.');
  });

  it('says the rising creatinine confirms nothing', () => {
    render(new RenalContrastAttribution(), 0);
    expect(container.textContent).toContain('it confirms no cause, and a fall would confirm none either');
  });

  it('reports a refused choice as a refusal with its reason', () => {
    const model = new RenalContrastAttribution();
    model.apply('attribute-to-contrast', 0);
    render(model, 0);
    expect(container.textContent).toContain('Recording the injury as caused by contrast was refused');
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
  });

  it('leaves the controls visible but inert while the example runs', () => {
    const onAction = render(new RenalContrastAttribution(), 0, { demonstrating: true });
    expect(container.textContent).toContain('Watching the worked example');
    const control = button(labels['review-label'])!;
    expect(control.getAttribute('aria-disabled')).toBe('true');
    act(() => control.click());
    expect(onAction).not.toHaveBeenCalled();
  });

  it('names the source and says a consensus statement is a position', () => {
    render(new RenalContrastAttribution(), 0);
    const link = container.querySelector<HTMLAnchorElement>(`a[href="${RENAL_CONTRAST_SOURCE_HREF}"]`)!;
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(container.textContent).toContain('A consensus statement is a position rather than a settled fact');
    expect(container.textContent).toContain('does not claim contrast never injures a kidney');
  });

  it('closes by handing over an open search rather than a diagnosis', () => {
    const model = new RenalContrastAttribution();
    for (const action of ['review-label', 'review-alternatives', 'withdraw-exposures',
      'review-evidence', 'call-support', 'monitor'] as const) model.apply(action, 0);
    model.advance(RECORD + 1); model.apply('reassess', RECORD + 2); model.apply('handoff', RECORD + 3);
    render(model, RECORD + 3);
    expect(container.textContent).toContain('handed over as unresolved');
    expect(container.textContent).toContain('This is not a diagnosis and not discharge readiness.');
    expect(button(labels.reassess)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('waits for the patient before rendering any control', () => {
    act(() => root.render(<RenalContrastAttributionTray scenarioVersion="0.1.0" onAction={() => {}} />));
    expect(container.textContent).toContain('Preparing the fictional patient');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
