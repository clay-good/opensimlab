/**
 * Reference transcripts for the obstetric-general-anaesthesia lesson, replayed
 * through the real engine and scored by the real debrief.
 *
 * Two assertions this file exists for. The preparation has two halves, and a
 * learner who sets the dial without the fresh-gas flow scores partly met rather
 * than met. And the margin objective is a floor rather than a scale: a variant
 * that corrects only the airway timing gains twenty-eight points of saturation
 * and moves nothing on the rubric at all.
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
import { OBSTETRIC_GENERAL_ANESTHESIA as SCENARIO } from '@anesthesia/scenarios/obstetric-general-anesthesia';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { OBSTETRIC_GENERAL_ANESTHESIA_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/obstetric-general-anesthesia-fixtures';
import {
  OBSTETRIC_GENERAL_ANESTHESIA_OBJECTIVES, supportsObstetricGeneralAnesthesia,
} from '../../src/modules/anesthesia/obstetric-general-anesthesia';
import { obstetricGeneralAnesthesiaCompletionEvidence } from '../../src/modules/anesthesia/obstetric-general-anesthesia-completion';

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
    hash: hash.digest('hex'), history, events,
    findings: objectiveFindings(
      SCENARIO, history, 0, engine.equipment().preoxygenationSeconds, actions, events,
    ),
  };
}

const outcomes = (result: ReturnType<typeof run>) => result.findings.map(({ outcome }) => outcome);
const nadir = (result: ReturnType<typeof run>) =>
  Math.min(...result.history.map((sample) => sample.state.spo2Percent ?? Infinity));

describe('Obstetric-general-anaesthesia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsObstetricGeneralAnesthesia(SCENARIO)).toBe(true);
    // The non-obstetric rapid sequence shares an objective id and stocks a
    // 0.6 mg/kg rocuronium preset this lesson deliberately does not.
    expect(supportsObstetricGeneralAnesthesia(RAPID_SEQUENCE_INDUCTION)).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(obstetricGeneralAnesthesiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(obstetricGeneralAnesthesiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(obstetricGeneralAnesthesiaCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(obstetricGeneralAnesthesiaCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...OBSTETRIC_GENERAL_ANESTHESIA_OBJECTIVES]);
    expect(supportsObstetricGeneralAnesthesia({
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
    expect(nadir(expert)).toBeGreaterThanOrEqual(95);
  });

  it('needs both halves of the preparation, not just the dial', () => {
    // A circle system at 2 L/min rebreathes nitrogen however high the dial reads.
    const dialOnly = run(FIXTURES.expert.map((action, index) => (
      index === 0 ? { ...action, payload: { fio2: 1 } } : action
    )));
    const preparation = dialOnly.findings[0]!;
    expect(preparation.outcome).toBe('partly-met');
    expect(preparation.finding).toContain('fresh-gas flow 2.0');
    // And the expert path, which sets both, is met.
    expect(run(FIXTURES.expert).findings[0]!.outcome).toBe('met');
  });

  it('shows what no reserve and the wrong order cost in this patient', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['not-met', 'not-met', 'not-met', 'met']);
    expect(errored.findings[1]!.finding).toContain('does not produce sleep');
    // Not an authored number: it falls out of a term functional residual
    // capacity and a higher oxygen consumption.
    expect(nadir(errored)).toBeLessThan(60);
  });

  it('recovers one objective on the same missing reserve, and not the margin', () => {
    const recovered = run(FIXTURES.recovery);
    const errored = run(FIXTURES.commonError);
    expect(outcomes(recovered)).toEqual(['not-met', 'met', 'not-met', 'met']);
    expect(nadir(recovered) - nadir(errored)).toBeGreaterThan(25);
    // The floor is 95%, and 81.5% is nowhere near it.
    expect(nadir(recovered)).toBeLessThan(95);
  });

  it('treats the margin objective as a floor rather than a scale', () => {
    // The sharpest measurement in this lesson. Correcting ONLY the airway timing
    // is worth twenty-eight points of saturation and moves no objective at all.
    const errored = run(FIXTURES.commonError);
    const timingOnly = run([
      ...FIXTURES.commonError.slice(0, 2),
      { tick: 900, type: 'laryngoscopy', payload: { technique: 'video' } },
      { tick: 1000, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
    ] as LearnerAction[]);
    expect(outcomes(timingOnly)).toEqual(outcomes(errored));
    expect(nadir(timingOnly) - nadir(errored)).toBeGreaterThan(25);
  });

  it('exercises nothing at all when nothing is done', () => {
    // Unusual in this module, and a property of the objectives rather than of
    // the transcripts: every one is written from the first drug or first
    // attempt, so a session with neither exercises none of them.
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle))
      .toEqual(['not-exercised', 'not-exercised', 'not-exercised', 'not-exercised']);
  });
});
