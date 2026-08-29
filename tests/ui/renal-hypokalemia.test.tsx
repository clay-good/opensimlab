/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RenalHypokalemiaSnapshot } from '@platform/kernel/protocol';
import { RenalHypokalemiaTray } from '../../src/modules/renal-electrolyte/RenalHypokalemiaTray';
import { RenalHypokalemia, RENAL_HYPOKALEMIA_POTASSIUM_TICKS as EARLY,
  RENAL_HYPOKALEMIA_RESPONSE_TICKS as RESPONSE, RENAL_HYPOKALEMIA_RECURRENCE_TICKS as RECURRENCE, RENAL_HYPOKALEMIA_TAKEOVER_TICKS as TAKEOVER,
  type RenalHypokalemiaAction } from '../../src/modules/renal-electrolyte/hypokalemia';
import { RENAL_HYPOKALEMIA_MAGNESIUM_AND_ONGOING_LOSSES as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypokalemia-magnesium-and-ongoing-losses';
import { renalHypokalemiaInlinePrompt, RENAL_HYPOKALEMIA_SOURCE_HREF, RENAL_HYPOKALEMIA_MAGNESIUM_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hypokalemia-tutor';
import { renalHypokalemiaDemonstrationStep, supportsRenalHypokalemiaDemonstration,
  RENAL_HYPOKALEMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hypokalemia-demonstration';
import { useRenalHypokalemiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHypokalemiaDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

const labels: Record<RenalHypokalemiaAction, string> = {
  potassium: 'Request qualified potassium replacement', magnesium: 'Request qualified magnesium replacement',
  'call-support': 'Call qualified acute-care support', 'review-context': 'Review electrolyte, medication, and loss context',
  'manage-losses': 'Deliver individualized ongoing-loss care', monitor: 'Arrange electrolyte and ECG surveillance',
  'check-potassium': 'Check potassium only', 'check-ecg': 'Check ECG only',
  reassess: 'Reassess potassium, magnesium, ECG, and bedside response', handoff: 'Hand off replacement and continuing surveillance',
  'rapid-potassium': 'Give rapid unmonitored potassium', 'stop-monitoring': 'Stop electrolyte and ECG monitoring',
};
const care = ['potassium', 'magnesium', 'call-support', 'review-context', 'manage-losses', 'monitor'] as const;
const tutor = (model: RenalHypokalemia, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  renalHypokalemiaInlinePrompt(level, { scenarioVersion: '0.1.0', renalHypokalemia: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RenalHypokalemiaSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRenalHypokalemiaDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Renal hypokalemia replacement, magnesium, ongoing losses, and separate observations', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new RenalHypokalemia(); let tick = 0;
    const dispatch = vi.fn((action: RenalHypokalemiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RenalHypokalemiaTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RenalHypokalemiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RenalHypokalemiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }



  it('offers a nine-decision example without a generic induction script or a fixed prescription', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="renal-electrolyte"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('nine-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('no dose, route, concentration, or infusion rate');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('keeps urgent care independent and accepted-control focus stable without duplicate actions', () => {
    expect(renderToStaticMarkup(<RenalHypokalemiaTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(12);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(tutor(view.model, 0)?.id).toBe('renal-hypokalemia-potassium');
    const button = view.button('potassium'); button.focus(); view.click('potassium');
    expect(view.snapshot()).toMatchObject({ potassiumAtTick: 0, magnesiumAtTick: null, supportActive: false, observation: null });
    expect(view.button('potassium')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('potassium'); expect(view.dispatch).toHaveBeenCalledOnce();
    expect(RENAL_HYPOKALEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRenalHypokalemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHypokalemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(renalHypokalemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', renalHypokalemia: initial })).toBeNull();
  });

  it.each(['magnesium', 'manage-losses', 'monitor'] as const)('offers %s without a potassium or administrative prerequisite', (first) => {
    const view = patientView(); view.click(first);
    expect(view.snapshot()).toMatchObject({ potassiumAtTick: null, supportActive: false, contextReviewedAtTick: null, observation: null });
    expect(tutor(view.model, 0)?.id).toBe('renal-hypokalemia-potassium');
  });

  it('keeps magnesium historical after newer potassium and ECG checks', () => {
    const view = patientView(); view.click('reassess'); view.click('potassium'); view.click('magnesium');
    const first = view.snapshot().observation; view.jump(EARLY);
    expect(container.textContent).not.toContain('magnesium 0.58 mmol/L');
    view.click('check-potassium'); view.click('check-ecg');
    expect(view.snapshot()).toMatchObject({ observation: first, potassiumObservation: { atTick: EARLY, potassiumMmolL: 2.7 },
      potassiumResponseObserved: false, magnesiumResponseObserved: false });
    expect(container.textContent).toContain('Last requested potassium at simulated 00:30:00: 2.7 mmol/L');
    expect(container.textContent).toContain('00:00:00: potassium 2.3 mmol/L; magnesium 0.40 mmol/L');
    expect(container.textContent).not.toContain('magnesium 0.58 mmol/L'); view.click('reassess');
    expect(view.snapshot()).toMatchObject({ potassiumResponseObserved: true, magnesiumResponseObserved: true,
      observation: { potassiumMmolL: 2.7, magnesiumMmolL: 0.58 } });
  });

  it('requires fresh full combined findings without requiring an earlier full assessment or magnesium-first order', () => {
    const view = patientView(); for (const action of care) view.click(action);
    view.jump(RESPONSE); view.click('check-potassium'); view.click('check-ecg'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ potassiumObservation: { potassiumMmolL: 3.1 }, observation: null, responseObserved: false, ended: null });
    expect(renalHypokalemiaDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('reassess'); expect(view.snapshot()).toMatchObject({ responseObserved: true, observation: { magnesiumMmolL: 0.62 } });
    expect(tutor(view.model, RESPONSE)?.id).toBe('renal-hypokalemia-handoff');
    view.click('handoff'); expect(view.snapshot().ended).toBe('handoff');
    expect(container.textContent).toContain('not discharge readiness or durable safety');
  });

  it('retains earlier improvement and recurrent depletion but requires a new full recovery assessment', () => {
    const view = patientView(); view.click('potassium'); view.click('magnesium'); view.click('rapid-potassium'); view.click('stop-monitoring');
    view.jump(RESPONSE); view.click('reassess'); expect(view.snapshot().responseObserved).toBe(true);
    view.jump(RECURRENCE); view.click('check-potassium');
    expect(view.snapshot().observation).toMatchObject({ potassiumMmolL: 3.1, magnesiumMmolL: 0.62 });
    expect(container.textContent).not.toContain('magnesium 0.46 mmol/L'); view.click('reassess');
    for (const action of care) view.click(action);
    expect(view.snapshot()).toMatchObject({ recurrenceObserved: true, responseObserved: true });
    expect(renalHypokalemiaDemonstrationStep(view.snapshot()).action).toBeUndefined();
    view.jump(RECURRENCE + RESPONSE); view.click('check-potassium');
    expect(renalHypokalemiaDemonstrationStep(view.snapshot())).toMatchObject({ id: 'response-reassessment', action: 'reassess' });
    expect(tutor(view.model, RECURRENCE + RESPONSE)?.id).toBe('renal-hypokalemia-reassess-response');
    view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', recurrenceObserved: true, rapidPotassiumAttempted: true,
      monitoringStopAttempted: true, observation: { potassiumMmolL: 3.1, magnesiumMmolL: 0.62 } });
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RenalHypokalemiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('does not postpone the first combined assessment when loss care started before recurrence', () => {
    const model = new RenalHypokalemia(); model.apply('potassium', 0); model.apply('magnesium', 0);
    for (const action of care) model.apply(action, EARLY + 1);
    model.apply('reassess', RESPONSE);
    expect(renalHypokalemiaDemonstrationStep(model.snapshot(RESPONSE))).toMatchObject({ id: 'handoff', action: 'handoff' });
    expect(tutor(model, RESPONSE)?.id).toBe('renal-hypokalemia-handoff');
  });

  it('keeps coached waits quiet, unassisted silent, and source links active during a guarded example', () => {
    const model = new RenalHypokalemia(); for (const action of care) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RenalHypokalemiaTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) act(() => button.click());
    const links = [...container.querySelectorAll('a')];
    expect(links.map((link) => link.href)).toEqual([RENAL_HYPOKALEMIA_SOURCE_HREF, RENAL_HYPOKALEMIA_MAGNESIUM_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces nine decisions including two full observations with stopped reading time', () => {
    const model = new RenalHypokalemia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('renal-hypokalemia-response'); model.apply(action.payload.action, clock.tick); });
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
    render(); for (let index = 0; index < 6; index++) proceed();
    expect(advance).toBeUndefined(); clock.pause(); render(); expect(clock.ticksFor(60_000)).toBe(0); expect(play).toHaveBeenCalledTimes(6);
    jump(EARLY - 1); expect(advance).toBeUndefined(); jump(EARLY); proceed();
    const old = model.snapshot(EARLY).observation; expect(advance).toBeUndefined();
    jump(RESPONSE - 1); expect(advance).toBeUndefined(); jump(RESPONSE); expect(model.snapshot(RESPONSE).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...care, 'reassess', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(9);
    expect(model.snapshot(RESPONSE)).toMatchObject({ ended: 'handoff', potassiumResponseObserved: true, responseObserved: true, durableRecoveryProven: false });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new RenalHypokalemia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RenalHypokalemiaSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new RenalHypokalemia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, potassiumObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });
});
