/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RenalHyponatremiaSnapshot } from '@platform/kernel/protocol';
import { RenalHyponatremiaTray } from '../../src/modules/renal-electrolyte/RenalHyponatremiaTray';
import { RenalHyponatremia, RENAL_HYPONATREMIA_RESCUE_TICKS as INITIAL,
  RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS as ADDITIONAL, RENAL_HYPONATREMIA_DELAY_TICKS as DELAY, RENAL_HYPONATREMIA_TAKEOVER_TICKS as TAKEOVER,
  type RenalHyponatremiaAction } from '../../src/modules/renal-electrolyte/hyponatremia';
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyponatremia-symptoms-and-reassessment';
import { renalHyponatremiaInlinePrompt, RENAL_HYPONATREMIA_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hyponatremia-tutor';
import { renalHyponatremiaDemonstrationStep, supportsRenalHyponatremiaDemonstration,
  RENAL_HYPONATREMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hyponatremia-demonstration';
import { useRenalHyponatremiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHyponatremiaDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

const labels: Record<RenalHyponatremiaAction, string> = {
  rescue: 'Request qualified symptom-led rescue', 'call-support': 'Call qualified acute-care and specialist support',
  'review-context': 'Review pretreatment specimens and medication context', monitor: 'Arrange sodium and neurologic surveillance',
  'check-sodium': 'Check sodium only', 'check-neurology': 'Check neurologic symptoms only',
  reassess: 'Reassess sodium, symptoms, and bedside response', 'additional-rescue': 'Request qualified limited additional rescue',
  'evaluate-neurology': 'Arrange neurologic and alternate-cause evaluation', handoff: 'Hand off persistent symptoms and continuing care',
  'normalize-now': 'Normalize sodium now', 'sodium-means-recovered': 'Declare recovery from sodium alone', 'siadh-now': 'Label the cause SIAD now',
};
const initialCare = ['rescue', 'call-support', 'review-context', 'monitor'] as const;
const tutor = (model: RenalHyponatremia, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  renalHyponatremiaInlinePrompt(level, { scenarioVersion: '0.1.0', renalHyponatremia: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RenalHyponatremiaSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRenalHyponatremiaDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Renal hyponatremia symptoms, sodium, and separate observations', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new RenalHyponatremia(); let tick = 0;
    const dispatch = vi.fn((action: RenalHyponatremiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RenalHyponatremiaTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RenalHyponatremiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RenalHyponatremiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }




  it('offers a nine-decision example with a selected symptom pathway and continuing treatment review', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="renal-electrolyte"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('nine-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('not a universal regional rule or a dose prescription');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('offers immediate rescue with stable accepted-control focus and no duplicate request', () => {
    expect(renderToStaticMarkup(<RenalHyponatremiaTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(13);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(tutor(view.model, 0)?.id).toBe('renal-hyponatremia-rescue');
    const button = view.button('rescue'); button.focus(); view.click('rescue');
    expect(view.snapshot()).toMatchObject({ rescueAtTick: 0, supportActive: false, contextReviewedAtTick: null, observation: null });
    expect(view.button('rescue')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('rescue'); expect(view.dispatch).toHaveBeenCalledOnce();
    expect(RENAL_HYPONATREMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRenalHyponatremiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHyponatremiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(renalHyponatremiaInlinePrompt('guided', { scenarioVersion: '0.1.1', renalHyponatremia: initial })).toBeNull();
  });

  it.each(['evaluate-neurology', 'review-context', 'monitor'] as const)('offers %s before rescue without a clinical cure or diagnostic certainty', (first) => {
    const view = patientView(); const vitals = view.model.vitals(); view.click(first);
    expect(view.snapshot()).toMatchObject({ rescueAtTick: null, supportActive: false, observation: null });
    expect(view.model.vitals()).toEqual(vitals); expect(tutor(view.model, 0)?.id).toBe('renal-hyponatremia-rescue');
    if (first === 'review-context') {
      expect(container.textContent).toContain('These specimens precede treatment');
      expect(container.textContent).toContain('the urine results do not establish SIAD');
    }
  });

  it('keeps the full assessment historical after independently requested sodium and neurologic checks', () => {
    const view = patientView(); view.click('reassess'); view.click('rescue'); const first = view.snapshot().observation;
    view.jump(INITIAL); expect(container.textContent).not.toContain('sodium 123 mmol/L');
    view.click('check-sodium'); view.click('check-neurology');
    expect(view.snapshot()).toMatchObject({ observation: first, sodiumObservation: { atTick: INITIAL, sodiumMmolL: 123 },
      neurologicObservation: { atTick: INITIAL, alertness: 'awake but confused', headache: true, nausea: true },
      initialResponseObserved: false });
    expect(container.textContent).toContain('Last requested sodium at simulated 01:00:00: 123 mmol/L (+5 from the original 118)');
    expect(container.textContent).toContain('00:00:00: sodium 118 mmol/L');
    view.click('additional-rescue'); expect(view.snapshot().additionalRescueAtTick).toBeNull();
    view.click('reassess'); view.click('additional-rescue');
    expect(view.snapshot()).toMatchObject({ initialResponseObserved: true, persistentSymptomsObserved: true,
      additionalRescueAtTick: INITIAL, neurologicReviewAtTick: null, supportActive: false });
  });

  it('retains all symptoms after both responses and requires the full later observation before handoff', () => {
    const view = patientView(); for (const action of initialCare) view.click(action);
    view.jump(INITIAL); view.click('reassess'); view.click('additional-rescue'); view.click('evaluate-neurology');
    const previous = view.snapshot().observation;
    view.jump(INITIAL + ADDITIONAL); view.click('check-sodium'); view.click('check-neurology'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ observation: previous, additionalResponseObserved: false, ended: null,
      sodiumObservation: { sodiumMmolL: 124, changeFromBaselineMmolL: 6 },
      neurologicObservation: { alertness: 'awake but confused', headache: true, nausea: true } });
    expect(renalHyponatremiaDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('reassess'); expect(tutor(view.model, INITIAL + ADDITIONAL)?.id).toBe('renal-hyponatremia-handoff');
    view.click('handoff'); expect(view.snapshot()).toMatchObject({ ended: 'handoff', additionalResponseObserved: true,
      observation: { sodiumMmolL: 124, headache: true, nausea: true, alertness: 'awake but confused' } });
    expect(container.textContent).toContain('+6 mmol/L rise is not a clinical stopping rule');
    expect(container.textContent).toContain('no treatment is automatically stopped');
  });

  it('retains refused shortcuts through later appropriate care without requiring an error-free history', () => {
    const view = patientView(); for (const action of ['normalize-now', 'sodium-means-recovered', 'siadh-now'] as const) view.click(action);
    view.jump(DELAY); for (const action of initialCare) view.click(action);
    view.jump(DELAY + INITIAL); view.click('reassess'); view.click('additional-rescue'); view.click('evaluate-neurology');
    view.jump(DELAY + INITIAL + ADDITIONAL); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', sodiumNormalizationAttempted: true,
      numberOnlyRecoveryAttempted: true, siadhLabelAttempted: true, observation: { sodiumMmolL: 124, headache: true, nausea: true } });
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RenalHyponatremiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, unassisted silent, and source links active during a guarded example', () => {
    const model = new RenalHyponatremia(); for (const action of initialCare) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RenalHyponatremiaTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) act(() => button.click());
    const links = [...container.querySelectorAll('a')]; expect(links.map((link) => link.href)).toEqual([RENAL_HYPONATREMIA_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
  });

  it('paces nine decisions and two complete observations with stopped reading time', () => {
    const model = new RenalHyponatremia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('renal-hyponatremia-response'); model.apply(action.payload.action, clock.tick); });
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
    jump(INITIAL - 1); expect(advance).toBeUndefined(); jump(INITIAL); proceed(); proceed(); proceed();
    const old = model.snapshot(INITIAL).observation; expect(advance).toBeUndefined();
    jump(INITIAL + ADDITIONAL - 1); expect(advance).toBeUndefined(); jump(INITIAL + ADDITIONAL);
    expect(model.snapshot(INITIAL + ADDITIONAL).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...initialCare, 'reassess', 'additional-rescue', 'evaluate-neurology', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(9);
    expect(model.snapshot(INITIAL + ADDITIONAL)).toMatchObject({ ended: 'handoff', initialResponseObserved: true,
      additionalResponseObserved: true, durableRecoveryProven: false, observation: { headache: true, nausea: true } });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new RenalHyponatremia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RenalHyponatremiaSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new RenalHyponatremia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, sodiumObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });
});
