/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, PerioperativeDiabetesSnapshot } from '@platform/kernel/protocol';
import { PerioperativeDiabetesTray } from '../../src/modules/endocrine-metabolic/PerioperativeDiabetesTray';
import { PerioperativeDiabetes, PERIOPERATIVE_DIABETES_EARLY_TICKS as EARLY,
  PERIOPERATIVE_DIABETES_RESPONSE_TICKS as RESPONSE, PERIOPERATIVE_DIABETES_DELAY_TICKS as DELAY,
  PERIOPERATIVE_DIABETES_WORSENING_TICKS as WORSENING, PERIOPERATIVE_DIABETES_TAKEOVER_TICKS as TAKEOVER,
  type PerioperativeDiabetesAction } from '../../src/modules/endocrine-metabolic/perioperative-diabetes';
import { PERIOPERATIVE_DIABETES_INSULIN_CONTINUITY as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/perioperative-diabetes-insulin-continuity';
import { perioperativeDiabetesInlinePrompt, PERIOPERATIVE_DIABETES_SOURCE_HREF, PERIOPERATIVE_DIABETES_UK_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/perioperative-diabetes-tutor';
import { perioperativeDiabetesDemonstrationStep, supportsPerioperativeDiabetesDemonstration,
  PERIOPERATIVE_DIABETES_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/perioperative-diabetes-demonstration';
import { usePerioperativeDiabetesDemonstration } from '../../src/modules/endocrine-metabolic/demo/usePerioperativeDiabetesDemonstration';

const labels: Record<PerioperativeDiabetesAction, string> = {
  'restore-insulin': 'Restore qualified insulin delivery', 'call-support': 'Call qualified perioperative support',
  'review-context': 'Review insulin and fasting context', 'plan-fasting': 'Plan individualized fasting care',
  monitor: 'Arrange blood-glucose and ketone surveillance', 'check-glucose': 'Check blood glucose only',
  reassess: 'Reassess glucose, ketones, and bedside response', handoff: 'Hand off insulin continuity and perioperative care',
  'omit-insulin': 'Omit insulin while fasting', 'cgm-only': 'Rely on CGM alone', 'clear-surgery': 'Clear surgery automatically',
};
const care = ['restore-insulin', 'call-support', 'review-context', 'plan-fasting', 'monitor'] as const;
const tutor = (model: PerioperativeDiabetes, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  perioperativeDiabetesInlinePrompt(level, { scenarioVersion: '0.1.0', perioperativeDiabetes: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: PerioperativeDiabetesSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = usePerioperativeDiabetesDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Perioperative insulin continuity and separate observation streams', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new PerioperativeDiabetes(); let tick = 0;
    const dispatch = vi.fn((action: PerioperativeDiabetesAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><PerioperativeDiabetesTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: PerioperativeDiabetesAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: PerioperativeDiabetesAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }

  it('offers an eight-decision worked example without fixed routes or a generic induction script', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('eight-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('no fixed insulin route, dose, or glucose infusion');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('offers immediate verified insulin delivery and preserves accepted-control focus without duplicate actions', () => {
    expect(renderToStaticMarkup(<PerioperativeDiabetesTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(11);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Supplied glucose: 180 mg/dL; blood ketones: 0.6 mmol/L');
    expect(tutor(view.model, 0)?.id).toBe('perioperative-diabetes-insulin');
    const button = view.button('restore-insulin'); button.focus(); view.click('restore-insulin');
    expect(view.snapshot()).toMatchObject({ insulinAtTick: 0, fastingPlanAtTick: null, supportActive: false, observation: null });
    expect(view.button('restore-insulin')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('restore-insulin'); expect(view.dispatch).toHaveBeenCalledOnce();
    expect(PERIOPERATIVE_DIABETES_DEMONSTRATION_VERSION).toBe('0.1.0'); expect(supportsPerioperativeDiabetesDemonstration(SCENARIO)).toBe(true);
    expect(supportsPerioperativeDiabetesDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(perioperativeDiabetesInlinePrompt('guided', { scenarioVersion: '0.1.1', perioperativeDiabetes: initial })).toBeNull();
  });

  it.each(['plan-fasting', 'monitor'] as const)('accepts %s independently without implying that planning restores delivery', (first) => {
    const view = patientView(); view.click(first);
    expect(view.snapshot()).toMatchObject({ insulinAtTick: null, observation: null, glucoseObservation: null });
    expect(tutor(view.model, 0)?.id).toBe('perioperative-diabetes-insulin');
    view.jump(DELAY); view.click('reassess');
    expect(view.snapshot().observation).toMatchObject({ glucoseMgDl: 240, ketonesMmolL: 1.2 });
  });

  it('shows newer glucose without refreshing old ketones or revealing unrequested deterioration', () => {
    const view = patientView(); view.click('reassess'); const first = view.snapshot().observation;
    view.jump(DELAY); expect(container.textContent).not.toMatch(/240 mg\/dL|1.2 mmol\/L/);
    view.click('check-glucose');
    expect(view.snapshot()).toMatchObject({ glucoseObservation: { atTick: DELAY, glucoseMgDl: 240 },
      observation: first, deteriorationObserved: false, earlyResponseObserved: false });
    expect(container.textContent).toContain('Last requested blood glucose at simulated 00:30:00: 240 mg/dL');
    expect(container.textContent).toContain('Last requested full assessment at simulated 00:00:00: glucose 180 mg/dL, blood ketones 0.6 mmol/L');
    expect(container.textContent).not.toContain('1.2 mmol/L'); view.click('reassess');
    expect(view.snapshot().deteriorationObserved).toBe(true); view.jump(WORSENING); view.click('check-glucose');
    expect(container.textContent).toContain('00:30:00: glucose 240 mg/dL, blood ketones 1.2 mmol/L');
    expect(container.textContent).toContain('01:00:00: 280 mg/dL'); expect(container.textContent).not.toContain('2.0 mmol/L');
  });

  it('requires a fresh full later response even when a glucose-only check has improved, without requiring an earlier assessment', () => {
    const view = patientView(); for (const action of care) view.click(action);
    view.jump(RESPONSE); view.click('check-glucose');
    expect(view.snapshot()).toMatchObject({ glucoseObservation: { glucoseMgDl: 144 }, observation: null, responseObserved: false });
    view.click('handoff'); expect(view.snapshot().ended).toBeNull();
    expect(perioperativeDiabetesDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('reassess');
    expect(view.snapshot()).toMatchObject({ earlyResponseObserved: false, responseObserved: true, observation: { glucoseMgDl: 144, ketonesMmolL: 0.3 } });
    expect(perioperativeDiabetesDemonstrationStep(view.snapshot())).toMatchObject({ id: 'handoff', action: 'handoff' });
    expect(tutor(view.model, RESPONSE)?.id).toBe('perioperative-diabetes-handoff');
    view.click('handoff'); expect(view.snapshot().ended).toBe('handoff');
  });

  it('retains three refused shortcuts and observed deterioration after later recovery without granting clearance', () => {
    const view = patientView(); for (const action of ['omit-insulin', 'cgm-only', 'clear-surgery'] as const) view.click(action);
    view.jump(WORSENING); view.click('reassess'); for (const action of care) view.click(action);
    view.jump(WORSENING + RESPONSE); expect(container.textContent).not.toContain('blood ketones 0.4 mmol/L');
    view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', deteriorationObserved: true,
      omitInsulinAttempted: true, cgmOnlyAttempted: true, clearanceAttempted: true,
      observation: { glucoseMgDl: 162, ketonesMmolL: 0.4 } });
    expect(container.textContent).toContain('Earlier choices stay in this run');
    expect(container.textContent).toContain('not surgical clearance or durable safety');
    expect(container.textContent).toContain('Later care does not erase that observation');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as PerioperativeDiabetesAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, unassisted silent, and source links active during a guarded example', () => {
    const model = new PerioperativeDiabetes(); for (const action of care) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<PerioperativeDiabetesTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) { expect(button.disabled).toBe(false); act(() => button.click()); }
    const links = [...container.querySelectorAll('a')]; expect(links.map((link) => link.href)).toEqual([PERIOPERATIVE_DIABETES_SOURCE_HREF, PERIOPERATIVE_DIABETES_UK_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces eight ordinary decisions and two full observations with stopped reading time', () => {
    const model = new PerioperativeDiabetes(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('perioperative-diabetes-response'); model.apply(action.payload.action, clock.tick); });
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
    render(); for (let index = 0; index < 5; index++) proceed();
    expect(advance).toBeUndefined(); clock.pause(); render(); expect(clock.ticksFor(60_000)).toBe(0); expect(play).toHaveBeenCalledTimes(5);
    jump(EARLY - 1); expect(advance).toBeUndefined(); jump(EARLY); proceed();
    const old = model.snapshot(EARLY).observation; expect(advance).toBeUndefined();
    jump(RESPONSE - 1); expect(advance).toBeUndefined(); jump(RESPONSE); expect(model.snapshot(RESPONSE).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...care, 'reassess', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(8);
    expect(model.snapshot(RESPONSE)).toMatchObject({ ended: 'handoff', earlyResponseObserved: true, responseObserved: true, durableRecoveryProven: false });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new PerioperativeDiabetes(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: PerioperativeDiabetesSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new PerioperativeDiabetes().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, glucoseObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });
});
