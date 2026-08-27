/** @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { Debrief } from '@anesthesia/ui/Debrief';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { RenalHyponatremia, RENAL_HYPONATREMIA_TAKEOVER_TICKS as STOP,
  RENAL_HYPONATREMIA_RESCUE_TICKS as RESPONSE, RENAL_HYPONATREMIA_ADDITIONAL_RESCUE_TICKS as ADDITIONAL,
  type RenalHyponatremiaAction, type RenalHyponatremiaEvent } from '../../src/modules/renal-electrolyte/hyponatremia';
import { RENAL_HYPONATREMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hyponatremia-fixtures';
import { RENAL_HYPONATREMIA_SYMPTOMS_AND_REASSESSMENT as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hyponatremia-symptoms-and-reassessment';

describe('Renal hyponatremia rendered debrief preserves unresolved neurologic risk', () => {
  let root: Root; let container: HTMLDivElement;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() });
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
  function click(label: string) {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
    expect(button).toBeDefined(); act(() => button!.click());
  }
  function renderRun(choices: readonly (readonly [number, RenalHyponatremiaAction])[], finalTick: number) {
    // Actual model events; the integration suite separately checks every solver frame.
    const model = new RenalHyponatremia(); const log: EngineEvent[] = []; const history: HistorySample[] = [];
    const initial = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' }).step();
    const capture = (events: readonly RenalHyponatremiaEvent[], tick: number) => {
      log.push(...events.map((event) => ({ tick, severity: 'info' as const, category: 'renal-hyponatremia',
        message: event.message, eventId: `renal-hyponatremia-${event.id}-${tick}` })));
      const { alertness: _alertness, ...vitals } = model.vitals();
      history.push({ tick, state: { ...initial.state, ...vitals }, concentrations: initial.concentrations });
    };
    capture([], 0);
    const actions: LearnerAction[] = choices.map(([tick, action]) => {
      capture(model.apply(action, tick), tick);
      return { tick, type: 'renal-hyponatremia-response', payload: { action } };
    });
    capture(model.advance(finalTick), finalTick);
    expect(history.every(({ state }) => (state.meanArterialMmHg ?? 0) >= 70 && state.spo2Percent === 98)).toBe(true);
    act(() => root.render(<Debrief scenario={SCENARIO} moduleId="renal-electrolyte"
      history={history} actions={actions} log={log} attributionByTick={() => []} preoxygenationSeconds={0}
      timeToPeakSeconds={{}} replayOptions={{ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US', ticks: finalTick }}
      onOpenExplainer={() => {}} onExportTranscript={() => {}} onReplayScenario={() => {}} />));
    click('Skip and continue'); click('Continue to the analysis');
    expect(container.textContent).not.toContain('That is a good outcome');
    expect(container.textContent).toContain('does not establish a good outcome');
    click('Continue');
    expect(container.textContent).toContain('Urine sodium alone does not establish SIAD');
    expect(container.textContent).toContain('cannot establish neurologic recovery');
    expect(container.textContent).toContain('investigation is available at any time and does not itself cure symptoms');
    expect(container.textContent).toContain('not a treatment-stopping rule, normalization, or discharge clearance');
    expect(container.textContent).toContain('Handoff ends rehearsal, not clinical care');
    expect(container.textContent).toContain('durable safety and competence are not certified');
    return model.snapshot(finalTick);
  }
  const outcomes = () => [...container.querySelectorAll('li > strong')].map((item) => item.textContent);

  it.each(['expert', 'recovery', 'commonError', 'noAction'] as const)('renders the %s course without certifying correction or symptom recovery', (path) => {
    const complete = path === 'expert' || path === 'recovery'; const choices = FIXTURES[path];
    const patient = renderRun(choices, complete ? choices.at(-1)![0] : STOP);
    expect(patient.ended).toBe(complete ? 'handoff' : 'instructor-takeover');
    expect(patient.durableRecoveryProven).toBe(false);
    expect(outcomes()).toEqual(Array(5).fill(complete ? 'Met' : 'Not met'));
    if (complete) {
      expect(patient.observation).toMatchObject({ sodiumMmolL: 124, changeFromBaselineMmolL: 6,
        alertness: 'awake but confused', headache: true, nausea: true });
      expect(container.textContent).toContain('receiving expert team owns unresolved symptoms');
    }
    if (path === 'recovery' || path === 'commonError') {
      expect(container.textContent).toContain('premature SIAD label was refused');
      expect(container.textContent).toContain('attempted normalization or number-only recovery shortcut remains visible');
    }
  });

  it('does not credit a sodium-only and neurologic-only pair as combined response evidence', () => {
    const patient = renderRun([[0, 'reassess'], [1, 'rescue'], [2, 'monitor'], [3, 'call-support'],
      [4, 'review-context'], [5, 'evaluate-neurology'], [RESPONSE + 1, 'check-sodium'],
      [RESPONSE + 2, 'check-neurology'], [RESPONSE + 3, 'additional-rescue']], RESPONSE + 3);
    expect(patient).toMatchObject({ ended: null, initialResponseObserved: false, additionalRescueAtTick: null,
      observation: { atTick: 0, sodiumMmolL: 118 },
      sodiumObservation: { atTick: RESPONSE + 1, sodiumMmolL: 123 },
      neurologicObservation: { atTick: RESPONSE + 2, alertness: 'awake but confused' } });
    expect(outcomes()).toEqual(['Not met', 'Met', 'Not met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('did not refresh the older full panel');
  });

  it('keeps first full findings historical after newer partial findings at the additional-response checkpoint', () => {
    const final = RESPONSE + ADDITIONAL;
    const patient = renderRun([[0, 'rescue'], [0, 'monitor'], [0, 'call-support'], [0, 'review-context'],
      [0, 'evaluate-neurology'], [RESPONSE, 'reassess'], [RESPONSE, 'additional-rescue'],
      [final, 'check-sodium'], [final, 'check-neurology'], [final, 'handoff']], final);
    expect(patient).toMatchObject({ ended: null, initialResponseObserved: true, additionalResponseObserved: false,
      observation: { atTick: RESPONSE, sodiumMmolL: 123 }, sodiumObservation: { atTick: final, sodiumMmolL: 124 },
      neurologicObservation: { atTick: final, alertness: 'awake but confused' } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Met', 'Not met', 'Not met']);
    expect(container.textContent).toContain('did not refresh the older full panel');
    expect(container.textContent).toContain('current combined findings after the selected response remains incomplete');
  });

  it.each([false, true])('credits additional rescue only after its fresh full response (observed: %s)', (observed) => {
    const early = RESPONSE + 3; const late = RESPONSE + 1 + ADDITIONAL;
    const choices: readonly (readonly [number, RenalHyponatremiaAction])[] = [
      [0, 'rescue'], [0, 'monitor'], [0, 'call-support'], [0, 'review-context'],
      [RESPONSE, 'reassess'], [RESPONSE + 1, 'additional-rescue'], [RESPONSE + 2, 'evaluate-neurology'],
      [early, 'reassess'], ...(observed ? [[late, 'reassess'] as const] : []),
    ];
    const patient = renderRun(choices, observed ? late : early);
    expect(patient).toMatchObject({ ended: null, initialResponseObserved: true, additionalResponseObserved: observed,
      observation: { atTick: observed ? late : early, sodiumMmolL: observed ? 124 : 123 } });
    expect(outcomes()).toEqual(['Met', 'Met', 'Met', observed ? 'Met' : 'Not met', 'Not met']);
    expect(container.textContent).toContain(observed
      ? 'Selected qualified additional rescue, fresh full findings, and parallel alternative-cause investigation were recorded'
      : 'Additional rescue, its later full assessment, or neurologic and alternate-cause investigation remains incomplete');
  });
});
