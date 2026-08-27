/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, HypocalcemiaSnapshot } from '@platform/kernel/protocol';
import { HypocalcemiaTray } from '../../src/modules/endocrine-metabolic/HypocalcemiaTray';
import { Hypocalcemia, HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS, HYPOCALCEMIA_RESPONSE_TICKS,
  HYPOCALCEMIA_RECURRENCE_TICKS, HYPOCALCEMIA_TAKEOVER_TICKS, type HypocalcemiaAction } from '../../src/modules/endocrine-metabolic/hypocalcemia';
import { HYPOCALCEMIC_TETANY_RESCUE_AND_RECURRENCE as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hypocalcemic-tetany-rescue-and-recurrence';
import { hypocalcemiaInlinePrompt, HYPOCALCEMIA_SOURCE_HREF, HYPOCALCEMIA_ESE_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/tutor/hypocalcemia-guidance';
import { hypocalcemiaDemonstrationStep, supportsHypocalcemiaDemonstration, HYPOCALCEMIA_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/hypocalcemia-demonstration';
import { useHypocalcemiaDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHypocalcemiaDemonstration';

const VERSION = '0.1.0';
const labels: Record<HypocalcemiaAction, string> = {
  'calcium-rescue': 'Start qualified calcium rescue', 'assess-risk': 'Review airway, seizure, and neck risk',
  'call-support': 'Call qualified support', 'oral-only': 'Choose oral treatment alone',
  'wait-for-labs': 'Wait for laboratory results', 'wait-for-magnesium': 'Wait for magnesium before rescue',
  'review-cause': 'Review the supplied cause panel', magnesium: 'Start qualified magnesium correction',
  'continuing-care': 'Arrange continuing calcium and cause care', 'stop-after-relief': 'Stop after symptom relief',
  reassess: 'Reassess calcium and bedside response', handoff: 'Hand off continuing treatment and risk',
};

function DemoHarness(props: {
  active: boolean; running: boolean; patient?: HypocalcemiaSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; finish: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useHypocalcemiaDemonstration({ active: props.active, running: props.running, patient: props.patient,
    act: props.onAction, pause: props.pause, play: props.play, onFinished: props.finish });
  props.capture(demo.onAdvance);
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />
    <HypocalcemiaTray assessment={props.patient} scenarioVersion={VERSION} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('Hypocalcemia rescue and continuing-care experience', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  function patientView() {
    const model = new Hypocalcemia(); let tick = 0;
    const dispatch = vi.fn((action: HypocalcemiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><HypocalcemiaTray assessment={model.snapshot(tick)}
      scenarioVersion={VERSION} guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: HypocalcemiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: HypocalcemiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }


  it('offers a learner-paced 60× example without the unrelated 90-second script', () => {
    const start = vi.fn(); const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="guided" onGuidance={() => {}} onStart={start} onWatch={watch} />));
    expect(container.textContent).toContain('observation periods run at 60× speed');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('the supplied QTc is not calculated by the waveform');
    expect(start).not.toHaveBeenCalled(); expect(watch).not.toHaveBeenCalled();
    const example = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!;
    act(() => example.click()); expect(watch).toHaveBeenCalledOnce(); expect(start).not.toHaveBeenCalled();
  });

  it('keeps the supplied cause panel closed, rescue immediate, and guidance read-only', () => {
    expect(renderToStaticMarkup(<HypocalcemiaTray scenarioVersion={VERSION} onAction={() => {}} />)).toContain('Preparing');
    expect(HYPOCALCEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHypocalcemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsHypocalcemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(hypocalcemiaDemonstrationStep()).toMatchObject({ id: 'preparing' });
    const view = patientView(); const initial = JSON.stringify(view.snapshot()); view.render();
    expect(view.dispatch).not.toHaveBeenCalled(); expect(view.snapshot().calciumAtTick).toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(12);
    expect(container.textContent).toContain('Supplied initial adjusted calcium: 6.6 mg/dL');
    expect(container.textContent).toContain('Supplied QTc: 520 ms');
    expect(container.textContent).not.toMatch(/0.45|PTH\) 4|5.4 mg|0.9 mg/);
    expect(hypocalcemiaInlinePrompt('guided', { scenarioVersion: VERSION, hypocalcemia: view.snapshot() })?.id).toBe('hypocalcemia-rescue');
    expect(hypocalcemiaInlinePrompt('unassisted', { scenarioVersion: VERSION, hypocalcemia: view.snapshot() })).toBeNull();
    expect(hypocalcemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', hypocalcemia: view.snapshot() })).toBeNull();
    expect(JSON.stringify(view.snapshot())).toBe(initial);
    const rescue = view.button('calcium-rescue'); rescue.focus(); view.click('calcium-rescue');
    expect(view.snapshot()).toMatchObject({ calciumAtTick: 0, riskAssessedAtTick: null, causeReviewedAtTick: null, supportActive: false });
    expect(view.button('calcium-rescue')).toBe(rescue); expect(document.activeElement).toBe(rescue);
    expect(rescue.disabled).toBe(false); expect(rescue.getAttribute('aria-disabled')).toBe('true');
    for (const action of ['calcium-rescue', 'oral-only', 'wait-for-labs', 'wait-for-magnesium'] as const) view.click(action);
    expect(view.dispatch).toHaveBeenCalledOnce();
  });

  it('sends every declared choice and preserves refusal, observation, and recurrence history', () => {
    const view = patientView(); const expected: HypocalcemiaAction[] = [];
    const choose = (action: HypocalcemiaAction) => { expected.push(action); view.click(action); };
    choose('magnesium'); choose('continuing-care');
    expect(view.snapshot()).toMatchObject({ magnesiumAtTick: null, continuingCareAtTick: null });
    for (const action of ['oral-only', 'wait-for-labs', 'wait-for-magnesium', 'calcium-rescue', 'assess-risk', 'call-support', 'reassess'] as const) choose(action);
    expect(view.snapshot()).toMatchObject({ oralOnlyChosen: true, waitForLabsChosen: true, waitForMagnesiumChosen: true });
    view.jump(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS);
    expect(container.textContent).toContain('adjusted calcium 6.6 mg/dL');
    choose('reassess'); choose('stop-after-relief'); choose('handoff');
    expect(view.snapshot()).toMatchObject({ calciumResponseObserved: true, responseObserved: false, ended: null, stopAfterReliefAttempted: true });
    expect(view.snapshot().observation?.adjustedCalciumMgDl).toBe(7);
    view.jump(HYPOCALCEMIA_RECURRENCE_TICKS);
    expect(view.snapshot().recurrenceOccurred).toBe(true);
    expect(container.textContent).not.toContain('6.7');
    choose('review-cause');
    expect(container.textContent).toContain('magnesium 0.45 mmol/L');
    expect(container.textContent).toContain('parathyroid hormone (PTH) 4 pg/mL');
    expect(container.textContent).toContain('phosphate 5.4 mg/dL');
    choose('continuing-care'); expect(view.snapshot().magnesiumAtTick).toBeNull(); choose('magnesium');
    view.jump(HYPOCALCEMIA_RECURRENCE_TICKS + HYPOCALCEMIA_RESPONSE_TICKS);
    expect(container.textContent).not.toContain('7.2'); choose('reassess'); choose('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', responseObserved: true, recurrenceOccurred: true, durableRecoveryProven: false });
    expect(container.textContent).toContain('Earlier choices stay in this run');
    expect(container.textContent).toContain('An authored recurrence was recorded');
    expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual(expected);
    expect(new Set(expected)).toEqual(new Set(Object.keys(labels)));
    for (const action of Object.keys(labels) as HypocalcemiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(expected.length);
  });

  it('requests a current assessment and permits handoff when the early observation was missed', () => {
    const model = new Hypocalcemia();
    for (const action of ['calcium-rescue', 'assess-risk', 'review-cause', 'magnesium', 'continuing-care', 'call-support'] as const) model.apply(action, 0);
    model.advance(HYPOCALCEMIA_RESPONSE_TICKS);
    expect(hypocalcemiaDemonstrationStep(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS))).toMatchObject({ id: 'continuing-reassessment', action: 'reassess' });
    model.apply('reassess', HYPOCALCEMIA_RESPONSE_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS)).toMatchObject({ calciumResponseObserved: false, responseObserved: true });
    expect(hypocalcemiaDemonstrationStep(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS))).toMatchObject({ id: 'handoff', action: 'handoff' });
    expect(hypocalcemiaInlinePrompt('guided', { scenarioVersion: VERSION, hypocalcemia: model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS) })?.id).toBe('hypocalcemia-handoff');
    model.apply('handoff', HYPOCALCEMIA_RESPONSE_TICKS);
    expect(model.snapshot(HYPOCALCEMIA_RESPONSE_TICKS).ended).toBe('handoff');
  });

  it('guards every example decision but retains read-only pausing source links', () => {
    const model = new Hypocalcemia(); const dispatch = vi.fn(); const source = vi.fn();
    act(() => root.render(<HypocalcemiaTray assessment={model.snapshot(0)} scenarioVersion={VERSION}
      guidance="guided" demonstrating onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) {
      expect(button.getAttribute('aria-disabled')).toBe('true'); expect(button.disabled).toBe(false); act(() => button.click());
    }
    const links = [...container.querySelectorAll('a')];
    expect(links.map((link) => link.href)).toEqual([HYPOCALCEMIA_SOURCE_HREF, HYPOCALCEMIA_ESE_SOURCE_HREF]);
    for (const link of links) {
      expect(link.rel).toBe('noreferrer'); expect(link.target).toBe('_blank');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(dispatch).not.toHaveBeenCalled();
  });

  it('guides nine explicit decisions with real clock pauses, both waiting boundaries, and a single finish', () => {
    const model = new Hypocalcemia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('hypocalcemia-response'); model.apply(action.payload?.action, clock.tick); });
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
    for (let decision = 0; decision < 6; decision++) proceed();
    expect(model.snapshot(0)).toMatchObject({ calciumAtTick: 0, magnesiumAtTick: 0, continuingCareAtTick: 0, supportActive: true });
    waiting(); clock.pause(); render(); waiting(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS - 1); expect(model.snapshot(clock.tick).calciumDueInSeconds).toBe(1); waiting();
    jump(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS, false); expect(model.snapshot(clock.tick).calciumDueInSeconds).toBe(0); waiting();
    jump(HYPOCALCEMIA_CALCIUM_RESPONSE_TICKS); proceed();
    expect(model.snapshot(clock.tick)).toMatchObject({ calciumResponseObserved: true, responseObserved: false });
    expect(model.snapshot(clock.tick).observation?.adjustedCalciumMgDl).toBe(7);
    waiting(); jump(HYPOCALCEMIA_RESPONSE_TICKS - 1); expect(model.snapshot(clock.tick).responseDueInSeconds).toBe(1); waiting();
    jump(HYPOCALCEMIA_RESPONSE_TICKS, false); expect(model.snapshot(clock.tick).responseDueInSeconds).toBe(0); waiting();
    jump(HYPOCALCEMIA_RESPONSE_TICKS); expect(container.textContent).not.toContain('7.2');
    proceed(); expect(model.snapshot(clock.tick).responseObserved).toBe(true);
    expect(model.snapshot(clock.tick).observation?.adjustedCalciumMgDl).toBe(7.2);
    proceed(); render(); render();
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'calcium-rescue', 'assess-risk', 'review-cause', 'magnesium', 'continuing-care', 'call-support', 'reassess', 'reassess', 'handoff',
    ].map((action) => ({ type: 'hypocalcemia-response', payload: { action } })));
    expect(finish).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledTimes(9); expect(clock.state).toBe('paused');
    expect(model.snapshot(clock.tick)).toMatchObject({ ended: 'handoff', durableRecoveryProven: false, urgentTreatmentDelayed: false,
      recurrenceOccurred: false, oralOnlyChosen: false, waitForLabsChosen: false });
    expect(container.textContent).toContain('not recovery or discharge clearance');
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('guards preparing, takeover, and old callbacks after restart, and finishes an ended branch once', () => {
    const model = new Hypocalcemia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: HypocalcemiaSnapshot) => act(() => root.render(<StrictMode>
      <DemoHarness active={active} running={false} patient={patient} onAction={dispatch} pause={pause} play={play}
        finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    render(true); expect(advance).toBeUndefined(); expect(pause).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
    const preparing = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    expect(preparing.getAttribute('aria-disabled')).toBe('true'); act(() => preparing.click()); expect(play).not.toHaveBeenCalled();
    render(true, model.snapshot(0)); const retained = advance!;
    const before = JSON.stringify(model.snapshot(0)); render(false, model.snapshot(0)); act(() => retained());
    expect(dispatch).not.toHaveBeenCalled(); expect(play).not.toHaveBeenCalled(); expect(JSON.stringify(model.snapshot(0))).toBe(before);
    render(true, new Hypocalcemia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    const current = advance!; act(() => current()); expect(dispatch).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledOnce();
    model.advance(HYPOCALCEMIA_TAKEOVER_TICKS); render(true, model.snapshot(HYPOCALCEMIA_TAKEOVER_TICKS));
    render(true, model.snapshot(HYPOCALCEMIA_TAKEOVER_TICKS));
    expect(pause).toHaveBeenCalledOnce(); expect(finish).toHaveBeenCalledOnce(); expect(dispatch).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Instructor takeover ended this branch');
  });
});
