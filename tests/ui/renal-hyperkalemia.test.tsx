/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RenalHyperkalemiaSnapshot } from '@platform/kernel/protocol';
import { RenalHyperkalemiaTray } from '../../src/modules/renal-electrolyte/RenalHyperkalemiaTray';
import { RenalHyperkalemia, RENAL_HYPERKALEMIA_SHIFT_TICKS as EARLY,
  RENAL_HYPERKALEMIA_REMOVAL_TICKS as RESPONSE, RENAL_HYPERKALEMIA_REBOUND_TICKS as REBOUND, RENAL_HYPERKALEMIA_TAKEOVER_TICKS as TAKEOVER,
  type RenalHyperkalemiaAction } from '../../src/modules/renal-electrolyte/hyperkalemia';
import { RENAL_HYPERKALEMIA_CARDIOPROTECTION_AND_REBOUND as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyperkalemia-cardioprotection-and-rebound';
import { renalHyperkalemiaInlinePrompt, RENAL_HYPERKALEMIA_SOURCE_HREF, RENAL_HYPERKALEMIA_KDIGO_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hyperkalemia-tutor';
import { renalHyperkalemiaDemonstrationStep, supportsRenalHyperkalemiaDemonstration,
  RENAL_HYPERKALEMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hyperkalemia-demonstration';
import { useRenalHyperkalemiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHyperkalemiaDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

const labels: Record<RenalHyperkalemiaAction, string> = {
  calcium: 'Request qualified calcium cardioprotection', shift: 'Request qualified potassium shifting',
  'call-support': 'Call qualified acute-care and kidney support', 'review-context': 'Review kidney, sample, and medication context',
  'plan-removal': 'Plan individualized potassium removal', 'deliver-removal': 'Confirm qualified removal treatment delivered',
  monitor: 'Arrange potassium, ECG, and glucose surveillance', 'check-ecg': 'Check ECG only', 'check-glucose': 'Check blood glucose only',
  reassess: 'Reassess potassium, glucose, ECG, and bedside response', handoff: 'Hand off treatment and continuing surveillance',
  'ecg-resolved': 'Treat ECG improvement as resolution', 'stop-glucose-monitoring': 'Stop glucose monitoring',
};
const care = ['calcium', 'shift', 'call-support', 'review-context', 'plan-removal', 'deliver-removal', 'monitor'] as const;
const tutor = (model: RenalHyperkalemia, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  renalHyperkalemiaInlinePrompt(level, { scenarioVersion: '0.1.0', renalHyperkalemia: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RenalHyperkalemiaSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRenalHyperkalemiaDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Renal hyperkalemia protection, shifting, removal, and separate observations', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new RenalHyperkalemia(); let tick = 0;
    const dispatch = vi.fn((action: RenalHyperkalemiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RenalHyperkalemiaTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RenalHyperkalemiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RenalHyperkalemiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }


  it('offers a ten-decision example without a generic induction script or a fixed removal modality', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="renal-electrolyte"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('ten-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('no fixed dose or automatic dialysis');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('keeps urgent care independent, stable focus, and one-shot shifting alongside repeatable calcium', () => {
    expect(renderToStaticMarkup(<RenalHyperkalemiaTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(13);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(tutor(view.model, 0)?.id).toBe('renal-hyperkalemia-calcium');
    view.click('calcium'); expect(view.snapshot()).toMatchObject({ calciumAtTick: 0, supportActive: false, observation: null });
    const button = view.button('shift'); button.focus(); view.click('shift');
    expect(view.button('shift')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    const count = view.dispatch.mock.calls.length; view.click('shift'); expect(view.dispatch).toHaveBeenCalledTimes(count);
    view.jump(1); view.click('calcium'); expect(view.snapshot().calciumRequests).toBe(2);
    expect(view.button('calcium').getAttribute('aria-disabled')).toBe('false');
    expect(RENAL_HYPERKALEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRenalHyperkalemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHyperkalemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(renalHyperkalemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', renalHyperkalemia: initial })).toBeNull();
  });

  it.each(['shift', 'deliver-removal', 'monitor'] as const)('offers %s without an administrative prerequisite', (first) => {
    const view = patientView(); view.click(first);
    expect(view.snapshot()).toMatchObject({ calciumAtTick: null, supportActive: false, contextReviewedAtTick: null, observation: null });
    expect(tutor(view.model, 0)?.id).toBe('renal-hyperkalemia-calcium');
  });

  it('distinguishes a removal plan and partial ECG/glucose observations from potassium response', () => {
    const view = patientView(); view.click('calcium'); view.click('plan-removal'); view.click('reassess');
    expect(view.snapshot().observation).toMatchObject({ potassiumMmolL: 6.9, rhythm: 'sinus' });
    view.click('shift'); view.jump(EARLY); const before = view.snapshot().observation;
    expect(container.textContent).not.toContain('potassium 5.6 mmol/L'); view.click('check-ecg'); view.click('check-glucose');
    expect(view.snapshot()).toMatchObject({ observation: before, glucoseObservation: { atTick: EARLY, glucoseMgDl: 104 },
      shiftResponseObserved: false, removalAtTick: null });
    expect(container.textContent).toContain('00:30:00: 104 mg/dL');
    expect(container.textContent).toContain('00:00:00: potassium 6.9 mmol/L');
    expect(container.textContent).not.toContain('potassium 5.6 mmol/L');
    view.click('reassess'); expect(view.snapshot().shiftResponseObserved).toBe(true);
    view.jump(REBOUND); view.click('check-ecg');
    expect(container.textContent).toContain('02:30:00: supplied conduction abnormality');
    expect(container.textContent).not.toContain('potassium 6.6 mmol/L');
    view.click('reassess'); expect(view.snapshot()).toMatchObject({ reboundObserved: true, observation: { potassiumMmolL: 6.6 } });
  });

  it('requires a fresh full response for handoff while allowing the early full observation to be skipped', () => {
    const view = patientView(); for (const action of care) view.click(action);
    view.jump(RESPONSE); view.click('check-glucose'); view.click('check-ecg');
    expect(view.snapshot()).toMatchObject({ glucoseObservation: { glucoseMgDl: 100 }, observation: null, removalResponseObserved: false });
    view.click('handoff'); expect(view.snapshot().ended).toBeNull();
    expect(renalHyperkalemiaDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('reassess'); expect(view.snapshot()).toMatchObject({ shiftResponseObserved: false, removalResponseObserved: true });
    expect(tutor(view.model, RESPONSE)?.id).toBe('renal-hyperkalemia-handoff');
    view.click('handoff'); expect(view.snapshot().ended).toBe('handoff');
    expect(container.textContent).toContain('not discharge readiness or durable safety');
  });

  it('retains refused shortcuts and rebound after later delivered removal and handoff', () => {
    const view = patientView(); view.click('shift'); view.click('ecg-resolved'); view.click('stop-glucose-monitoring');
    view.jump(REBOUND); view.click('reassess'); for (const action of care) view.click(action);
    view.jump(REBOUND + RESPONSE); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', reboundObserved: true, ecgResolvedAttempted: true,
      glucoseMonitoringStopAttempted: true, observation: { potassiumMmolL: 5.1, glucoseMgDl: 100 } });
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RenalHyperkalemiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('requests the ready removal assessment without waiting for a later shifting clock', () => {
    const model = new RenalHyperkalemia(); model.apply('deliver-removal', 0); model.advance(RESPONSE);
    for (const action of care) model.apply(action, RESPONSE);
    const patient = model.snapshot(RESPONSE);
    expect(patient.shiftDueInSeconds).toBeGreaterThan(0); expect(patient.observation).toBeNull();
    expect(renalHyperkalemiaDemonstrationStep(patient)).toMatchObject({ id: 'removal-reassessment', action: 'reassess' });
    expect(tutor(model, RESPONSE)?.id).toBe('renal-hyperkalemia-reassess-removal');
  });

  it('keeps coached waits quiet, unassisted silent, and source links active during a guarded example', () => {
    const model = new RenalHyperkalemia(); for (const action of care) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RenalHyperkalemiaTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) act(() => button.click());
    const links = [...container.querySelectorAll('a')];
    expect(links.map((link) => link.href)).toEqual([RENAL_HYPERKALEMIA_SOURCE_HREF, RENAL_HYPERKALEMIA_KDIGO_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces ten decisions including two full observations with stopped reading time', () => {
    const model = new RenalHyperkalemia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('renal-hyperkalemia-response'); model.apply(action.payload.action, clock.tick); });
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
    expect(advance).toBeUndefined(); clock.pause(); render(); expect(clock.ticksFor(60_000)).toBe(0); expect(play).toHaveBeenCalledTimes(7);
    jump(EARLY - 1); expect(advance).toBeUndefined(); jump(EARLY); proceed();
    const old = model.snapshot(EARLY).observation; expect(advance).toBeUndefined();
    jump(RESPONSE - 1); expect(advance).toBeUndefined(); jump(RESPONSE); expect(model.snapshot(RESPONSE).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...care, 'reassess', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(10);
    expect(model.snapshot(RESPONSE)).toMatchObject({ ended: 'handoff', shiftResponseObserved: true, removalResponseObserved: true, durableRecoveryProven: false });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new RenalHyperkalemia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RenalHyperkalemiaSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new RenalHyperkalemia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, glucoseObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });
});
