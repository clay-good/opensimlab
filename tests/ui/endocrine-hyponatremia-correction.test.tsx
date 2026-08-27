/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { crisisResponseAvailability } from '@anesthesia/ui/ActionCockpit';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, HyponatremiaCorrectionSnapshot } from '@platform/kernel/protocol';
import { HyponatremiaCorrectionTray } from '../../src/modules/endocrine-metabolic/HyponatremiaCorrectionTray';
import { HyponatremiaCorrection, HYPONATREMIA_CORRECTION_AQUARESIS_TICKS as AQUARESIS,
  HYPONATREMIA_CORRECTION_OVERCORRECTION_TICKS as BREACH, HYPONATREMIA_CORRECTION_RESPONSE_TICKS as RESPONSE,
  HYPONATREMIA_CORRECTION_TAKEOVER_TICKS as TAKEOVER,
  type HyponatremiaCorrectionAction } from '../../src/modules/endocrine-metabolic/hyponatremia-correction';
import { HYPONATREMIA_AQUARESIS_AND_OVERCORRECTION as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/hyponatremia-aquaresis-and-overcorrection';
import { hyponatremiaCorrectionInlinePrompt, HYPONATREMIA_CORRECTION_SOURCE_HREF,
  HYPONATREMIA_CORRECTION_LIMITS_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/hyponatremia-correction-tutor';
import { hyponatremiaCorrectionDemonstrationStep, supportsHyponatremiaCorrectionDemonstration,
  HYPONATREMIA_CORRECTION_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/hyponatremia-correction-demonstration';
import { useHyponatremiaCorrectionDemonstration } from '../../src/modules/endocrine-metabolic/demo/useHyponatremiaCorrectionDemonstration';

const VERSION = '0.1.0';
const labels: Record<HyponatremiaCorrectionAction, string> = {
  'review-risk': 'Review correction window and risk', 'call-support': 'Call qualified support',
  monitor: 'Arrange serial sodium and urine checks', reassess: 'Reassess sodium and urine output',
  'control-water-loss': 'Request qualified water-loss management', relower: 'Request expert-directed relowering',
  handoff: 'Hand off correction history and continuing care', 'normalize-now': 'Aim for normal sodium now',
  'wait-for-symptoms': 'Wait for new symptoms',
};
const step = (model: HyponatremiaCorrection, tick: number) => hyponatremiaCorrectionDemonstrationStep(model.snapshot(tick));
const tutor = (model: HyponatremiaCorrection, tick: number) => hyponatremiaCorrectionInlinePrompt('guided', {
  scenarioVersion: VERSION, hyponatremiaCorrection: model.snapshot(tick),
});

function DemoHarness(props: {
  active: boolean; running: boolean; patient?: HyponatremiaCorrectionSnapshot;
  onAction: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; finish: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useHyponatremiaCorrectionDemonstration({ active: props.active, running: props.running, patient: props.patient,
    act: props.onAction, pause: props.pause, play: props.play, onFinished: props.finish });
  props.capture(demo.onAdvance);
  return <><DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />
    <HyponatremiaCorrectionTray assessment={props.patient} scenarioVersion={VERSION} demonstrating={props.active} onAction={() => {}} /></>;
}

describe('Post-rescue sodium correction experience', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new HyponatremiaCorrection(); let tick = 0;
    const dispatch = vi.fn((action: HyponatremiaCorrectionAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><HyponatremiaCorrectionTray assessment={model.snapshot(tick)}
      scenarioVersion={VERSION} guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: HyponatremiaCorrectionAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: HyponatremiaCorrectionAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }

  it('offers the focused correction tray and a learner-paced worked example', () => {
    const start = vi.fn(); const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="guided" onGuidance={() => {}} onStart={start} onWatch={watch} />));
    expect(container.textContent).toContain('observation periods run at 60× speed');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('Original baseline and observed peak stay in the record');
    expect(container.textContent).not.toContain('90-second');
    const example = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!;
    act(() => example.click()); expect(watch).toHaveBeenCalledOnce(); expect(start).not.toHaveBeenCalled();
    expect(crisisResponseAvailability(SCENARIO)).toMatchObject({ hasHyponatremiaCorrectionResponse: true, hasSevereHyponatremiaResponse: false });
  });

  it('keeps the original baseline and supplied first hour without leaking new results', () => {
    expect(renderToStaticMarkup(<HyponatremiaCorrectionTray scenarioVersion={VERSION} onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); const before = JSON.stringify(view.snapshot()); view.render();
    expect(view.dispatch).not.toHaveBeenCalled(); expect(JSON.stringify(view.snapshot())).toBe(before);
    expect(container.querySelectorAll('button')).toHaveLength(9);
    expect(container.textContent).toContain('Original sodium: 106 mmol/L');
    expect(container.textContent).toContain('111 mmol/L after one hour, a rise of 5');
    expect(container.textContent).toContain('the window does not restart');
    view.jump(BREACH);
    expect(container.textContent).not.toMatch(/115|116|350|excessive rise was observed/);
    expect(container.textContent).toContain('Highest supplied or requested sodium: 111 mmol/L');
    expect(view.snapshot()).toMatchObject({ observation: null, overcorrectionObserved: false });
    view.click('control-water-loss'); view.click('relower');
    expect(view.snapshot()).toMatchObject({ waterLossControlAtTick: null, reloweringAtTick: null });
    expect(container.textContent).not.toMatch(/115|116|350/);
    view.click('reassess');
    expect(container.textContent).toContain('sodium 115 mmol/L, total rise 9 mmol/L');
    expect(container.textContent).toContain('urine output 350 mL/hour');
    expect(container.textContent).toContain('120 min after the original sodium');
  });

  it('versions read-only guidance and leaves coached waits and unassisted practice quiet', () => {
    const model = new HyponatremiaCorrection(); const patient = model.snapshot(0);
    expect(HYPONATREMIA_CORRECTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHyponatremiaCorrectionDemonstration(SCENARIO)).toBe(true);
    expect(supportsHyponatremiaCorrectionDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(hyponatremiaCorrectionDemonstrationStep()).toMatchObject({ id: 'preparing' });
    expect(tutor(model, 0)?.id).toBe('sodium-correction-risk');
    expect(hyponatremiaCorrectionInlinePrompt('unassisted', { scenarioVersion: VERSION, hyponatremiaCorrection: patient })).toBeNull();
    expect(hyponatremiaCorrectionInlinePrompt('guided', { scenarioVersion: '0.1.1', hyponatremiaCorrection: patient })).toBeNull();
    for (const action of ['review-risk', 'call-support', 'monitor'] as const) model.apply(action, 0);
    expect(hyponatremiaCorrectionInlinePrompt('coached', { scenarioVersion: VERSION, hyponatremiaCorrection: model.snapshot(0) })).toBeNull();
    expect(step(model, 0)).toMatchObject({ id: 'observation' });
    model.advance(BREACH);
    expect(step(model, BREACH)).toMatchObject({ id: 'reassessment', action: 'reassess' });
    expect(JSON.stringify(tutor(model, BREACH))).not.toMatch(/115|116|350|exceeded/);
  });

  it.each(['control-water-loss', 'relower'] as const)('permits observed rescue beginning with %s before administrative review', (first) => {
    const view = patientView(); view.jump(BREACH); view.click('reassess');
    expect(step(view.model, BREACH).action).toBe('control-water-loss');
    expect(tutor(view.model, BREACH)?.id).toBe('sodium-correction-control');
    view.click(first); const second = first === 'relower' ? 'control-water-loss' : 'relower';
    expect(step(view.model, BREACH).action).toBe(second); view.click(second);
    expect(view.snapshot()).toMatchObject({ waterLossControlAtTick: BREACH, reloweringAtTick: BREACH,
      riskReviewedAtTick: null, supportActive: false, monitoringAtTick: null });
    expect(container.textContent).toContain('sodium 115 mmol/L');
    for (const action of ['review-risk', 'call-support', 'monitor'] as const) view.click(action);
    view.jump(BREACH + RESPONSE); expect(container.textContent).toContain('sodium 115 mmol/L');
    view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', responseObserved: true, peakObservedSodiumMmolL: 115 });
    expect(container.textContent).toContain('sodium 112 mmol/L, total rise 6 mmol/L');
    expect(container.textContent).toContain('Highest supplied or requested sodium: 115 mmol/L');
    expect(container.textContent).toContain('not recovery or discharge clearance');
  });

  it('requests fresh findings when control follows a stale early observation', () => {
    const model = new HyponatremiaCorrection();
    for (const action of ['review-risk', 'call-support', 'monitor'] as const) model.apply(action, 0);
    model.apply('reassess', AQUARESIS); model.apply('control-water-loss', BREACH);
    expect(model.snapshot(BREACH)).toMatchObject({ overcorrectionObserved: false, peakObservedSodiumMmolL: 112 });
    expect(step(model, BREACH)).toMatchObject({ id: 'response-observation' });
    expect(tutor(model, BREACH)?.id).toBe('sodium-correction-observe-response');
    expect(step(model, BREACH).narration).not.toMatch(/115|exceeded/);
    model.advance(BREACH + RESPONSE);
    expect(step(model, BREACH + RESPONSE)).toMatchObject({ id: 'response-reassessment', action: 'reassess' });
    expect(tutor(model, BREACH + RESPONSE)?.id).toBe('sodium-correction-reassess-response');
    model.apply('reassess', BREACH + RESPONSE);
    expect(step(model, BREACH + RESPONSE)).toMatchObject({ id: 'relower', action: 'relower' });
  });

  it('retains error choices, stabilizes accepted controls, and guards ended actions', () => {
    const view = patientView(); const chosen: HyponatremiaCorrectionAction[] = [];
    const choose = (action: HyponatremiaCorrectionAction) => { chosen.push(action); view.click(action); };
    choose('normalize-now'); choose('wait-for-symptoms'); choose('relower'); choose('handoff');
    choose('review-risk'); choose('call-support'); choose('monitor');
    view.jump(AQUARESIS); choose('reassess');
    const control = view.button('control-water-loss'); control.focus(); choose('control-water-loss');
    expect(view.button('control-water-loss')).toBe(control); expect(document.activeElement).toBe(control);
    expect(control.disabled).toBe(false); expect(control.getAttribute('aria-disabled')).toBe('true');
    view.click('control-water-loss'); expect(view.dispatch).toHaveBeenCalledTimes(chosen.length);
    view.jump(AQUARESIS + RESPONSE); choose('reassess'); choose('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', reloweringAtTick: null, overcorrectionObserved: false,
      normalizationAttempted: true, symptomWaitChosen: true });
    expect(container.textContent).toContain('Earlier choices stay in this run');
    expect(new Set(chosen)).toEqual(new Set(Object.keys(labels)));
    for (const action of Object.keys(labels) as HyponatremiaCorrectionAction[]) view.click(action);
    expect(view.dispatch.mock.calls.map(([action]) => action)).toEqual(chosen);
  });

  it('guards example controls while retaining source links that pause through their callback', () => {
    const model = new HyponatremiaCorrection(); const dispatch = vi.fn(); const source = vi.fn();
    act(() => root.render(<HyponatremiaCorrectionTray assessment={model.snapshot(0)} scenarioVersion={VERSION}
      guidance="guided" demonstrating onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) {
      expect(button.getAttribute('aria-disabled')).toBe('true'); expect(button.disabled).toBe(false); act(() => button.click());
    }
    const links = [...container.querySelectorAll('a')];
    expect(links.map((link) => link.href)).toEqual([HYPONATREMIA_CORRECTION_SOURCE_HREF, HYPONATREMIA_CORRECTION_LIMITS_SOURCE_HREF]);
    for (const link of links) {
      expect(link.rel).toBe('noreferrer'); expect(link.target).toBe('_blank');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces all seven expert decisions with real clock pauses and both observation boundaries', () => {
    const model = new HyponatremiaCorrection(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('hyponatremia-correction-response'); model.apply(action.payload?.action, clock.tick); });
    const render = (patient = model.snapshot(clock.tick)) => act(() => root.render(<StrictMode>
      <DemoHarness active running={clock.state === 'running'} patient={patient} onAction={dispatch}
        pause={pause} play={play} finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    const next = () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Continue example')!;
    const proceed = () => {
      const count = dispatch.mock.calls.length; const snapshot = model.snapshot(clock.tick); const callback = advance!;
      expect(next().getAttribute('aria-disabled')).toBe('false'); expect(clock.state).toBe('paused');
      for (let read = 0; read < 3; read++) { expect(clock.ticksFor(60_000)).toBe(0); render(); }
      expect(dispatch.mock.calls.length).toBe(count);
      const focused = next(); focused.focus();
      act(() => { next().click(); next().click(); callback(); });
      expect(dispatch.mock.calls.length).toBe(count + 1); expect(clock.state).toBe('running');
      const pauses = pause.mock.calls.length; render(snapshot); act(() => { next().click(); callback(); });
      expect(dispatch.mock.calls.length).toBe(count + 1); expect(pause.mock.calls.length).toBe(pauses);
      expect(next()).toBe(focused); expect(document.activeElement).toBe(focused); render();
    };
    const waiting = () => {
      const calls = dispatch.mock.calls.length; const pauses = pause.mock.calls.length; const plays = play.mock.calls.length;
      expect(next().getAttribute('aria-disabled')).toBe('true');
      render(); act(() => next().click());
      expect(dispatch.mock.calls.length).toBe(calls); expect(pause.mock.calls.length).toBe(pauses); expect(play.mock.calls.length).toBe(plays);
    };
    const jump = (tick: number, accepted = true) => { clock.restore(tick); clock.play(); if (accepted) model.advance(tick); render(); };
    render(); expect(dispatch).not.toHaveBeenCalled();
    for (let decision = 0; decision < 3; decision++) proceed();
    waiting(); clock.pause(); render(); waiting(); expect(clock.ticksFor(60_000)).toBe(0);
    jump(AQUARESIS - 1); expect(model.snapshot(clock.tick).aquaresisDueInSeconds).toBe(1); waiting();
    jump(AQUARESIS, false); expect(model.snapshot(clock.tick).aquaresisDueInSeconds).toBe(0); waiting();
    jump(AQUARESIS); expect(container.textContent).not.toMatch(/112|350/); proceed(); proceed();
    expect(model.snapshot(clock.tick)).toMatchObject({ waterLossControlAtTick: AQUARESIS, reloweringAtTick: null });
    waiting(); jump(AQUARESIS + RESPONSE - 1); expect(model.snapshot(clock.tick).responseDueInSeconds).toBe(1); waiting();
    expect(model.snapshot(AQUARESIS + RESPONSE).responseDueInSeconds).toBeNull();
    expect(step(model, AQUARESIS + RESPONSE).action).toBe('reassess');
    jump(AQUARESIS + RESPONSE); expect(container.textContent).toContain('urine output 350 mL/hour');
    proceed(); expect(container.textContent).toContain('urine output 100 mL/hour'); proceed(); render(); render();
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      'review-risk', 'call-support', 'monitor', 'reassess', 'control-water-loss', 'reassess', 'handoff',
    ].map((action) => ({ type: 'hyponatremia-correction-response', payload: { action } })));
    expect(finish).toHaveBeenCalledOnce(); expect(play).toHaveBeenCalledTimes(7); expect(clock.state).toBe('paused');
    expect(model.snapshot(clock.tick)).toMatchObject({ ended: 'handoff', durableRecoveryProven: false,
      overcorrectionObserved: false, peakObservedSodiumMmolL: 112 });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('guards preparing, stale callbacks after takeover, and an unobserved terminal sodium', () => {
    const model = new HyponatremiaCorrection(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: HyponatremiaCorrectionSnapshot) => act(() => root.render(<StrictMode>
      <DemoHarness active={active} running={false} patient={patient} onAction={dispatch} pause={pause} play={play}
        finish={finish} capture={(callback) => { advance = callback; }} />
    </StrictMode>));
    render(true); expect(advance).toBeUndefined(); expect(dispatch).not.toHaveBeenCalled();
    render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new HyponatremiaCorrection().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(pause).toHaveBeenCalledOnce(); expect(finish).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('Instructor takeover ended this branch');
    expect(container.textContent).not.toMatch(/116|115|350/);
    expect(tutor(model, TAKEOVER)).toBeNull();
  });
});
