/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RenalHypocalcemiaSnapshot } from '@platform/kernel/protocol';
import { RenalHypocalcemiaTray } from '../../src/modules/renal-electrolyte/RenalHypocalcemiaTray';
import { RenalHypocalcemia, RENAL_HYPOCALCEMIA_RESCUE_TICKS as INITIAL,
  RENAL_HYPOCALCEMIA_CONTINUING_TICKS as CONTINUING, RENAL_HYPOCALCEMIA_DELAY_TICKS as DELAY, RENAL_HYPOCALCEMIA_TAKEOVER_TICKS as TAKEOVER,
  type RenalHypocalcemiaAction } from '../../src/modules/renal-electrolyte/hypocalcemia';
import { RENAL_HYPOCALCEMIA_IONIZED_CALCIUM_AND_CKD as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypocalcemia-ionized-calcium-and-ckd';
import { renalHypocalcemiaInlinePrompt, RENAL_HYPOCALCEMIA_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hypocalcemia-tutor';
import { renalHypocalcemiaDemonstrationStep, supportsRenalHypocalcemiaDemonstration,
  RENAL_HYPOCALCEMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hypocalcemia-demonstration';
import { useRenalHypocalcemiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHypocalcemiaDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

const labels: Record<RenalHypocalcemiaAction, string> = {
  'rescue-calcium': 'Request qualified calcium rescue', 'continue-calcium': 'Deliver qualified continuing calcium care',
  'call-support': 'Call qualified acute-care and specialist support', 'review-context': 'Review measured calcium, CKD, and medication context',
  monitor: 'Arrange ionized-calcium and clinical surveillance', 'coordinate-mineral-care': 'Coordinate qualified CKD mineral care',
  'arrange-follow-up': 'Arrange longer-term calcium and specialist follow-up', 'check-ionized': 'Check ionized calcium only',
  'check-symptoms': 'Check symptoms only', reassess: 'Reassess ionized calcium, symptoms, and bedside response',
  handoff: 'Hand off continuing calcium care and follow-up', 'trust-adjusted-total': 'Trust adjusted total calcium alone',
  'oral-only': 'Use oral calcium alone instead of rescue', 'stop-after-relief': 'Stop calcium care after symptom relief',
};
const initialCare = ['rescue-calcium', 'continue-calcium', 'call-support', 'review-context', 'monitor', 'coordinate-mineral-care', 'arrange-follow-up'] as const;
const tutor = (model: RenalHypocalcemia, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  renalHypocalcemiaInlinePrompt(level, { scenarioVersion: '0.1.0', renalHypocalcemia: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RenalHypocalcemiaSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRenalHypocalcemiaDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Renal hypocalcemia symptoms, sodium, and separate observations', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new RenalHypocalcemia(); let tick = 0;
    const dispatch = vi.fn((action: RenalHypocalcemiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RenalHypocalcemiaTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RenalHypocalcemiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RenalHypocalcemiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }




  it('offers a ten-decision example with immediate continuing care and longer-term follow-up', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="renal-electrolyte"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('ten-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('continuing calcium care is available immediately afterward');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('offers rescue and immediate continuing care with stable accepted-control focus and no duplicate request', () => {
    expect(renderToStaticMarkup(<RenalHypocalcemiaTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(14);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(tutor(view.model, 0)?.id).toBe('renal-hypocalcemia-rescue');
    const button = view.button('rescue-calcium'); button.focus(); view.click('rescue-calcium');
    expect(view.snapshot()).toMatchObject({ rescueAtTick: 0, supportActive: false, contextReviewedAtTick: null, observation: null });
    expect(view.button('rescue-calcium')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('rescue-calcium'); expect(view.dispatch).toHaveBeenCalledOnce();
    expect(tutor(view.model, 0)?.id).toBe('renal-hypocalcemia-continuing'); view.click('continue-calcium');
    expect(view.snapshot()).toMatchObject({ continuingAtTick: 0, mineralCareAtTick: null, followUpAtTick: null, rescueResponseObserved: false });
    expect(RENAL_HYPOCALCEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRenalHypocalcemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHypocalcemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(renalHypocalcemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', renalHypocalcemia: initial })).toBeNull();
  });

  it.each(['coordinate-mineral-care', 'arrange-follow-up', 'review-context'] as const)('offers %s before rescue without a biochemical response', (first) => {
    const view = patientView(); const vitals = view.model.vitals(); view.click(first);
    expect(view.snapshot()).toMatchObject({ rescueAtTick: null, supportActive: false, observation: null });
    expect(view.model.vitals()).toEqual(vitals); expect(tutor(view.model, 0)?.id).toBe('renal-hypocalcemia-rescue');
    if (first === 'review-context') {
      expect(container.textContent).toContain('Supplied QTc 520 ms is historical and is not measured by this waveform');
      expect(container.textContent).toContain('magnesium 0.80 mmol/L');
    }
  });

  it('allows continuing calcium immediately after rescue without administrative or laboratory gates', () => {
    const view = patientView(); view.click('continue-calcium'); expect(view.snapshot().continuingAtTick).toBeNull();
    view.click('rescue-calcium'); view.click('continue-calcium');
    expect(view.snapshot()).toMatchObject({ rescueAtTick: 0, continuingAtTick: 0,
      mineralCareAtTick: null, followUpAtTick: null, supportActive: false, contextReviewedAtTick: null, observation: null });
    view.jump(CONTINUING); expect(container.textContent).not.toContain('ionized calcium 1.03 mmol/L');
    view.click('reassess');
    expect(view.snapshot()).toMatchObject({ rescueResponseObserved: false, continuingResponseObserved: true,
      observation: { ionizedCalciumMmolL: 1.03, carpopedalSpasm: false, perioralTingling: true } });
  });

  it('keeps the full assessment historical after separate ionized and symptom observations', () => {
    const view = patientView(); view.click('reassess'); view.click('rescue-calcium'); const first = view.snapshot().observation;
    view.jump(INITIAL); view.click('check-symptoms');
    expect(view.snapshot()).toMatchObject({ observation: first, rescueResponseObserved: false,
      symptomObservation: { atTick: INITIAL, carpopedalSpasm: false, perioralTingling: true } });
    view.jump(INITIAL + 10); view.click('check-ionized');
    expect(view.snapshot()).toMatchObject({ observation: first, rescueResponseObserved: false,
      ionizedObservation: { atTick: INITIAL + 10, ionizedCalciumMmolL: 0.96 } });
    expect(container.textContent).toContain('00:15:01: 0.96 mmol/L');
    expect(container.textContent).toContain('00:15:00: carpopedal spasm absent; perioral tingling present');
    expect(container.textContent).toContain('00:00:00: ionized calcium 0.86 mmol/L');
  });

  it('reassesses recurrence before handoff and permits a continuing-care response to remain pending', () => {
    const view = patientView(); for (const action of initialCare.filter((action) => action !== 'continue-calcium')) view.click(action);
    view.jump(INITIAL); view.click('reassess'); const previous = view.snapshot().observation;
    view.jump(INITIAL * 3); view.click('check-ionized'); view.click('continue-calcium'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ observation: previous, recurrenceObserved: false, ended: null,
      ionizedObservation: { ionizedCalciumMmolL: 0.88 } });
    expect(renalHypocalcemiaDemonstrationStep(view.snapshot()).action).toBeUndefined();
    view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', recurrenceObserved: true, continuingResponseObserved: false,
      observation: { ionizedCalciumMmolL: 0.88, carpopedalSpasm: true, perioralTingling: true } });
    expect(container.textContent).toContain('not durable correction or discharge readiness');
  });

  it('does not loop through a missed early panel after late continuation or a completed later response', () => {
    const view = patientView(); for (const action of initialCare.filter((action) => action !== 'continue-calcium')) view.click(action);
    view.jump(INITIAL * 3); view.click('continue-calcium');
    expect(view.snapshot()).toMatchObject({ rescueResponseObserved: false, recurrenceObserved: false, observation: null });
    expect(renalHypocalcemiaDemonstrationStep(view.snapshot()).id).toBe('continuing-observation');
    view.jump(INITIAL * 3 + CONTINUING);
    expect(renalHypocalcemiaDemonstrationStep(view.snapshot()).id).toBe('continuing-reassessment');
    view.click('reassess'); expect(renalHypocalcemiaDemonstrationStep(view.snapshot()).action).toBe('handoff');
    expect(view.snapshot().rescueResponseObserved).toBe(false);
  });

  it('retains refused shortcuts through later care without requiring an error-free history', () => {
    const view = patientView(); for (const action of ['trust-adjusted-total', 'oral-only', 'stop-after-relief'] as const) view.click(action);
    view.jump(DELAY); for (const action of initialCare) view.click(action);
    view.jump(DELAY + CONTINUING); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', adjustedReassuranceAttempted: true,
      oralOnlyAttempted: true, stoppedAfterReliefAttempted: true, observation: { ionizedCalciumMmolL: 1.03, perioralTingling: true } });
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RenalHypocalcemiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, unassisted silent, and the safety-source link active in a guarded example', () => {
    const model = new RenalHypocalcemia(); for (const action of initialCare) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RenalHypocalcemiaTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) act(() => button.click());
    const link = container.querySelector('a')!; expect(link.href).toBe(RENAL_HYPOCALCEMIA_SOURCE_HREF);
    expect(link.textContent).toBe('FDA 2024 safety communication'); expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
    link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    expect(source).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces ten decisions and two complete observations with stopped reading time', () => {
    const model = new RenalHypocalcemia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('renal-hypocalcemia-response'); model.apply(action.payload.action, clock.tick); });
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
    render(); for (let index = 0; index < 7; index++) proceed();
    expect(advance).toBeUndefined(); clock.pause(); render(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(INITIAL - 1); expect(advance).toBeUndefined(); jump(INITIAL); proceed();
    const old = model.snapshot(INITIAL).observation; expect(advance).toBeUndefined();
    jump(CONTINUING - 1); expect(advance).toBeUndefined(); jump(CONTINUING);
    expect(model.snapshot(CONTINUING).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...initialCare, 'reassess', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(10);
    expect(model.snapshot(CONTINUING)).toMatchObject({ ended: 'handoff', rescueResponseObserved: true,
      continuingResponseObserved: true, durableRecoveryProven: false, observation: { carpopedalSpasm: false, perioralTingling: true } });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new RenalHypocalcemia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RenalHypocalcemiaSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new RenalHypocalcemia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, ionizedObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });
});
