/** @vitest-environment jsdom */
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DemonstrationBar } from '@anesthesia/ui/DemonstrationBar';
import { Prebrief } from '@anesthesia/ui/Prebrief';
import { UNITED_STATES } from '@anesthesia/region/profiles';
import { SimulationClock } from '@platform/clock/simulation-clock';
import type { LearnerAction, RefeedingSnapshot } from '@platform/kernel/protocol';
import { RefeedingTray } from '../../src/modules/endocrine-metabolic/RefeedingTray';
import { Refeeding, REFEEDING_ELECTROLYTE_TICKS as EARLY, REFEEDING_RESPONSE_TICKS as RESPONSE,
  REFEEDING_RECURRENCE_TICKS as RECURRENCE, REFEEDING_TAKEOVER_TICKS as TAKEOVER,
  type RefeedingAction } from '../../src/modules/endocrine-metabolic/refeeding';
import { REFEEDING_ELECTROLYTE_SHIFT as SCENARIO } from '../../src/modules/endocrine-metabolic/scenarios/refeeding-electrolyte-shift';
import { refeedingInlinePrompt, REFEEDING_SOURCE_HREF, REFEEDING_ALTERNATIVE_SOURCE_HREF } from '../../src/modules/endocrine-metabolic/refeeding-tutor';
import { refeedingDemonstrationStep, supportsRefeedingDemonstration, REFEEDING_DEMONSTRATION_VERSION } from '../../src/modules/endocrine-metabolic/demo/refeeding-demonstration';
import { useRefeedingDemonstration } from '../../src/modules/endocrine-metabolic/demo/useRefeedingDemonstration';
import { LIMITATIONS } from '@platform/docs/limitations';

const labels: Record<RefeedingAction, string> = {
  'replace-electrolytes': 'Request comprehensive electrolyte care', 'phosphate-only': 'Request phosphate-only care',
  thiamine: 'Request qualified thiamine support', 'review-nutrition': 'Review the individualized nutrition plan',
  'call-support': 'Call qualified support', 'review-context': 'Review feeding and electrolyte context',
  monitor: 'Arrange serial electrolytes and bedside checks', reassess: 'Reassess electrolytes and bedside response',
  handoff: 'Hand off nutrition and electrolyte surveillance', 'advance-feeding': 'Advance feeding automatically',
  'stop-monitoring': 'Stop electrolyte monitoring now',
};
const care = ['replace-electrolytes', 'thiamine', 'review-nutrition', 'call-support', 'review-context', 'monitor'] as const;
const tutor = (model: Refeeding, tick: number, level: 'guided' | 'coached' | 'unassisted' = 'guided') =>
  refeedingInlinePrompt(level, { scenarioVersion: '0.1.0', refeeding: model.snapshot(tick) });
function DemoHarness(props: {
  active: boolean; running: boolean; patient?: RefeedingSnapshot;
  act: (action: Omit<LearnerAction, 'tick'>) => void; pause: () => void; play: () => void; onFinished: () => void;
  capture: (advance: (() => void) | undefined) => void;
}) {
  const demo = useRefeedingDemonstration(props); props.capture(demo.onAdvance);
  return <DemonstrationBar beat={demo.beat} progress={demo.progress} onAdvance={demo.onAdvance}
    awaitingAdvance={demo.awaitingAdvance} onTakeControls={() => {}} />;
}

describe('Refeeding electrolyte care and learner-paced observation', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  function patientView() {
    const model = new Refeeding(); let tick = 0;
    const dispatch = vi.fn((action: RefeedingAction) => { model.apply(action, tick); render(); });
    const render = () => act(() => root.render(<StrictMode><RefeedingTray assessment={model.snapshot(tick)}
      scenarioVersion="0.1.0" guidance="guided" onAction={dispatch} /></StrictMode>));
    const button = (action: RefeedingAction) => [...container.querySelectorAll('button')].find((entry) => entry.textContent === labels[action])!;
    render();
    return { model, dispatch, render, button, click: (action: RefeedingAction) => act(() => button(action).click()),
      jump: (next: number) => { tick = next; model.advance(tick); render(); }, snapshot: () => model.snapshot(tick) };
  }

  it('offers a paused worked example and explains feeding uncertainty without a fixed strategy', () => {
    const watch = vi.fn();
    act(() => root.render(<Prebrief scenario={SCENARIO} limitations={LIMITATIONS} region={UNITED_STATES} environment="endocrine-metabolic"
      guidance="guided" onGuidance={() => {}} onStart={() => {}} onWatch={watch} />));
    expect(container.textContent).toContain('Reading time does not advance the patient');
    expect(container.textContent).toContain('neither a universal rate nor stopping all nutrition');
    expect(container.textContent).not.toContain('90-second');
    act(() => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Watch a worked example')!.click());
    expect(watch).toHaveBeenCalledOnce();
  });

  it('offers immediate complete electrolyte care and keeps accepted controls focused without dispatching twice', () => {
    expect(renderToStaticMarkup(<RefeedingTray scenarioVersion="0.1.0" onAction={() => {}} />)).toContain('Preparing');
    const view = patientView(); expect(container.querySelectorAll('button')).toHaveLength(11);
    const initial = view.snapshot(); view.render(); expect(view.snapshot()).toEqual(initial); expect(view.dispatch).not.toHaveBeenCalled();
    expect(container.textContent).toContain('supplied current values: 0.30/2.7/0.48 mmol/L');
    expect(tutor(view.model, 0)?.id).toBe('refeeding-electrolytes');
    const button = view.button('replace-electrolytes'); button.focus(); view.click('replace-electrolytes');
    expect(view.snapshot()).toMatchObject({ completeElectrolytesAtTick: 0, thiamineAtTick: null,
      nutritionPlanAtTick: null, supportActive: false, observation: null });
    expect(view.button('replace-electrolytes')).toBe(button); expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.getAttribute('aria-disabled')).toBe('true');
    view.click('replace-electrolytes'); expect(view.dispatch).toHaveBeenCalledOnce();
    expect(REFEEDING_DEMONSTRATION_VERSION).toBe('0.1.0'); expect(supportsRefeedingDemonstration(SCENARIO)).toBe(true);
    expect(supportsRefeedingDemonstration({ ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' } })).toBe(false);
    expect(refeedingInlinePrompt('guided', { scenarioVersion: '0.1.1', refeeding: initial })).toBeNull();
  });

  it.each(['thiamine', 'review-nutrition'] as const)('accepts %s first without laboratory, support, or other-treatment gates', (first) => {
    const view = patientView(); view.click(first);
    expect(view.snapshot()).toMatchObject({ observation: null, completeElectrolytesAtTick: null, supportActive: false });
    for (const action of care) if (action !== first) view.click(action);
    view.jump(RESPONSE); expect(view.snapshot().observation).toBeNull(); view.click('reassess');
    expect(view.snapshot()).toMatchObject({ responseObserved: true, electrolyteResponseObserved: false });
    expect(refeedingDemonstrationStep(view.snapshot())).toMatchObject({ id: 'handoff', action: 'handoff' });
    expect(tutor(view.model, RESPONSE)?.id).toBe('refeeding-handoff');
    view.click('handoff'); expect(view.snapshot().ended).toBe('handoff');
  });

  it('accepts phosphate-only as partial care and does not imply potassium or magnesium correction', () => {
    const view = patientView(); view.click('phosphate-only'); view.jump(EARLY);
    expect(view.snapshot()).toMatchObject({ phosphateAtTick: 0, completeElectrolytesAtTick: null, observation: null,
      feedingAdvanceAttempted: false, monitoringStopAttempted: false });
    expect(container.textContent).not.toContain('0.45 mmol/L'); view.click('reassess');
    expect(container.textContent).toContain('phosphate 0.45 mmol/L, potassium 2.7 mmol/L, magnesium 0.48 mmol/L');
    expect(container.textContent).toContain('valid partial care, not complete rescue');
    expect(tutor(view.model, EARLY)?.id).toBe('refeeding-electrolytes'); view.click('handoff'); expect(view.snapshot().ended).toBeNull();
    view.click('replace-electrolytes'); expect(view.snapshot().completeElectrolytesAtTick).toBe(EARLY);
  });

  it('keeps recurrence and later response hidden until requested and preserves observed history after recovery', () => {
    const view = patientView(); view.click('replace-electrolytes'); view.jump(EARLY); view.click('reassess');
    const earlier = view.snapshot().observation;
    expect(earlier).toMatchObject({ phosphateMmolL: 0.5, potassiumMmolL: 3.1, magnesiumMmolL: 0.6 });
    view.jump(RECURRENCE); expect(view.snapshot().observation).toEqual(earlier);
    expect(view.snapshot().recurrentDeclineObserved).toBe(false); expect(container.textContent).not.toContain('phosphate 0.35');
    view.click('reassess'); expect(view.snapshot()).toMatchObject({ recurrentDeclineObserved: true,
      observation: { phosphateMmolL: 0.35, potassiumMmolL: 2.8, magnesiumMmolL: 0.5 } });
    view.click('advance-feeding'); view.click('stop-monitoring');
    for (const action of care) view.click(action);
    view.jump(RECURRENCE + RESPONSE); expect(container.textContent).not.toContain('phosphate 0.55');
    view.click('reassess'); view.click('handoff');
    expect(view.snapshot()).toMatchObject({ ended: 'handoff', recurrentDeclineObserved: true,
      feedingAdvanceAttempted: true, monitoringStopAttempted: true, observation: { phosphateMmolL: 0.55, potassiumMmolL: 3.3, magnesiumMmolL: 0.65 } });
    expect(container.textContent).toContain('Later care does not erase that observation');
    expect(container.textContent).toContain('Earlier choices stay in this run');
    expect(container.textContent).toContain('historical observations, not live measurements');
    const count = view.dispatch.mock.calls.length;
    for (const action of Object.keys(labels) as RefeedingAction[]) view.click(action);
    expect(view.dispatch).toHaveBeenCalledTimes(count);
  });

  it('keeps coached waits quiet, unassisted silent, and both source links active during a guarded example', () => {
    const model = new Refeeding(); for (const action of care) model.apply(action, 0);
    expect(tutor(model, 0)).not.toBeNull(); expect(tutor(model, 0, 'coached')).toBeNull(); expect(tutor(model, 0, 'unassisted')).toBeNull();
    const source = vi.fn(); const dispatch = vi.fn();
    act(() => root.render(<RefeedingTray assessment={model.snapshot(0)} scenarioVersion="0.1.0" demonstrating
      guidance="guided" onAction={dispatch} onOpenSource={source} />));
    expect(container.querySelector('[aria-label="Private tutor"]')).toBeNull();
    for (const button of container.querySelectorAll('button')) { expect(button.disabled).toBe(false); act(() => button.click()); }
    const links = [...container.querySelectorAll('a')]; expect(links.map((link) => link.href)).toEqual([REFEEDING_SOURCE_HREF, REFEEDING_ALTERNATIVE_SOURCE_HREF]);
    for (const link of links) {
      expect(link.target).toBe('_blank'); expect(link.rel).toBe('noreferrer');
      link.addEventListener('click', (event) => event.preventDefault()); act(() => link.click());
    }
    expect(source).toHaveBeenCalledTimes(2); expect(dispatch).not.toHaveBeenCalled();
  });

  it('continues a late observed recurrence without looping on an unavailable earlier teaching assessment', () => {
    const model = new Refeeding(); model.apply('replace-electrolytes', 0); model.apply('reassess', RECURRENCE);
    expect(model.snapshot(RECURRENCE)).toMatchObject({ recurrentDeclineObserved: true, electrolyteResponseObserved: false });
    for (const action of care) model.apply(action, RECURRENCE);
    expect(refeedingDemonstrationStep(model.snapshot(RECURRENCE))).toMatchObject({ id: 'response-observation' });
    expect(refeedingDemonstrationStep(model.snapshot(RECURRENCE)).action).toBeUndefined();
    expect(tutor(model, RECURRENCE, 'coached')).toBeNull();
    model.apply('reassess', RECURRENCE + RESPONSE);
    expect(refeedingDemonstrationStep(model.snapshot(RECURRENCE + RESPONSE))).toMatchObject({ action: 'handoff' });
  });

  it('paces nine decisions with a stopped reading clock and separate early and combined-care observations', () => {
    const model = new Refeeding(); const clock = new SimulationClock(); clock.setSpeed(60); clock.play();
    const pause = vi.fn(() => clock.pause()); const play = vi.fn(() => clock.play()); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const dispatch = vi.fn((action: Omit<LearnerAction, 'tick'>) => { expect(action.type).toBe('refeeding-response'); model.apply(action.payload.action, clock.tick); });
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
    expect(model.snapshot(RESPONSE)).toMatchObject({ ended: 'handoff', responseObserved: true, durableRecoveryProven: false });
    expect(container.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('rejects retained example callbacks after takeover and restart, then finishes an untreated branch once', () => {
    const model = new Refeeding(); const pause = vi.fn(); const play = vi.fn(); const dispatch = vi.fn(); const finish = vi.fn();
    let advance: (() => void) | undefined;
    const render = (active: boolean, patient?: RefeedingSnapshot) => act(() => root.render(<StrictMode><DemoHarness active={active}
      running={false} patient={patient} act={dispatch} pause={pause} play={play} onFinished={finish}
      capture={(callback) => { advance = callback; }} /></StrictMode>));
    render(true); expect(advance).toBeUndefined(); render(true, model.snapshot(0)); const retained = advance!;
    render(false, model.snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    render(true, new Refeeding().snapshot(0)); act(() => retained()); expect(dispatch).not.toHaveBeenCalled();
    act(() => advance!()); expect(dispatch).toHaveBeenCalledOnce();
    model.advance(TAKEOVER); render(true, model.snapshot(TAKEOVER)); render(true, model.snapshot(TAKEOVER));
    expect(finish).toHaveBeenCalledOnce(); expect(pause).toHaveBeenCalledOnce();
    expect(model.snapshot(TAKEOVER).observation).toBeNull(); expect(tutor(model, TAKEOVER)).toBeNull();
    expect(container.textContent).toContain('without predicting injury');
  });
});
