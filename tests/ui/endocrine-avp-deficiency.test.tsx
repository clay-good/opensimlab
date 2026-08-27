/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, AvpDeficiencySnapshot } from '@platform/kernel/protocol';
import { AvpDeficiencyTray } from '../../src/modules/endocrine-metabolic/AvpDeficiencyTray';
import { AvpDeficiency, AVP_DEFICIENCY_VOLUME_TICKS as VOLUME, AVP_DEFICIENCY_RESPONSE_TICKS as RESPONSE,
  AVP_DEFICIENCY_DELAY_TICKS as DELAY, AVP_DEFICIENCY_DESMOPRESSIN_TICKS as DESMOPRESSIN,
  AVP_DEFICIENCY_UNCONTROLLED_TICKS as UNCONTROLLED, AVP_DEFICIENCY_TAKEOVER_TICKS as TAKEOVER,
  type AvpDeficiencyAction } from '../../src/modules/endocrine-metabolic/avp-deficiency';
import { HYPERNATREMIC_DEHYDRATION_AVP_DEFICIENCY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypernatremic-dehydration-avp-deficiency';
import { avpDeficiencyInlinePrompt, AVP_DEFICIENCY_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/avp-deficiency-tutor';
import { avpDeficiencyDemonstrationStep, supportsAvpDeficiencyDemonstration,
  AVP_DEFICIENCY_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/avp-deficiency-demonstration';
import { useAvpDeficiencyDemonstration } from '../../src/modules/endocrine-metabolic/demo/useAvpDeficiencyDemonstration';

const VERSION = '0.1.1';
const labels: Record<AvpDeficiencyAction, string> = {
  'restore-volume': 'Start qualified volume restoration', 'review-context': 'Review medication and water-access context',
  'call-support': 'Call qualified support', monitor: 'Arrange serial sodium and urine checks',
  'replace-water': 'Request tailored water replacement', 'restore-desmopressin': 'Restore qualified desmopressin care',
  reassess: 'Reassess sodium, urine, and bedside response', handoff: 'Hand off water balance and continuing care',
  'normalize-now': 'Aim for normal sodium now', 'withhold-desmopressin': 'Withhold prescribed desmopressin throughout',
};
const step = (model: AvpDeficiency, tick: number) => avpDeficiencyDemonstrationStep(model.snapshot(tick));
const tutor = (model: AvpDeficiency, tick: number) => avpDeficiencyInlinePrompt('guided', {
  scenarioVersion: VERSION, avpDeficiency: model.snapshot(tick),
});

function DemoHarness(props: {
  active: boolean; running: boolean; patient?: AvpDeficiencySnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; finish: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useAvpDeficiencyDemonstration({ active: props.active, running: props.running, patient: props.patient,
    act: props.onAction, pause: props.pause, play: props.play, onFinished: props.finish });
  props.capture(demo.onAdvance);
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />
    <AvpDeficiencyTray assessment={props.patient} scenarioVersion={VERSION} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('AVP deficiency circulation and water-balance experience', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new AvpDeficiency(); let tick = 0;
    const dispatch = vi.fn((action: AvpDeficiencyAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><AvpDeficiencyTray assessment={model.snapshot(tick)}
      scenarioVersion={VERSION} guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: AvpDeficiencyAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: AvpDeficiencyAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }

  it('offers a learner-paced worked example without the unrelated induction script', () => {
    const start = vi.fn(); const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="guided" onGuidance={() => {}} onStart={start} onWatch={watch} />));
    expect(container.textContent).toContain('observation periods run at 60× speed');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).not.toContain('90-second');
    const example = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!;
    act(() => example.click()); expect(watch).toHaveBeenCalledOnce(); expect(start).not.toHaveBeenCalled();
  });

  it('offers volume immediately, preserves accepted-control focus, and versions read-only guidance', () => {
    expect(renderToStaticMarkup(<AvpDeficiencyTray scenarioVersion={VERSION} onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); const initial = JSON.stringify(view.snapshot()); view.render();
    expect(view.dispatch).not.toHaveBeenCalled(); expect(JSON.stringify(view.snapshot())).toBe(initial);
    expect(container.querySelectorAll('button')).toHaveLength(10);
    expect(container.textContent).toContain('Supplied initial sodium: 162 mmol/L');
    expect(container.textContent).toContain('Low urine output during hypovolemia does not exclude known AVP-D');
    expect(container.textContent).toContain('distinct from diabetes mellitus');
    expect(tutor(view.model, 0)?.id).toBe('avp-deficiency-volume');
    expect(step(view.model, 0)).toMatchObject({ id: 'volume', action: 'restore-volume' });
    expect(AVP_DEFICIENCY_DEMONSTRATION_VERSION).toBe('0.1.1');
    expect(supportsAvpDeficiencyDemonstration(SCENARIO)).toBe(true);
    expect(supportsAvpDeficiencyDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.2' } })).toBe(false);
    expect(avpDeficiencyDemonstrationStep()).toMatchObject({ id: 'preparing' });
    expect(avpDeficiencyInlinePrompt('unassisted', { scenarioVersion: VERSION, avpDeficiency: view.snapshot() })).toBeNull();
    expect(avpDeficiencyInlinePrompt('guided', { scenarioVersion: '0.1.2', avpDeficiency: view.snapshot() })).toBeNull();
    const volume = view.button('restore-volume'); volume.focus(); view.click('restore-volume');
    expect(view.snapshot()).toMatchObject({ volumeAtTick: 0, contextReviewedAtTick: null, supportActive: false, observation: null });
    expect(view.button('restore-volume')).toBe(volume); expect(document.activeElement).toBe(volume);
    expect(volume.disabled).toBe(false); expect(volume.getAttribute('aria-disabled')).toBe('true');
    view.click('restore-volume'); expect(view.dispatch).toHaveBeenCalledOnce();
  });

  it.each(['replace-water', 'restore-desmopressin'] as const)('allows %s first after visible circulation improves without a new laboratory or administrative gate', (first) => {
    const view = patientView(); view.click('restore-volume'); view.jump(VOLUME);
    expect(view.snapshot()).toMatchObject({ circulationRestored: true, observation: null, contextReviewedAtTick: null,
      supportActive: false, monitoringAtTick: null, volumeObserved: false });
    expect(tutor(view.model, VOLUME)?.id).toBe('avp-deficiency-water');
    view.click(first); const second = first === 'replace-water' ? 'restore-desmopressin' : 'replace-water';
    expect(tutor(view.model, VOLUME)?.id).toBe(first === 'replace-water' ? 'avp-deficiency-desmopressin' : 'avp-deficiency-water');
    view.click(second);
    expect(view.snapshot()).toMatchObject({ waterAtTick: VOLUME, desmopressinAtTick: VOLUME, observation: null });
    expect(container.textContent).toContain('without a new laboratory click or administrative prerequisite');
    for (const action of ['review-context', 'call-support', 'monitor'] as const) view.click(action);
    view.jump(VOLUME + RESPONSE); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ responseObserved: true, ended: 'handoff', durableRecoveryProven: false });
  });

  it('keeps sodium and urine changes hidden until requested and leaves older findings historical', () => {
    const view = patientView(); view.click('restore-volume');
    for (const action of ['review-context', 'call-support', 'monitor'] as const) view.click(action);
    view.jump(VOLUME);
    expect(view.snapshot().observation).toBeNull(); expect(view.snapshot().peakObservedSodiumMmolL).toBe(162);
    expect(container.textContent).not.toContain('Last requested assessment');
    expect(container.textContent).not.toMatch(/163 mmol\/L|450 mL\/hour|95 mOsm\/kg/);
    expect(step(view.model, VOLUME)).toMatchObject({ id: 'volume-reassessment', action: 'reassess' });
    view.click('reassess'); const first = view.snapshot().observation!;
    expect(first).toMatchObject({ sodiumMmolL: 163, urineOutputMlPerHour: 450, urineOsmolalityMosmPerKg: 95 });
    expect(container.textContent).toContain(`sodium ${first.sodiumMmolL} mmol/L, urine output ${first.urineOutputMlPerHour} mL/hour`);
    expect(container.textContent).toContain(`urine osmolality ${first.urineOsmolalityMosmPerKg} mOsm/kg`);
    view.jump(VOLUME + UNCONTROLLED);
    expect(view.snapshot().observation).toEqual(first);
    expect(view.snapshot().peakObservedSodiumMmolL).toBe(Math.max(162, first.sodiumMmolL));
    expect(container.textContent).toContain('These findings are historical and can become stale');
    expect(container.textContent).not.toContain('165 mmol/L');
    view.click('reassess'); expect(view.snapshot().observation!.sodiumMmolL).toBe(165);
  });

  it('does not mistake an observed desmopressin-only urine response for corrected sodium or a handoff', () => {
    const view = patientView(); view.click('restore-volume'); view.jump(VOLUME); view.click('reassess');
    const first = view.snapshot().observation!; view.click('restore-desmopressin'); view.jump(VOLUME + DESMOPRESSIN);
    expect(view.snapshot().observation).toEqual(first); view.click('reassess');
    expect(view.snapshot().observation).toMatchObject({ sodiumMmolL: 163, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 });
    expect(view.snapshot()).toMatchObject({ waterAtTick: null, responseObserved: false });
    expect(container.textContent).toContain('Less urine alone does not establish sodium correction');
    view.click('handoff'); expect(view.snapshot().ended).toBeNull();
    expect(tutor(view.model, VOLUME + DESMOPRESSIN)?.id).toBe('avp-deficiency-water');
  });

  it('retains delayed care, both mistaken choices, and the observed peak after later recovery', () => {
    const view = patientView(); view.click('normalize-now'); view.click('withhold-desmopressin'); view.jump(DELAY);
    view.click('restore-volume'); view.jump(DELAY + VOLUME); view.click('reassess');
    const peak = view.snapshot().peakObservedSodiumMmolL;
    expect(peak).toBe(164);
    for (const action of ['replace-water', 'restore-desmopressin', 'review-context', 'call-support', 'monitor'] as const) view.click(action);
    view.jump(DELAY + VOLUME + RESPONSE); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', normalizationAttempted: true, withholdingChosen: true,
      volumeDelayed: true, peakObservedSodiumMmolL: peak, durableRecoveryProven: false, observation: { sodiumMmolL: 163 } });
    expect(container.textContent).toContain('Earlier choices stay in this run');
    expect(container.textContent).toContain('An authored volume-restoration delay was recorded');
    expect(container.textContent).toContain('not recovery or discharge clearance');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as AvpDeficiencyAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, protects example controls, and retains pausing source links', () => {
    const model = new AvpDeficiency();
    for (const action of ['restore-volume', 'review-context', 'call-support', 'monitor'] as const) model.apply(action, 0);
    expect(avpDeficiencyInlinePrompt('coached', { scenarioVersion: VERSION, avpDeficiency: model.snapshot(0) })).toBeNull();
    const dispatch = vi.fn(); const source = vi.fn();
    act(() => root.render(<AvpDeficiencyTray assessment={model.snapshot(0)} scenarioVersion={VERSION}
      guidance="guided" demonstrating onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) {
      expect(button.getAttribute('aria-disabled')).toBe('true'); expect(button.disabled).toBe(false); act(() => button.click());
    }
    const link = container.querySelector('a')!; expect(link.href).toBe(AVP_DEFICIENCY_SOURCE_HREF);
    expect(link.rel).toBe('noreferrer'); expect(link.target).toBe('_blank');
    link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    expect(source).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces all nine decisions with a stopped reading clock and distinct circulation and combined-care waits', () => {
    const model = new AvpDeficiency(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('avp-deficiency-response'); model.apply(action.payload?.action, clock.tick); });
    const render = (patient = model.snapshot(clock.tick)) => act(() => root.render(<StrictMode>
      <DemoHarness active running={clock.state === 'running'} patient={patient} onAction={dispatch}
        pause={pause} play={play} finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    const next = () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    const proceed = () => {
      const count = dispatch.mock.calls.length; const before = model.snapshot(clock.tick); const callback = advance!;
      expect(next().getAttribute('aria-disabled')).toBe('false'); expect(clock.state).toBe('paused');
      for (let read = 0; read < 3; read++) { expect(clock.ticksFor(60_000)).toBe(0); render(); }
      expect(dispatch.mock.calls.length).toBe(count); const focused = next(); focused.focus();
      act(() => { next().click(); next().click(); callback(); });
      expect(dispatch.mock.calls.length).toBe(count + 1); expect(clock.state).toBe('running');
      const pauses = pause.mock.calls.length; render(before); act(() => { next().click(); callback(); });
      expect(dispatch.mock.calls.length).toBe(count + 1); expect(pause.mock.calls.length).toBe(pauses);
      expect(next()).toBe(focused); expect(document.activeElement).toBe(focused); render();
    };
    const waiting = () => {
      const calls = dispatch.mock.calls.length; const pauses = pause.mock.calls.length; const plays = play.mock.calls.length;
      expect(next().getAttribute('aria-disabled')).toBe('true'); render(); act(() => next().click());
      expect(dispatch.mock.calls.length).toBe(calls); expect(pause.mock.calls.length).toBe(pauses); expect(play.mock.calls.length).toBe(plays);
    };
    const jump = (tick: number) => { clock.restore(tick); clock.play(); model.advance(tick); render(); };
    render(); expect(dispatch).not.toHaveBeenCalled();
    for (let decision = 0; decision < 4; decision++) proceed();
    waiting(); clock.pause(); render(); waiting(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(VOLUME - 1); expect(model.snapshot(clock.tick).volumeDueInSeconds).toBe(1); waiting();
    jump(VOLUME); expect(model.snapshot(clock.tick).observation).toBeNull(); proceed(); proceed(); proceed();
    expect(model.snapshot(clock.tick)).toMatchObject({ waterAtTick: VOLUME, desmopressinAtTick: VOLUME });
    waiting(); jump(VOLUME + RESPONSE - 1); expect(model.snapshot(clock.tick).responseDueInSeconds).toBe(1); waiting();
    const oldObservation = model.snapshot(clock.tick).observation;
    jump(VOLUME + RESPONSE); expect(model.snapshot(clock.tick).observation).toEqual(oldObservation); proceed(); proceed(); render(); render();
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'restore-volume', 'review-context', 'call-support', 'monitor', 'reassess', 'replace-water', 'restore-desmopressin', 'reassess', 'handoff',
    ].map((action) => ({ type: 'avp-deficiency-response', payload: { action } })));
    expect(finish).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledTimes(9); expect(clock.state).toBe('paused');
    expect(model.snapshot(clock.tick)).toMatchObject({ ended: 'handoff', responseObserved: true, durableRecoveryProven: false,
      observation: { sodiumMmolL: 162, urineOutputMlPerHour: 80, urineOsmolalityMosmPerKg: 500 }, peakObservedSodiumMmolL: 163 });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('guards preparing and retained callbacks after takeover, then ends an untreated branch once', () => {
    const model = new AvpDeficiency(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: AvpDeficiencySnapshot) => act(() => root.render(<StrictMode>
      <DemoHarness active={active} running={false} patient={patient} onAction={dispatch} pause={pause} play={play}
        finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    render(true); expect(advance).toBeUndefined(); expect(dispatch).not.toHaveBeenCalled();
    render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new AvpDeficiency().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(pause).toHaveBeenCalledOnce(); expect(finish).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Instructor takeover ended this branch');
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, peakObservedSodiumMmolL: 162 });
    expect(tutor(model, TAKEOVER)).toBeNull();
  });
});
