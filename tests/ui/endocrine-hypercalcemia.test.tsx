/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, HypercalcemiaSnapshot } from '@platform/kernel/protocol';
import { HypercalcemiaTray } from '../../src/modules/endocrine-metabolic/HypercalcemiaTray';
import { Hypercalcemia, HYPERCALCEMIA_FLUID_RESPONSE_TICKS, HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS,
  HYPERCALCEMIA_DELAY_TICKS, HYPERCALCEMIA_TAKEOVER_TICKS, type HypercalcemiaAction } from '../../src/modules/endocrine-metabolic/hypercalcemia';
import { HYPERCALCEMIC_CRISIS_VOLUME_AND_BRIDGE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypercalcemic-crisis-volume-and-bridge';
import { hypercalcemiaInlinePrompt, HYPERCALCEMIA_SOURCE_HREF, HYPERCALCEMIA_ES_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/tutor/hypercalcemia-guidance';
import { hypercalcemiaDemonstrationStep, supportsHypercalcemiaDemonstration, HYPERCALCEMIA_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/hypercalcemia-demonstration';
import { useHypercalcemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHypercalcemiaDemonstration';

const VERSION = '0.1.0';
const labels: Record<HypercalcemiaAction, string> = {
  'call-support': 'Call qualified support', 'tailored-fluids': 'Start qualified tailored hydration',
  calcitonin: 'Start qualified calcitonin bridge', 'assess-cardiorenal': 'Review cardiac and renal risk',
  antiresorptive: 'Start qualified antiresorptive pathway', 'unrestricted-fluids': 'Choose unrestricted fluids',
  'routine-diuretic': 'Add a routine loop diuretic', 'wait-for-cause': 'Wait for the cause investigation',
  reassess: 'Reassess calcium, circulation, and fluid tolerance', handoff: 'Hand off ongoing treatment and risk',
};

function DemoHarness(props: {
  active: boolean; running: boolean; patient?: HypercalcemiaSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; finish: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useHypercalcemiaDemonstration({ active: props.active, running: props.running, patient: props.patient,
    act: props.onAction, pause: props.pause, play: props.play, onFinished: props.finish });
  props.capture(demo.onAdvance);
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />
    <HypercalcemiaTray assessment={props.patient} scenarioVersion={VERSION} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('Hypercalcemia volume and bridge experience', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  function patientView() {
    const model = new Hypercalcemia(); let tick = 0;
    const dispatch = vi.fn((action: HypercalcemiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><HypercalcemiaTray assessment={model.snapshot(tick)}
      scenarioVersion={VERSION} guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: HypercalcemiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: HypercalcemiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }

  it('prepares without invented results and binds the example to the supported scenario and version', () => {
    const html = renderToStaticMarkup(<HypercalcemiaTray scenarioVersion={VERSION} onAction={() => {}} />);
    expect(html).toContain('Preparing the fictional patient'); expect(html).not.toContain('<button');
    expect(html).not.toContain('16.4');
    expect(HYPERCALCEMIA_DEMONSTRATION_VERSION).toBe('0.1.0'); expect(SCENARIO.metadata.version).toBe('0.1.0');
    expect(supportsHypercalcemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsHypercalcemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(supportsHypercalcemiaDemonstration({ ...SCENARIO, timeline: [] })).toBe(false);
    expect(hypercalcemiaDemonstrationStep()).toMatchObject({ id: 'preparing', progress: 0 });
    expect(hypercalcemiaDemonstrationStep().action).toBeUndefined();
    const view = patientView(); view.render(); view.jump(10);
    expect(view.dispatch).not.toHaveBeenCalled(); expect(container.querySelectorAll('button')).toHaveLength(10);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.textContent).toContain('Supplied initial adjusted calcium: 16.4 mg/dL');
    expect(container.textContent).toContain('not a current calcium reading');
    expect(container.textContent).toContain('No new bedside and calcium reassessment');
    expect(container.textContent).not.toContain('Last requested assessment');
  });

  it('uses quiet read-only guidance for parallel urgent care, renal review, and fresh observations', () => {
    const model = new Hypercalcemia();
    const prompt = (level: 'guided' | 'coached' | 'unassisted', version = VERSION, tick = 0) =>
      hypercalcemiaInlinePrompt(level, { scenarioVersion: version, hypercalcemia: model.snapshot(tick) });
    expect(prompt('guided')?.id).toBe('hypercalcemia-volume'); expect(prompt('coached')?.id).toBe('hypercalcemia-volume');
    expect(prompt('unassisted')).toBeNull(); expect(prompt('guided', '0.1.1')).toBeNull();
    expect(hypercalcemiaInlinePrompt('guided', { scenarioVersion: VERSION })).toBeNull();
    model.apply('tailored-fluids', 0); expect(prompt('guided')?.id).toBe('hypercalcemia-bridge');
    model.apply('calcitonin', 0); expect(prompt('guided')?.id).toBe('hypercalcemia-cardiorenal');
    model.apply('assess-cardiorenal', 0); expect(prompt('guided')?.id).toBe('hypercalcemia-antiresorptive');
    expect(prompt('guided')?.because).toContain('do not wait for hydration to finish');
    model.apply('antiresorptive', 0); expect(prompt('guided')?.id).toBe('hypercalcemia-support');
    model.apply('call-support', 0);
    const before = JSON.stringify(model.snapshot(0));
    for (let read = 0; read < 20; read++) prompt('guided');
    expect(JSON.stringify(model.snapshot(0))).toBe(before);
    expect(prompt('guided')?.id).toBe('hypercalcemia-observe-volume'); expect(prompt('coached')).toBeNull();
    model.advance(HYPERCALCEMIA_FLUID_RESPONSE_TICKS);
    expect(prompt('coached', VERSION, HYPERCALCEMIA_FLUID_RESPONSE_TICKS)?.id).toBe('hypercalcemia-check-volume');
    for (const guidance of ['guided', 'coached', 'unassisted'] as const) {
      const html = renderToStaticMarkup(<HypercalcemiaTray assessment={model.snapshot(HYPERCALCEMIA_FLUID_RESPONSE_TICKS)}
        scenarioVersion={VERSION} guidance={guidance} onAction={() => {}} />);
      expect(html.includes('aria-label="Private tutor"')).toBe(guidance !== 'unassisted');
      expect(html).not.toContain('aria-live'); expect(html).toContain(HYPERCALCEMIA_ES_SOURCE_HREF);
    }
  });

  it('sends every declared choice, preserves refusals, and keeps focus on accepted controls', () => {
    const view = patientView(); const expected: HypercalcemiaAction[] = [];
    const choose = (action: HypercalcemiaAction) => { expected.push(action); view.click(action); };
    choose('antiresorptive'); expect(view.snapshot().antiresorptiveAtTick).toBeNull();
    expect(container.textContent).toContain('Antiresorptive treatment was not started');
    choose('wait-for-cause'); choose('unrestricted-fluids'); choose('routine-diuretic');
    expect(view.snapshot()).toMatchObject({ waitForCauseChosen: true, unrestrictedFluidsAttempted: true, routineDiureticAttempted: true });
    choose('reassess'); expect(view.snapshot().observation).toMatchObject({ adjustedCalciumMgDl: 16.4, systolicMmHg: 96 });
    choose('handoff'); expect(view.snapshot().ended).toBeNull();
    const hydration = view.button('tailored-fluids'); hydration.focus(); choose('tailored-fluids');
    expect(view.snapshot()).toMatchObject({ fluidsAtTick: 0, cardiorenalAssessedAtTick: null });
    expect(view.button('tailored-fluids')).toBe(hydration); expect(document.activeElement).toBe(hydration);
    expect(hydration.disabled).toBe(false); expect(hydration.getAttribute('aria-disabled')).toBe('true');
    view.click('tailored-fluids'); expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
    choose('calcitonin');
    expect(view.button('wait-for-cause').getAttribute('aria-disabled')).toBe('true');
    view.click('wait-for-cause'); expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
    choose('assess-cardiorenal'); choose('antiresorptive'); choose('call-support');
    view.jump(HYPERCALCEMIA_FLUID_RESPONSE_TICKS); choose('reassess');
    expect(view.snapshot()).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: false });
    expect(view.snapshot().observation).toMatchObject({ adjustedCalciumMgDl: 16.4, systolicMmHg: 106 });
    choose('handoff'); expect(view.snapshot().ended).toBeNull();
    view.jump(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS); choose('reassess');
    expect(view.snapshot().observation).toMatchObject({ adjustedCalciumMgDl: 14.8 });
    const handoff = view.button('handoff'); handoff.focus(); choose('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', durableRecoveryProven: false });
    expect(view.button('handoff')).toBe(handoff); expect(document.activeElement).toBe(handoff);
    expect(container.textContent).toContain('not recovery or discharge clearance');
    expect(container.textContent).toContain('Earlier choices stay in this run: unrestricted fluids; routine loop diuretic; waiting for the cause investigation');
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual(expected);
    expect(new Set(expected)).toEqual(new Set(Object.keys(labels)));
    for (const action of Object.keys(labels) as HypercalcemiaAction[]) {
      expect(view.button(action).getAttribute('aria-disabled')).toBe('true'); view.click(action);
    }
    expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
  });

  it('never reveals a later calcium result before reassessment and retains a repaired urgent omission', () => {
    const view = patientView(); view.click('reassess'); const initial = view.snapshot().observation;
    view.jump(HYPERCALCEMIA_DELAY_TICKS);
    expect(view.snapshot().urgentTreatmentDelayed).toBe(true); expect(view.snapshot().observation).toEqual(initial);
    expect(container.textContent).toContain('Later treatment does not erase that delay');
    for (const action of ['tailored-fluids', 'calcitonin', 'assess-cardiorenal', 'antiresorptive', 'call-support'] as const) view.click(action);
    view.jump(HYPERCALCEMIA_DELAY_TICKS + HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS);
    expect(view.snapshot().observation).toEqual(initial); expect(container.textContent).not.toContain('14.8');
    expect(container.textContent).toContain('Last requested assessment at simulated 0 min: adjusted calcium 16.4 mg/dL');
    expect(container.textContent).toContain('This observation can become stale');
    view.click('reassess'); expect(container.textContent).toContain('adjusted calcium 14.8 mg/dL');
    expect(view.snapshot()).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: true, urgentTreatmentDelayed: true });
  });

  it.each(['tailored-fluids', 'calcitonin'] as const)('allows investigation deferral only while urgent treatment remains missing after %s', (first) => {
    const view = patientView(); view.click(first);
    expect(view.button('wait-for-cause').getAttribute('aria-disabled')).toBe('false');
    view.click('wait-for-cause'); expect(view.snapshot().waitForCauseChosen).toBe(true);
    view.click(first === 'tailored-fluids' ? 'calcitonin' : 'tailored-fluids');
    expect(view.snapshot().antiresorptiveAtTick).toBeNull();
    expect(view.button('wait-for-cause').getAttribute('aria-disabled')).toBe('true');
    const calls = view.dispatch.mock.calls.length; view.click('wait-for-cause'); expect(view.dispatch).toHaveBeenCalledTimes(calls);
  });

  it.each(['guided', 'unassisted'] as const)('retains pausing source links while a demonstration guards every decision in %s mode', (guidance) => {
    const model = new Hypercalcemia(); const onAction = vi.fn(); const source = vi.fn();
    act(() => root.render(<HypercalcemiaTray assessment={model.snapshot(0)} scenarioVersion={VERSION} guidance={guidance}
      demonstrating onAction={onAction} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) {
      expect(button.getAttribute('aria-disabled')).toBe('true'); expect(button.disabled).toBe(false); act(() => button.click());
    }
    expect(onAction).not.toHaveBeenCalled();
    const links = [...container.querySelectorAll('a')]; expect(links.map((link) => link.href)).toEqual([HYPERCALCEMIA_SOURCE_HREF, HYPERCALCEMIA_ES_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(onAction).not.toHaveBeenCalled();
    expect(model.snapshot(0).fluidsAtTick).toBeNull();
  });

  it('guides eight explicit decisions with real clock pauses, both waiting boundaries, and a single finish', () => {
    const model = new Hypercalcemia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('hypercalcemia-response'); model.apply(action.payload?.action, clock.tick); });
    const render = (patient = model.snapshot(clock.tick), active = true) => act(() => root.render(<StrictMode>
      <DemoHarness active={active} running={clock.state === 'running'} patient={patient} onAction={dispatch}
        pause={pause} play={play} finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    const next = () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    const proceed = () => {
      const count = dispatch.mock.calls.length; const snapshot = model.snapshot(clock.tick); const callback = advance!;
      expect(next().getAttribute('aria-disabled')).toBe('false'); expect(clock.state).toBe('paused');
      for (let read = 0; read < 5; read++) { expect(clock.ticksFor(60_000)).toBe(0); render(); }
      expect(dispatch.mock.calls.length).toBe(count);
      const focused = next(); focused.focus();
      act(() => { next().click(); next().click(); callback(); expect(dispatch.mock.calls.length).toBe(count + 1); });
      expect(clock.state).toBe('running');
      const pauses = pause.mock.calls.length; render(snapshot); act(() => { next().click(); callback(); });
      expect(dispatch.mock.calls.length).toBe(count + 1); expect(pause.mock.calls.length).toBe(pauses);
      expect(next()).toBe(focused); expect(document.activeElement).toBe(focused); expect(focused.disabled).toBe(false);
      render();
    };
    const waiting = () => {
      const calls = dispatch.mock.calls.length; const pauses = pause.mock.calls.length; const plays = play.mock.calls.length;
      expect(next().getAttribute('aria-disabled')).toBe('true');
      for (let repeat = 0; repeat < 3; repeat++) { render(); act(() => next().click()); }
      expect(dispatch.mock.calls.length).toBe(calls); expect(pause.mock.calls.length).toBe(pauses); expect(play.mock.calls.length).toBe(plays);
    };
    const jump = (tick: number, accepted = true) => { clock.restore(tick); clock.play(); if (accepted) model.advance(tick); render(); };
    render(); expect(dispatch).not.toHaveBeenCalled(); expect(clock.state).toBe('paused');
    for (let decision = 0; decision < 5; decision++) proceed();
    expect(model.snapshot(0)).toMatchObject({ fluidsAtTick: 0, calcitoninAtTick: 0, antiresorptiveAtTick: 0, supportActive: true });
    waiting(); clock.pause(); render(); waiting(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(HYPERCALCEMIA_FLUID_RESPONSE_TICKS - 1); expect(model.snapshot(clock.tick).fluidDueInSeconds).toBe(1); waiting();
    jump(HYPERCALCEMIA_FLUID_RESPONSE_TICKS, false); expect(model.snapshot(clock.tick).fluidDueInSeconds).toBe(0); waiting();
    jump(HYPERCALCEMIA_FLUID_RESPONSE_TICKS); proceed();
    expect(model.snapshot(clock.tick)).toMatchObject({ fluidResponseObserved: true, bridgeResponseObserved: false });
    expect(model.snapshot(clock.tick).observation?.adjustedCalciumMgDl).toBe(16.4);
    waiting(); jump(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS - 1); expect(model.snapshot(clock.tick).bridgeDueInSeconds).toBe(1); waiting();
    jump(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS, false); expect(model.snapshot(clock.tick).bridgeDueInSeconds).toBe(0); waiting();
    jump(HYPERCALCEMIA_BRIDGE_RESPONSE_TICKS); expect(container.textContent).not.toContain('14.8');
    proceed(); expect(model.snapshot(clock.tick).bridgeResponseObserved).toBe(true);
    expect(model.snapshot(clock.tick).observation?.adjustedCalciumMgDl).toBe(14.8);
    proceed(); render(); render();
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'tailored-fluids', 'calcitonin', 'assess-cardiorenal', 'antiresorptive', 'call-support', 'reassess', 'reassess', 'handoff',
    ].map((action) => ({ type: 'hypercalcemia-response', payload: { action } })));
    expect(finish).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledTimes(8); expect(clock.state).toBe('paused');
    expect(model.snapshot(clock.tick)).toMatchObject({ ended: 'handoff', durableRecoveryProven: false, urgentTreatmentDelayed: false,
      unrestrictedFluidsAttempted: false, routineDiureticAttempted: false, waitForCauseChosen: false });
    expect(container.textContent).toContain('not recovery or discharge clearance');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('guards preparing, takeover, and old callbacks after restart, and finishes an ended branch once', () => {
    const model = new Hypercalcemia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: HypercalcemiaSnapshot) => act(() => root.render(<StrictMode>
      <DemoHarness active={active} running={false} patient={patient} onAction={dispatch} pause={pause} play={play}
        finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    render(true); expect(advance).toBeUndefined(); expect(pause).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
    const preparing = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    expect(preparing.getAttribute('aria-disabled')).toBe('true'); act(() => preparing.click()); expect(play).not.toHaveBeenCalled();
    render(true, model.snapshot(0)); const retained = advance!;
    const before = JSON.stringify(model.snapshot(0)); render(false, model.snapshot(0)); act(() => retained());
    expect(dispatch).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled(); expect(JSON.stringify(model.snapshot(0))).toBe(before);
    render(true, new Hypercalcemia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    const current = advance!; act(() => current()); expect(dispatch).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledOnce();
    model.advance(HYPERCALCEMIA_TAKEOVER_TICKS); render(true, model.snapshot(HYPERCALCEMIA_TAKEOVER_TICKS));
    render(true, model.snapshot(HYPERCALCEMIA_TAKEOVER_TICKS));
    expect(pause).toHaveBeenCalledOnce(); expect(finish).toHaveBeenCalledOnce(); expect(dispatch).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Instructor takeover ended this branch');
  });
});
