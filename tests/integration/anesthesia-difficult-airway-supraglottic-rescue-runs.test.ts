/**
 * Reference transcripts for the difficult-airway supraglottic-rescue lesson,
 * replayed through the real engine and scored by the real debrief.
 *
 * Three assertions this file exists for, two of them about the escalation
 * objective rather than the airway. Late help and no help score identically.
 * Help requested well BEFORE the window the measure describes is scored met. And
 * the preoxygenation result from the sibling lesson reproduces here at two
 * attempts: 54% without the reserve, 100% with it, everything else held equal.
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
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE as SCENARIO } from '@anesthesia/scenarios/difficult-airway-supraglottic-rescue';
import { REPEATED_LARYNGOSCOPY_HARM } from '@anesthesia/scenarios/repeated-laryngoscopy-harm';
import { DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/difficult-airway-supraglottic-rescue-fixtures';
import {
  DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_OBJECTIVES, supportsDifficultAirwaySupraglotticRescue,
} from '../../src/modules/anesthesia/difficult-airway-supraglottic-rescue';
import { difficultAirwaySupraglotticRescueCompletionEvidence } from '../../src/modules/anesthesia/difficult-airway-supraglottic-rescue-completion';

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
const lowestSaturationFrom = (result: ReturnType<typeof run>, tick: number) =>
  Math.round(Math.min(...result.history.slice(tick).map(({ state }) => state.spo2Percent ?? 100)));

/** One attempt, rescued and confirmed, with the help request placed where asked. */
const oneAttemptWithHelpAt = (helpTick: number | null): LearnerAction[] => [
  { tick: 100, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
  ...(helpTick !== null && helpTick < 1500
    ? [{ tick: helpTick, type: 'call-for-help', payload: { context: 'airway' } } as LearnerAction] : []),
  { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } },
  { tick: 1800, type: 'laryngoscopy', payload: { technique: 'video' } },
  ...(helpTick !== null && helpTick >= 1500
    ? [{ tick: helpTick, type: 'call-for-help', payload: { context: 'airway' } } as LearnerAction] : []),
  { tick: 2600, type: 'airway-device', payload: { device: 'supraglottic-airway' } },
  { tick: 2900, type: 'ventilator', payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 } },
].sort((a, b) => a.tick - b.tick) as LearnerAction[];

describe('Difficult-airway supraglottic-rescue transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsDifficultAirwaySupraglotticRescue(SCENARIO)).toBe(true);
    // The near-twin, which shares all four objective ids and adds a fifth.
    expect(supportsDifficultAirwaySupraglotticRescue(REPEATED_LARYNGOSCOPY_HARM)).toBe(false);
    expect(supportsDifficultAirwaySupraglotticRescue({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(difficultAirwaySupraglotticRescueCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(difficultAirwaySupraglotticRescueCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(difficultAirwaySupraglotticRescueCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(difficultAirwaySupraglotticRescueCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_OBJECTIVES]);
    // The sibling's first four ids are these four, in this order.
    expect(REPEATED_LARYNGOSCOPY_HARM.metadata.objectives.map(({ id }) => id))
      .toContain('prepare-rescue-oxygen-reserve');
    expect(supportsDifficultAirwaySupraglotticRescue({
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

  it('meets every objective on the expert path', () => {
    const expert = run(FIXTURES.expert);
    expect(outcomes(expert)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.findings[0]!.finding).toContain('0.92 at the first accepted propofol dose');
    expect(expert.findings[1]!.finding).toContain('1 completed tracheal attempt');
    expect(lowestSaturationFrom(expert, 1500)).toBe(100);
  });

  it('scores late help exactly as it scores no help at all', () => {
    // No gradient between late and never: the attempt count dominates.
    const late = run(oneAttemptWithHelpAt(2650));
    const none = run(oneAttemptWithHelpAt(null));
    expect(late.findings[1]!.outcome).toBe('partly-met');
    expect(none.findings[1]!.outcome).toBe('partly-met');
    expect(outcomes(late)).toEqual(outcomes(none));
    // Only the finding TEXT distinguishes them.
    expect(late.findings[1]!.finding).toContain('49 seconds after the failed attempt completed');
    expect(none.findings[1]!.finding).toContain('No accepted airway-help request was recorded');
  });

  it('scores help requested before the declared window as met', () => {
    // The measure describes a window opening at the failed attempt; the check
    // has no lower bound. A documentation mismatch, recorded rather than hidden.
    expect(SCENARIO.metadata.objectives[1]!.measure)
      .toContain('from the start of the failed attempt');
    const early = run(oneAttemptWithHelpAt(1200));
    expect(early.findings[1]!.outcome).toBe('met');
    expect(early.findings[1]!.finding).toContain('96 seconds before the failed attempt completed');
    // And asking during the attempt, inside the window, is met as well.
    expect(run(oneAttemptWithHelpAt(1900)).findings[1]!.outcome).toBe('met');
  });

  it('reproduces the preoxygenation result at two attempts', () => {
    // The recovery IS the error path with one action prepended.
    expect(FIXTURES.recovery.slice(1)).toEqual([...FIXTURES.commonError]);
    const withReserve = run(FIXTURES.recovery);
    const withoutReserve = run(FIXTURES.commonError);
    expect(lowestSaturationFrom(withReserve, 1500)).toBe(100);
    expect(lowestSaturationFrom(withoutReserve, 1500)).toBe(54);
    expect(outcomes(withReserve)).toEqual(['met', 'not-met', 'partly-met', 'met']);
    expect(outcomes(withoutReserve)).toEqual(['not-met', 'not-met', 'partly-met', 'partly-met']);
    // The attempts are marked down identically on both.
    expect(outcomes(withReserve)[1]).toBe(outcomes(withoutReserve)[1]);
    expect(outcomes(withReserve)[2]).toBe(outcomes(withoutReserve)[2]);
  });

  it('exercises nothing at all without an accepted induction dose', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual([
      'not-exercised', 'not-exercised', 'not-exercised', 'not-exercised',
    ]);
    expect(idle.findings[0]!.finding).toContain('No accepted positive propofol induction dose');
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('no-cico-or-front-of-neck-airway');
    expect(SCENARIO.metadata.limitations).toContain('rocuronium-course-is-a-teaching-model');
    expect(SCENARIO.metadata.limitations).toContain('no-post-supraglottic-airway-plan');
  });
});
