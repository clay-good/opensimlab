/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, MyxedemaSnapshot } from '@platform/kernel/protocol';
import { MyxedemaTray } from '../../src/modules/endocrine-metabolic/MyxedemaTray';
import { Myxedema, MYXEDEMA_VENTILATION_TICKS, MYXEDEMA_RESPONSE_TICKS, MYXEDEMA_TAKEOVER_TICKS,
  type MyxedemaAction } from '../../src/modules/endocrine-metabolic/myxedema';
import { MYXEDEMA_COMA_VENTILATION_AND_STEROID_SEQUENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/myxedema-coma-ventilation-and-steroid-sequence';
import { myxedemaInlinePrompt, MYXEDEMA_SOURCE_HREF, MYXEDEMA_ATA_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/tutor/myxedema-guidance';
import { myxedemaDemonstrationStep, supportsMyxedemaDemonstration, MYXEDEMA_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/myxedema-demonstration';
import { useMyxedemaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useMyxedemaDemonstration';

const VERSION = '0.1.0';
const labels: Record<MyxedemaAction, string> = {
  'call-support': 'Call qualified support', ventilate: 'Start qualified ventilation support',
  'oxygen-only': 'Use oxygen without ventilation', hydrocortisone: 'Start qualified hydrocortisone coverage',
  levothyroxine: 'Start qualified IV levothyroxine', 'supportive-care': 'Start qualified supportive care',
  reassess: 'Reassess breathing, blood gas, and circulation', handoff: 'Hand off ongoing treatment and risk',
  'wait-for-labs': 'Wait for laboratory confirmation', 'rapid-rewarming': 'Choose rapid rewarming',
};

function DemoHarness(props: {
  active: boolean; running: boolean; patient?: MyxedemaSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; finish: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useMyxedemaDemonstration({ active: props.active, running: props.running, patient: props.patient,
    act: props.onAction, pause: props.pause, play: props.play, onFinished: props.finish });
  props.capture(demo.onAdvance);
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />
    <MyxedemaTray assessment={props.patient} scenarioVersion={VERSION} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('Myxedema emergency experience', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  function patientView() {
    const model = new Myxedema(); let tick = 0;
    const dispatch = vi.fn((action: MyxedemaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><MyxedemaTray assessment={model.snapshot(tick)}
      scenarioVersion={VERSION} guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: MyxedemaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: MyxedemaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }

  it('prepares without invented observations and gates the worked example to the exact supported version', () => {
    const html = renderToStaticMarkup(<MyxedemaTray scenarioVersion={VERSION} onAction={() => {}} />);
    expect(html).toContain('Preparing the fictional patient'); expect(html).not.toContain('<button');
    expect(MYXEDEMA_DEMONSTRATION_VERSION).toBe('0.1.0'); expect(SCENARIO.metadata.version).toBe('0.1.0');
    expect(supportsMyxedemaDemonstration(SCENARIO)).toBe(true);
    expect(supportsMyxedemaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(supportsMyxedemaDemonstration({ ...SCENARIO, timeline: [] })).toBe(false);
    expect(myxedemaDemonstrationStep()).toMatchObject({ id: 'preparing', progress: 0 });
    expect(myxedemaDemonstrationStep().action).toBeUndefined();
    const view = patientView(); view.render(); view.jump(10);
    expect(view.dispatch).not.toHaveBeenCalled(); expect(container.querySelectorAll('button')).toHaveLength(10);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.textContent).not.toContain('PaCO₂');
  });

  it('uses quiet, read-only, version-bound guidance and explains accepted steroid ordering without a timed wait', () => {
    const model = new Myxedema();
    const prompt = (level: 'guided' | 'coached' | 'unassisted', version = VERSION, tick = 0) =>
      myxedemaInlinePrompt(level, { scenarioVersion: version, myxedema: model.snapshot(tick) });
    expect(prompt('guided')?.id).toBe('myxedema-breathing'); expect(prompt('coached')?.id).toBe('myxedema-breathing');
    expect(prompt('unassisted')).toBeNull(); expect(prompt('guided', '0.1.1')).toBeNull();
    expect(myxedemaInlinePrompt('guided', { scenarioVersion: VERSION })).toBeNull();
    model.apply('ventilate', 0); expect(prompt('coached')?.id).toBe('myxedema-steroid-first');
    model.apply('hydrocortisone', 0); expect(prompt('guided')?.id).toBe('myxedema-thyroxine');
    expect(prompt('guided')?.because).toContain('no extra timed wait');
    for (const action of ['levothyroxine', 'supportive-care', 'call-support'] as const) model.apply(action, 0);
    const before = JSON.stringify(model.snapshot(0));
    for (let read = 0; read < 20; read++) prompt('guided');
    expect(JSON.stringify(model.snapshot(0))).toBe(before);
    expect(prompt('guided')?.id).toBe('myxedema-observe-breathing'); expect(prompt('coached')).toBeNull();
    model.advance(MYXEDEMA_VENTILATION_TICKS);
    expect(prompt('coached', VERSION, MYXEDEMA_VENTILATION_TICKS)?.id).toBe('myxedema-check-breathing');
    for (const guidance of ['guided', 'coached', 'unassisted'] as const) {
      const html = renderToStaticMarkup(<MyxedemaTray assessment={model.snapshot(MYXEDEMA_VENTILATION_TICKS)}
        scenarioVersion={VERSION} guidance={guidance} onAction={() => {}} />);
      expect(html.includes('aria-label="Private tutor"')).toBe(guidance !== 'unassisted');
      expect(html).not.toContain('aria-live'); expect(html).toContain(MYXEDEMA_SOURCE_HREF);
    }
  });

  it('routes every decision through the real model, preserves refusals, and retains focus across accepted care', () => {
    const view = patientView(); const expected: MyxedemaAction[] = [];
    const choose = (action: MyxedemaAction) => { expected.push(action); view.click(action); };
    choose('levothyroxine'); expect(view.snapshot().levothyroxineAtTick).toBeNull();
    expect(view.snapshot().earlyThyroxineAttempted).toBe(true);
    choose('wait-for-labs'); choose('rapid-rewarming'); choose('oxygen-only'); choose('reassess');
    expect(view.snapshot().observation).toMatchObject({ spo2Percent: 94, paco2MmHg: 68, respiratoryRateBpm: 8 });
    expect(container.textContent).toContain('SpO₂ 94%, PaCO₂ 68 mmHg');
    expect(container.textContent).toContain('not a live monitor value');
    choose('handoff'); expect(view.snapshot().ended).toBeNull();
    const ventilation = view.button('ventilate'); ventilation.focus(); choose('ventilate');
    expect(view.button('ventilate')).toBe(ventilation); expect(document.activeElement).toBe(ventilation);
    expect(ventilation.disabled).toBe(false); expect(ventilation.getAttribute('aria-disabled')).toBe('true');
    view.click('ventilate'); view.click('oxygen-only'); expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
    choose('hydrocortisone'); choose('levothyroxine');
    expect(view.snapshot()).toMatchObject({ hydrocortisoneAtTick: 0, levothyroxineAtTick: 0 });
    choose('supportive-care'); choose('call-support');
    expect(view.button('wait-for-labs').getAttribute('aria-disabled')).toBe('true');
    view.click('wait-for-labs'); expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
    view.jump(MYXEDEMA_VENTILATION_TICKS); choose('reassess');
    expect(view.snapshot()).toMatchObject({ respiratorySupportObserved: true, responseObserved: false });
    expect(view.snapshot().observation).toMatchObject({ paco2MmHg: 54, respiratoryRateBpm: 12 });
    choose('handoff'); expect(view.snapshot().ended).toBeNull();
    view.jump(MYXEDEMA_RESPONSE_TICKS); choose('reassess');
    expect(view.snapshot().observation).toMatchObject({ coreTemperatureC: 34.2, heartRateBpm: 46, systolicMmHg: 96 });
    const handoff = view.button('handoff'); handoff.focus(); choose('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', durableRecoveryProven: false });
    expect(view.button('handoff')).toBe(handoff); expect(document.activeElement).toBe(handoff);
    expect(container.textContent).toContain('not recovery or discharge clearance');
    expect(container.textContent).toContain('Earlier choices stay in this run: oxygen without ventilation; waiting for laboratory confirmation; thyroxine before steroid coverage; rapid rewarming request');
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual(expected);
    expect(new Set(expected)).toEqual(new Set(Object.keys(labels)));
    for (const action of Object.keys(labels) as MyxedemaAction[]) {
      expect(view.button(action).getAttribute('aria-disabled')).toBe('true'); view.click(action);
    }
    expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
  });

  it('keeps historical blood-gas results separate from deterioration and retains delay after repair', () => {
    const view = patientView(); view.click('reassess'); const initial = view.snapshot().observation;
    view.jump(MYXEDEMA_VENTILATION_TICKS);
    expect(view.snapshot().ventilationDelayed).toBe(true); expect(view.snapshot().observation).toEqual(initial);
    expect(container.textContent).toContain('Last bedside and blood-gas reassessment at simulated 0 min');
    expect(container.textContent).toContain('PaCO₂ 68 mmHg'); expect(container.textContent).toContain('This observation can become stale');
    expect(container.textContent).toContain('Later treatment does not erase that delay');
    for (const action of ['ventilate', 'hydrocortisone', 'levothyroxine', 'supportive-care', 'call-support'] as const) view.click(action);
    view.jump(2 * MYXEDEMA_VENTILATION_TICKS);
    expect(view.snapshot().observation).toEqual(initial); view.click('reassess');
    expect(view.snapshot().observation?.atTick).toBe(2 * MYXEDEMA_VENTILATION_TICKS);
    expect(view.snapshot().ventilationDelayed).toBe(true);
  });

  it.each(['ventilate', 'hydrocortisone'] as const)('keeps laboratory deferral meaningful after only %s is accepted', (first) => {
    const view = patientView(); view.click(first);
    expect(view.button('wait-for-labs').getAttribute('aria-disabled')).toBe('false');
    view.click('wait-for-labs'); expect(view.snapshot().waitForLabsChosen).toBe(true);
    for (const action of ['ventilate', 'hydrocortisone', 'levothyroxine'] as const) view.click(action);
    expect(view.button('wait-for-labs').getAttribute('aria-disabled')).toBe('true');
    const calls = view.dispatch.mock.calls.length; view.click('wait-for-labs'); expect(view.dispatch).toHaveBeenCalledTimes(calls);
  });

  it.each(['guided', 'unassisted'] as const)('keeps source-pause links while demonstration guards every decision in %s mode', (guidance) => {
    const model = new Myxedema(); const onAction = vi.fn(); const source = vi.fn();
    act(() => root.render(<MyxedemaTray assessment={model.snapshot(0)} scenarioVersion={VERSION} guidance={guidance}
      demonstrating onAction={onAction} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) {
      expect(button.getAttribute('aria-disabled')).toBe('true'); expect(button.disabled).toBe(false); act(() => button.click());
    }
    expect(onAction).not.toHaveBeenCalled();
    const links = [...container.querySelectorAll('a')]; expect(links.map((link) => link.href)).toEqual([MYXEDEMA_SOURCE_HREF, MYXEDEMA_ATA_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(onAction).not.toHaveBeenCalled();
    expect(model.snapshot(0).ventilationAtTick).toBeNull();
  });

  it('guides eight explicit decisions with real clock pauses, accepted-state waits, and fresh observations', () => {
    const model = new Myxedema(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('myxedema-response'); model.apply(action.payload?.action, clock.tick); });
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
      act(() => { next().click(); next().click(); callback(); expect(dispatch.mock.calls.length).toBe(count + 1); });
      expect(clock.state).toBe('running');
      const pauses = pause.mock.calls.length; render(snapshot); act(() => { next().click(); callback(); });
      expect(dispatch.mock.calls.length).toBe(count + 1); expect(pause.mock.calls.length).toBe(pauses);
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
    expect(model.snapshot(0)).toMatchObject({ ventilationAtTick: 0, hydrocortisoneAtTick: 0, levothyroxineAtTick: 0 });
    waiting(); clock.pause(); render(); waiting(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(MYXEDEMA_VENTILATION_TICKS - 1); expect(model.snapshot(clock.tick).ventilationDueInSeconds).toBe(1); waiting();
    jump(MYXEDEMA_VENTILATION_TICKS, false); expect(model.snapshot(clock.tick).ventilationDueInSeconds).toBe(0); waiting();
    jump(MYXEDEMA_VENTILATION_TICKS); proceed();
    expect(model.snapshot(clock.tick)).toMatchObject({ respiratorySupportObserved: true, responseObserved: false });
    waiting(); jump(MYXEDEMA_RESPONSE_TICKS - 1); expect(model.snapshot(clock.tick).responseDueInSeconds).toBe(1); waiting();
    jump(MYXEDEMA_RESPONSE_TICKS, false); expect(model.snapshot(clock.tick).responseDueInSeconds).toBe(0); waiting();
    jump(MYXEDEMA_RESPONSE_TICKS); proceed(); expect(model.snapshot(clock.tick).responseObserved).toBe(true);
    proceed(); render(); render();
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'ventilate', 'hydrocortisone', 'levothyroxine', 'supportive-care', 'call-support', 'reassess', 'reassess', 'handoff',
    ].map((action) => ({ type: 'myxedema-response', payload: { action } })));
    expect(finish).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledTimes(8); expect(clock.state).toBe('paused');
    expect(model.snapshot(clock.tick)).toMatchObject({ ended: 'handoff', durableRecoveryProven: false, ventilationDelayed: false,
      endocrineTreatmentDelayed: false, earlyThyroxineAttempted: false, waitForLabsChosen: false });
    expect(container.textContent).toContain('not recovery or discharge clearance');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('does not act while preparing or after takeover, and finishes an instructor-ended branch once', () => {
    const model = new Myxedema(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: MyxedemaSnapshot) => act(() => root.render(<StrictMode>
      <DemoHarness active={active} running={false} patient={patient} onAction={dispatch} pause={pause} play={play}
        finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    render(true); expect(advance).toBeUndefined(); expect(pause).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
    render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained());
    expect(dispatch).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled();
    model.advance(MYXEDEMA_TAKEOVER_TICKS); render(true, model.snapshot(MYXEDEMA_TAKEOVER_TICKS));
    render(true, model.snapshot(MYXEDEMA_TAKEOVER_TICKS));
    expect(pause).toHaveBeenCalledOnce(); expect(finish).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Instructor takeover ended this branch');
  });
});
