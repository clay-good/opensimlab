/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RenalHypermagnesemiaSnapshot } from '@platform/kernel/protocol';
import { RenalHypermagnesemiaTray } from '../../src/modules/renal-electrolyte/RenalHypermagnesemiaTray';
import { RenalHypermagnesemia, RENAL_HYPERMAGNESEMIA_CALCIUM_TICKS as CALCIUM,
  RENAL_HYPERMAGNESEMIA_REMOVAL_TICKS as REMOVAL, RENAL_HYPERMAGNESEMIA_DELAY_TICKS as DELAY, RENAL_HYPERMAGNESEMIA_TAKEOVER_TICKS as TAKEOVER,
  type RenalHypermagnesemiaAction } from '../../src/modules/renal-electrolyte/hypermagnesemia';
import { RENAL_HYPERMAGNESEMIA_ANTAGONISM_AND_REMOVAL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypermagnesemia-antagonism-and-removal';
import { renalHypermagnesemiaInlinePrompt, RENAL_HYPERMAGNESEMIA_SOURCE_HREF } from '../../src/modules/renal-electrolyte/renal-hypermagnesemia-tutor';
import { renalHypermagnesemiaDemonstrationStep, supportsRenalHypermagnesemiaDemonstration,
  RENAL_HYPERMAGNESEMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hypermagnesemia-demonstration';
import { useRenalHypermagnesemiaDemonstration } from '../../src/modules/renal-electrolyte/demo/useRenalHypermagnesemiaDemonstration';

const labels: Record<RenalHypermagnesemiaAction, string> = {
  'support-breathing': 'Start qualified breathing support', calcium: 'Request qualified calcium antagonism',
  'deliver-removal': 'Deliver qualified magnesium-removal care', 'stop-magnesium': 'Stop further magnesium exposure',
  'call-support': 'Call qualified acute-care and renal support', 'review-context': 'Review magnesium exposure and renal context',
  monitor: 'Arrange magnesium and bedside surveillance', 'check-magnesium': 'Check magnesium only',
  'check-neuromuscular': 'Check neuromuscular findings only', reassess: 'Reassess magnesium, neuromuscular, and bedside response',
  handoff: 'Hand off supported breathing and magnesium care', 'calcium-means-clearance': 'Declare magnesium cleared after calcium',
  'routine-diuresis': 'Start routine fluid loading and diuresis',
};
const initialCare = ['support-breathing', 'calcium', 'deliver-removal', 'stop-magnesium', 'call-support', 'review-context', 'monitor'] as const;
const tutor = (model: RenalHypermagnesemia, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  renalHypermagnesemiaInlinePrompt(level, { scenarioVersion: '0.1.0', renalHypermagnesemia: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RenalHypermagnesemiaSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRenalHypermagnesemiaDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Renal hypermagnesemia symptoms, sodium, and separate observations', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new RenalHypermagnesemia(); let tick = 0;
    const dispatch = vi.fn((action: RenalHypermagnesemiaAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RenalHypermagnesemiaTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RenalHypermagnesemiaAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RenalHypermagnesemiaAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }
  it('offers twelve reading-paused decisions with clinically reviewed repeat antagonism', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} region={UNITED_STATES} environment="renal-electrolyte"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('twelve-decision'); expect(container.textContent).not.toContain('90-second');
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('never automatic redosing');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('keeps accepted breathing support focused and calcium available for qualified repeat review', () => {
    expect(renderToStaticMarkup(<RenalHypermagnesemiaTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(13);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(tutor(view.model, 0)?.id).toBe('renal-hypermagnesemia-breathing');
    const button = view.button('support-breathing'); button.focus(); view.click('support-breathing');
    expect(view.snapshot()).toMatchObject({ breathingAtTick: 0, calciumAtTick: null, observation: null });
    expect(view.button('support-breathing')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('support-breathing'); expect(view.dispatch).toHaveBeenCalledOnce();
    view.click('calcium'); view.click('calcium'); expect(view.snapshot().calciumRequests).toBe(1);
    expect(view.button('calcium').getAttribute('aria-disabled')).toBe('false');
    view.jump(1); view.click('calcium'); expect(view.snapshot()).toMatchObject({ calciumRequests: 2, lastCalciumAtTick: 1 });
    expect(RENAL_HYPERMAGNESEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRenalHypermagnesemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHypermagnesemiaDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(renalHypermagnesemiaInlinePrompt('guided', { scenarioVersion: '0.1.1', renalHypermagnesemia: initial })).toBeNull();
  });

  it.each(['stop-magnesium', 'review-context', 'monitor'] as const)('offers %s without inferring clearance or gating urgent care', (first) => {
    const view = patientView(); const vitals = view.model.vitals(); view.click(first);
    expect(view.snapshot()).toMatchObject({ breathingAtTick: null, calciumAtTick: null, observation: null });
    expect(view.model.vitals()).toEqual(vitals); expect(tutor(view.model, 0)?.id).toBe('renal-hypermagnesemia-breathing');
    if (first === 'review-context') expect(container.textContent).toContain('does not establish bowel obstruction, new renal clearance, or acute kidney injury');
  });

  it('keeps calcium, removal, and respiratory support physiologically distinct and independently available', () => {
    const view = patientView(); view.click('calcium'); view.click('reassess');
    expect(view.snapshot()).toMatchObject({ breathingAtTick: null, removalAtTick: null,
      observation: { magnesiumMmolL: 4.6, reflexesPresent: false, severeWeakness: true, heartRateBpm: 62, respiratoryRateBpm: 8 } });
    view.click('deliver-removal'); view.jump(REMOVAL); view.click('reassess');
    expect(view.snapshot()).toMatchObject({ supportActive: false, contextReviewedAtTick: null, breathingAtTick: null,
      observation: { magnesiumMmolL: 2.4, reflexesPresent: true, severeWeakness: false, respiratoryRateBpm: 10, spo2Percent: 92 } });
    view.click('support-breathing'); view.click('reassess');
    expect(view.snapshot().observation).toMatchObject({ magnesiumMmolL: 2.4, respiratoryRateBpm: 14, spo2Percent: 96 });
    expect(container.textContent).toContain('displayed respiratory rate is supported');
  });

  it('keeps a full assessment historical after separate magnesium and neuromuscular checks', () => {
    const view = patientView(); view.click('reassess'); const first = view.snapshot().observation; view.click('deliver-removal');
    view.jump(REMOVAL); expect(container.textContent).not.toContain('magnesium 2.4 mmol/L');
    view.click('check-neuromuscular'); view.jump(REMOVAL + 10); view.click('check-magnesium');
    expect(view.snapshot()).toMatchObject({ observation: first, removalResponseObserved: false,
      magnesiumObservation: { atTick: REMOVAL + 10, magnesiumMmolL: 2.4 },
      neuromuscularObservation: { atTick: REMOVAL, reflexesPresent: true, severeWeakness: false } });
    expect(container.textContent).toContain('01:00:01: 2.4 mmol/L');
    expect(container.textContent).toContain('01:00:00: reflexes present; residual weakness persists');
    expect(container.textContent).toContain('00:00:00: magnesium 4.6 mmol/L');
  });

  it('requires current full recurrence findings but permits handoff with removal still pending', () => {
    const view = patientView(); for (const action of initialCare) view.click(action);
    view.jump(DELAY); view.click('reassess'); const previous = view.snapshot().observation;
    view.jump(CALCIUM); view.click('check-magnesium'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: null, observation: previous, recurrenceObserved: false, magnesiumObservation: { magnesiumMmolL: 4.6 } });
    expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('reassess');
    expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).action).toBe('calcium');
    view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', recurrenceObserved: true, removalResponseObserved: false,
      observation: { magnesiumMmolL: 4.6, heartRateBpm: 44, respiratoryRateBpm: 14 } });
    expect(container.textContent).toContain('not a new magnesium rise');
  });

  it('does not add unnecessary calcium after removal and refreshes a full assessment after late breathing support', () => {
    const view = patientView(); for (const action of initialCare.filter((action) => action !== 'calcium' && action !== 'support-breathing')) view.click(action);
    view.jump(REMOVAL); view.click('reassess'); const old = view.snapshot().observation;
    expect(view.snapshot()).toMatchObject({ calciumAtTick: null, removalResponseObserved: true, calciumResponseObserved: false });
    view.jump(REMOVAL + 1); view.click('support-breathing');
    expect(view.snapshot().observation).toEqual(old);
    expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('handoff'); expect(view.snapshot().ended).toBeNull();
    view.click('reassess'); expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).action).toBe('handoff');
    view.click('handoff'); expect(view.snapshot()).toMatchObject({ ended: 'handoff', calciumRequests: 0 });
  });

  it('skips a missed early phase and uses distinct recurrence and repeat decision identities', () => {
    const view = patientView(); for (const action of initialCare) view.click(action);
    view.jump(CALCIUM); const before = renalHypermagnesemiaDemonstrationStep(view.snapshot());
    expect(before.id).toBe('recurrence-reassessment-0'); view.click('reassess');
    expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).id).toBe('repeat-calcium-0');
    view.click('calcium'); expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).id).toBe(`calcium-observation-${CALCIUM}`);
    view.jump(REMOVAL); expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).action).toBe('reassess');
    view.click('reassess'); expect(renalHypermagnesemiaDemonstrationStep(view.snapshot()).action).toBe('handoff');
    expect(view.snapshot()).toMatchObject({ calciumResponseObserved: false, recurrenceObserved: true, removalResponseObserved: true });
  });

  it('retains refused shortcuts through appropriate later treatment without an error-free-history gate', () => {
    const view = patientView(); view.click('calcium-means-clearance'); view.click('routine-diuresis');
    view.jump(DELAY); for (const action of initialCare) view.click(action);
    view.jump(DELAY + REMOVAL); view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', calciumClearanceAttempted: true, routineDiuresisAttempted: true,
      observation: { magnesiumMmolL: 2.4, severeWeakness: false, respiratoryRateBpm: 14 } });
    expect(container.textContent).toContain('Earlier refused choices stay in this run');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RenalHypermagnesemiaAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, unassisted silent, and the case-series link active in a guarded example', () => {
    const model = new RenalHypermagnesemia(); for (const action of initialCare) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RenalHypermagnesemiaTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) act(() => button.click());
    const link = container.querySelector('a')!; expect(link.href).toBe(RENAL_HYPERMAGNESEMIA_SOURCE_HREF);
    expect(link.textContent).toBe('2018 emergency-dialysis case series'); expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
    link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    expect(source).toHaveBeenCalledOnce(); expect(dispatch).not.toHaveBeenCalled();
  });
  it('paces twelve decisions and two complete observations with stopped reading time', () => {
    const model = new RenalHypermagnesemia(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('renal-hypermagnesemia-response'); model.apply(action.payload.action, clock.tick); });
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
    jump(DELAY - 1); expect(advance).toBeUndefined(); jump(DELAY); proceed();
    jump(CALCIUM - 1); expect(advance).toBeUndefined(); jump(CALCIUM); proceed(); proceed();
    const old = model.snapshot(DELAY).observation; expect(advance).toBeUndefined();
    jump(REMOVAL - 1); expect(advance).toBeUndefined(); jump(REMOVAL);
    expect(model.snapshot(REMOVAL).observation).toEqual(old);
    proceed(); proceed(); render();
    expect(dispatch.mock.calls.map(([action]) => action.payload.action)).toEqual([...initialCare, 'reassess', 'reassess', 'calcium', 'reassess', 'handoff']);
    expect(finish).toHaveBeenCalledOnce(); expect(clock.state).toBe('paused'); expect(play).toHaveBeenCalledTimes(12);
    expect(model.snapshot(REMOVAL)).toMatchObject({ ended: 'handoff', calciumResponseObserved: true, recurrenceObserved: true,
      removalResponseObserved: true, durableRecoveryProven: false, observation: { reflexesPresent: true, severeWeakness: false } });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained callbacks after takeover and restart, then ends an untreated example once', () => {
    const model = new RenalHypermagnesemia(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RenalHypermagnesemiaSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new RenalHypermagnesemia().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER)).toMatchObject({ observation: null, magnesiumObservation: null }); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting a patient outcome');
  });

});
