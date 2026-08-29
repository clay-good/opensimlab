/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RenalHypernatremiaSnapshot } from '@platform/kernel/protocol';
import { RenalHypernatremiaTray } from '../../src/modules/renal-electrolyte/RenalHypernatremiaTray';
import { RenalHypernatremia, RENAL_HYPERNATREMIA_VOLUME_TICKS as INITIAL,
  RENAL_HYPERNATREMIA_COMBINED_TICKS as COMBINED, RENAL_HYPERNATREMIA_DELAY_TICKS as DELAY, RENAL_HYPERNATREMIA_TAKEOVER_TICKS as TAKEOVER,
  type RenalHypernatremiaAction } from '../../src/modules/renal-electrolyte/hypernatremia';
import { RENAL_HYPERNATREMIA_WATER_ACCESS_AND_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypernatremia-water-access-and-losses';
import { renalHypernatremiaInlinePrompt, RENAL_HYPERNATREMIA_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hypernatremia-tutor';
import { renalHypernatremiaDemonstrationStep, supportsRenalHypernatremiaDemonstration,
  RENAL_HYPERNATREMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hypernatremia-demonstration';
import { useRenalHypernatremiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHypernatremiaDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

const labels: Record<RenalHypernatremiaAction, string> = {
  'restore-volume': 'Request qualified circulation restoration', 'replace-water': 'Request qualified water replacement',
  'manage-losses': 'Deliver qualified ongoing-loss care', 'assist-water-access': 'Deliver safe water access and assistance',
  'call-support': 'Call qualified acute-care and specialist support', 'review-context': 'Review water access, losses, and supplied context',
  monitor: 'Arrange sodium and fluid-balance surveillance', 'check-sodium': 'Check sodium only',
  'check-fluid-balance': 'Check fluid balance only', reassess: 'Reassess sodium, fluid balance, and bedside response',
  handoff: 'Hand off continuing water and loss care', 'empiric-desmopressin': 'Give empiric desmopressin', 'normalize-now': 'Normalize sodium now',
};
const initialCare = ['restore-volume', 'call-support', 'review-context', 'monitor'] as const;
const tutor = (model: RenalHypernatremia, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  renalHypernatremiaInlinePrompt(level, { scenarioVersion: '0.1.0', renalHypernatremia: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RenalHypernatremiaSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRenalHypernatremiaDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Renal hypernatremia symptoms, sodium, and separate observations', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new RenalHypernatremia(); let tick = 0;
    const dispatch = vi.fn((action: RenalHypernatremiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RenalHypernatremiaTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RenalHypernatremiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RenalHypernatremiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }




  it('offers a ten-decision example with distinct circulation, water, loss, and access needs', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="renal-electrolyte"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('ten-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('without a new testing gate');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('offers immediate circulation rescue with stable accepted-control focus and no duplicate request', () => {
    expect(renderToStaticMarkup(<RenalHypernatremiaTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(13);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(tutor(view.model, 0)?.id).toBe('renal-hypernatremia-volume');
    const button = view.button('restore-volume'); button.focus(); view.click('restore-volume');
    expect(view.snapshot()).toMatchObject({ volumeAtTick: 0, supportActive: false, contextReviewedAtTick: null, observation: null });
    expect(view.button('restore-volume')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('restore-volume'); expect(view.dispatch).toHaveBeenCalledOnce();
    expect(RENAL_HYPERNATREMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRenalHypernatremiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHypernatremiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(renalHypernatremiaInlinePrompt('guided', { scenarioVersion: '0.1.1', renalHypernatremia: initial })).toBeNull();
  });

  it.each(['assist-water-access', 'review-context', 'monitor'] as const)('offers %s before circulation rescue without a biochemical response', (first) => {
    const view = patientView(); const vitals = view.model.vitals(); view.click(first);
    expect(view.snapshot()).toMatchObject({ volumeAtTick: null, supportActive: false, observation: null });
    expect(view.model.vitals()).toEqual(vitals); expect(tutor(view.model, 0)?.id).toBe('renal-hypernatremia-volume');
    if (first === 'review-context') expect(container.textContent).toContain('Concentrated urine does not establish AVP deficiency or exclude every other cause');
  });

  it('allows water and delivered losses after circulation without new laboratory, support, or access gates', () => {
    const view = patientView(); view.click('replace-water'); view.click('manage-losses');
    expect(view.snapshot()).toMatchObject({ waterAtTick: null, lossManagementAtTick: null });
    view.click('restore-volume'); view.jump(INITIAL); view.click('manage-losses'); view.click('replace-water');
    expect(view.snapshot()).toMatchObject({ waterAtTick: INITIAL, lossManagementAtTick: INITIAL,
      waterAccessAtTick: null, supportActive: false, contextReviewedAtTick: null, observation: null });
    view.jump(INITIAL + COMBINED); expect(container.textContent).not.toContain('sodium 162 mmol/L');
    view.click('reassess');
    expect(view.snapshot()).toMatchObject({ waterResponseObserved: false, combinedResponseObserved: true,
      observation: { sodiumMmolL: 162, urineOutputMlPerHour: 35, ongoingDiarrhea: true } });
  });

  it('keeps a full assessment historical after separate sodium and fluid-balance observations', () => {
    const view = patientView(); view.click('reassess'); view.click('restore-volume'); const first = view.snapshot().observation;
    view.jump(INITIAL); view.click('check-fluid-balance');
    expect(view.snapshot()).toMatchObject({ observation: first, volumeObserved: false,
      fluidBalanceObservation: { atTick: INITIAL, urineOutputMlPerHour: 35, ongoingDiarrhea: true } });
    view.click('replace-water'); view.jump(INITIAL + COMBINED / 2); view.click('check-sodium');
    expect(view.snapshot()).toMatchObject({ observation: first, waterResponseObserved: false,
      sodiumObservation: { atTick: INITIAL + COMBINED / 2, sodiumMmolL: 163 } });
    expect(container.textContent).toContain('02:15:00: 163 mmol/L (-1 from the original 164)');
    expect(container.textContent).toContain('00:15:00: urine output 35 mL/hour');
    expect(container.textContent).toContain('00:00:00: sodium 164 mmol/L');
  });

  it('reassesses recurrence before handoff and can transfer ownership with combined recovery pending', () => {
    const view = patientView(); for (const action of initialCare) view.click(action);
    view.jump(INITIAL); view.click('replace-water'); view.click('assist-water-access');
    view.jump(INITIAL + COMBINED / 2); view.click('reassess'); const previous = view.snapshot().observation;
    view.jump(INITIAL + COMBINED); view.click('check-sodium'); view.click('manage-losses'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ observation: previous, recurrenceObserved: false, ended: null,
      sodiumObservation: { sodiumMmolL: 164 } });
    expect(renalHypernatremiaDemonstrationStep(view.snapshot()).action).toBeUndefined();
    view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', recurrenceObserved: true, combinedResponseObserved: false,
      observation: { sodiumMmolL: 164, ongoingDiarrhea: true } });
    expect(container.textContent).toContain('not normalization or discharge readiness');
  });

  it('retains refused shortcuts through later appropriate care without an error-free-history gate', () => {
    const view = patientView(); view.click('normalize-now'); view.click('empiric-desmopressin');
    view.jump(DELAY); for (const action of initialCare) view.click(action);
    view.jump(DELAY + INITIAL); view.click('replace-water'); view.click('manage-losses'); view.click('assist-water-access');
    view.jump(DELAY + INITIAL + COMBINED); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', empiricDesmopressinAttempted: true,
      normalizationAttempted: true, observation: { sodiumMmolL: 162, ongoingDiarrhea: true } });
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RenalHypernatremiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, unassisted silent, and the review link active during a guarded example', () => {
    const model = new RenalHypernatremia(); for (const action of initialCare) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RenalHypernatremiaTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) act(() => button.click());
    const link = container.querySelector('a')!; expect(link.href).toBe(RENAL_HYPERNATREMIA_SOURCE_HREF);
    expect(link.textContent).toBe('Yun et al. 2023 review'); expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
    link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    expect(source).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces ten decisions and two complete observations with stopped reading time', () => {
    const model = new RenalHypernatremia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('renal-hypernatremia-response'); model.apply(action.payload.action, clock.tick); });
    const render = (patient = model.snapshot(clock.tick)) => act(() => root.render(<StrictMode><DemoHarness active
      running={clock.state === 'running'} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    const proceed = () => {
      const count = dispatch.mock.calls.length; const before = model.snapshot(clock.tick); const callback = advance!;
      expect(callback).toBeTypeOf('function'); expect(clock.state).toBe('paused');
      expect(clock.ticksFor(60_000)).toBe(0); render(); expect(dispatch.mock.calls.length).toBe(count);
      act(() => { callback(); callback(); }); expect(dispatch.mock.calls.length).toBe(count + 1);
      render(before); act(() => callback()); expect(dispatch.mock.calls.length).toBe(count + 1); render();
    };
    const jump = (tick: number) => { clock.restore(tick); clock.play(); model.advance(tick); render(); };
    render(); for (let index = 0; index < 4; index++) proceed();
    expect(advance).toBeUndefined(); clock.pause(); render(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(INITIAL - 1); expect(advance).toBeUndefined(); jump(INITIAL); proceed(); proceed(); proceed(); proceed();
    const old = model.snapshot(INITIAL).observation; expect(advance).toBeUndefined();
    jump(INITIAL + COMBINED - 1); expect(advance).toBeUndefined(); jump(INITIAL + COMBINED);
    expect(model.snapshot(INITIAL + COMBINED).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...initialCare, 'reassess', 'replace-water', 'manage-losses', 'assist-water-access', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(10);
    expect(model.snapshot(INITIAL + COMBINED)).toMatchObject({ ended: 'handoff', volumeObserved: true, waterResponseObserved: false,
      combinedResponseObserved: true, durableRecoveryProven: false, observation: { ongoingDiarrhea: true, sodiumMmolL: 162 } });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new RenalHypernatremia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RenalHypernatremiaSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new RenalHypernatremia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, sodiumObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });
});
