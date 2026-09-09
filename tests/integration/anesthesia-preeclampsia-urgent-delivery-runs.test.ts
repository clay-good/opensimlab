/**
 * Reference transcripts for the preeclampsia-urgent-delivery lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * The assertion this file exists for is measured rather than narrated: thirty
 * simulated minutes after magnesium sulfate, the pressure is identical to the
 * confirming reading. Magnesium is seizure prophylaxis, the objective that
 * credits it is met in full, and nothing about the hypertensive emergency has
 * been treated.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { promptFor } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import type { HistorySample } from '@platform/session/session-store';
import { PREECLAMPSIA_URGENT_DELIVERY as SCENARIO } from '@anesthesia/scenarios/preeclampsia-urgent-delivery';
import { OBSTETRIC_GENERAL_ANESTHESIA } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { PREECLAMPSIA_URGENT_DELIVERY_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/preeclampsia-urgent-delivery-fixtures';
import {
  PREECLAMPSIA_URGENT_DELIVERY_OBJECTIVES, supportsPreeclampsiaUrgentDelivery,
} from '../../src/modules/anesthesia/preeclampsia-urgent-delivery';
import { preeclampsiaUrgentDeliveryCompletionEvidence } from '../../src/modules/anesthesia/preeclampsia-urgent-delivery-completion';

function run(
  actions: readonly LearnerAction[],
  level: GuidanceLevel = 'unassisted',
  region: 'US' | 'GB' = 'US',
) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
  const hash = createHash('sha256');
  const history: HistorySample[] = [];
  const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= FIXTURES.ticks; tick += 1) {
    while (actions[next]?.tick === tick) { engine.apply(actions[next]!); next += 1; }
    const frame = engine.step();
    hash.update(JSON.stringify(frame));
    history.push({ tick: frame.tick, state: frame.state, concentrations: frame.concentrations } as HistorySample);
    events.push(...frame.events);
    const prompt = promptFor(level, {
      scenarioId: SCENARIO.metadata.id, scenarioVersion: SCENARIO.metadata.version,
      tick, state: frame.state as Readonly<Record<string, number>>,
      actions: actions.slice(0, next), ventilating: false, alarmCount: 0,
    }, new Map());
    if (level === 'unassisted') expect(prompt).toBeNull();
  }
  expect(next).toBe(actions.length);
  return {
    hash: hash.digest('hex'), history, events, engine,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
/** Systolic and diastolic at one tick, rounded the way the debrief reports them. */
const pressure = (result: ReturnType<typeof run>, tick: number) => {
  const state = result.history[tick]!.state as Readonly<Record<string, number>>;
  return [Math.round(state.systolicMmHg!), Math.round(state.diastolicMmHg!)];
};

describe('Preeclampsia-urgent-delivery transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsPreeclampsiaUrgentDelivery(SCENARIO)).toBe(true);
    // The module's other obstetric lesson, which this must never answer for.
    expect(supportsPreeclampsiaUrgentDelivery(OBSTETRIC_GENERAL_ANESTHESIA)).toBe(false);
    // The engine gates on the narrative target, not the scenario id alone.
    expect(supportsPreeclampsiaUrgentDelivery({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(preeclampsiaUrgentDeliveryCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(preeclampsiaUrgentDeliveryCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(preeclampsiaUrgentDeliveryCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(preeclampsiaUrgentDeliveryCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...PREECLAMPSIA_URGENT_DELIVERY_OBJECTIVES]);
    expect(supportsPreeclampsiaUrgentDelivery({
      ...SCENARIO,
      metadata: { ...SCENARIO.metadata, objectives: [...SCENARIO.metadata.objectives].reverse() },
    })).toBe(false);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions = FIXTURES[path];
    const reference = run(actions);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, level).hash).toBe(reference.hash);
    }
    expect(run(actions, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and brings the pressure out of range', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(pressure(expert, 300)).toEqual([165, 120]);
    expect(pressure(expert, 2400)).toEqual([136, 99]);
    expect(expert.findings[3]!.finding).toContain('136/99 mmHg');
    expect(expert.findings[3]!.finding).toContain('without modeled hypotension');
  });

  it('measures the pressure magnesium does not move', () => {
    // The reason this lesson is worth binding, and it is a measurement rather
    // than a warning: thirty simulated minutes after 4 g of magnesium, the
    // pressure is what it was. The prophylaxis objective is met in full.
    const errored = run(FIXTURES.commonError);
    expect(pressure(errored, 300)).toEqual([165, 120]);
    expect(pressure(errored, 2400)).toEqual([165, 120]);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'met', 'not-exercised']);
    expect(errored.findings[2]!.finding).toContain('no antihypertensive effect in the model');
    // Nothing on this path was done carelessly: what it did, it did correctly.
    expect(errored.findings[0]!.finding).toContain('confirming the declared severe-range pattern');
  });

  it('declines to grade a reassessment that had nothing to reassess', () => {
    // A fourth outcome value, and not one the objective statements predict.
    const errored = run(FIXTURES.commonError);
    expect(errored.findings[3]!.outcome).toBe('not-exercised');
    expect(errored.findings[3]!.outcome).not.toBe('not-met');
    expect(errored.findings[3]!.finding).toContain('No accepted antihypertensive response');
    // And a run that treats but never looks again IS marked not-met.
    const unlooked = run(FIXTURES.expert.slice(0, 3));
    expect(unlooked.findings[3]!.outcome).toBe('not-met');
  });

  it('costs nothing to add the missing drug afterwards', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(pressure(recovered, 4200)).toEqual([136, 99]);
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('gives nothing when a drug is reached for before the confirming reading', () => {
    // The gate is enforced, and heeding it costs nothing — the module's usual
    // rule, which holds here.
    const early = run([
      { tick: 300, type: 'preeclampsia-response', payload: { action: 'labetalol-20mg-iv' } },
      ...FIXTURES.expert.map((action) => ({ ...action, tick: action.tick + 300 })),
    ] as LearnerAction[]);
    expect(early.events.some(({ eventId }) =>
      eventId.startsWith('preeclampsia-treatment-before-confirmation-'))).toBe(true);
    expect(outcomes(early)).toEqual(['met', 'met', 'met', 'met']);
  });

  it('cannot exercise the sixty-minute window at this run length', () => {
    // Worth pinning as a limit rather than leaving a reader to assume the
    // timing clause discriminates. 6,000 ticks is ten simulated minutes, so
    // labetalol at tick 4,200 is still read as well inside the window.
    const late = run([
      { tick: 300, type: 'preeclampsia-response', payload: { action: 'repeat-blood-pressure' } },
      { tick: 4200, type: 'preeclampsia-response', payload: { action: 'labetalol-20mg-iv' } },
      { tick: 4500, type: 'preeclampsia-response', payload: { action: 'magnesium-sulfate-4g-iv' } },
      { tick: 5700, type: 'preeclampsia-response', payload: { action: 'repeat-blood-pressure' } },
    ] as LearnerAction[]);
    expect(late.findings[1]!.outcome).toBe('met');
    expect(late.findings[1]!.finding).toContain('inside the 60-minute emergency-treatment window');
  });

  it('confirms nothing and treats nothing when nothing is done', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-exercised']);
    expect(pressure(idle, 5900)).toEqual([165, 120]);
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations)
      .toContain('preeclampsia-response-is-a-bounded-teaching-trajectory');
    expect(SCENARIO.metadata.limitations)
      .toContain('preeclampsia-lesson-stops-before-anesthesia-and-delivery');
    expect(SCENARIO.formulary).toEqual([]);
  });
});
