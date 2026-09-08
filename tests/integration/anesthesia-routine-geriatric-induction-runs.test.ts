/**
 * Reference transcripts for the geriatric-induction lesson, replayed through the
 * real engine and scored by the real debrief.
 *
 * The assertion this file exists for is uncomfortable and is the reason the
 * lesson is worth binding: in this bounded model the incremental technique moves
 * the titration objective and does not move the patient. The same hundred
 * milligrams given as one push instead of five reaches a pressure nadir within a
 * tenth of a millimetre of mercury. The total is what costs pressure.
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
import { ROUTINE_GERIATRIC_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-geriatric-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTINE_GERIATRIC_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-geriatric-induction-fixtures';
import {
  ROUTINE_GERIATRIC_INDUCTION_OBJECTIVES, supportsRoutineGeriatricInduction,
} from '../../src/modules/anesthesia/routine-geriatric-induction';
import { routineGeriatricInductionCompletionEvidence } from '../../src/modules/anesthesia/routine-geriatric-induction-completion';

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
  Math.min(...result.history.map((sample) => sample.state.meanArterialMmHg ?? Infinity));

describe('Geriatric-induction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(supportsRoutineGeriatricInduction(SCENARIO)).toBe(true);
    // The lesson this one is the counterpart to: same uneventful case, younger.
    expect(supportsRoutineGeriatricInduction(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsRoutineGeriatricInduction({
      ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 42 },
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(routineGeriatricInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(routineGeriatricInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(routineGeriatricInductionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(routineGeriatricInductionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...ROUTINE_GERIATRIC_INDUCTION_OBJECTIVES]);
    expect(supportsRoutineGeriatricInduction({
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
    expect(expert.findings[1]!.finding).toContain('5 accepted increments');
    expect(expert.findings[1]!.finding).toContain('1.39 mg/kg');
    expect(nadir(expert)).toBeGreaterThan(65);
  });

  it('measures what the increments actually bought, which is the objective', () => {
    // The reason this lesson is worth binding. Same total, one push against
    // five, and the patient cannot tell the difference.
    const expert = run(FIXTURES.expert);
    const singlePush = run(FIXTURES.recovery);
    expect(Math.abs(nadir(expert) - nadir(singlePush))).toBeLessThan(0.5);
    // The technique objective moves; the perfusion objective does not.
    expect(expert.findings[1]!.outcome).toBe('met');
    expect(singlePush.findings[1]!.outcome).toBe('partly-met');
    expect(expert.findings[2]!.outcome).toBe(singlePush.findings[2]!.outcome);
  });

  it('shows what the total costs when it is the textbook adult one', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'not-met', 'not-met', 'met']);
    expect(errored.findings[1]!.finding).toContain('2.00 mg/kg');
    // Not an authored number: it falls out of the older-adult profile.
    expect(nadir(errored)).toBeLessThan(65);
    expect(nadir(run(FIXTURES.expert)) - nadir(errored)).toBeGreaterThan(5);
  });

  it('separates the dose learned from the technique learned', () => {
    // The recovery gives the right total in one push: the objective that reads
    // technique is partly met, and the one that reads the patient is met.
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'partly-met', 'met', 'met']);
    expect(recovered.findings[1]!.finding).toContain('the largest was 100 mg');
  });

  it('exercises nothing without a first accepted dose', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    for (const finding of idle.findings) {
      expect(finding.finding).toContain('No accepted propofol induction dose');
    }
  });

  it('reads the tidal volume the learner entered, not the one already on the machine', () => {
    // Worth pinning because it is a rubric behaviour rather than a physiological
    // one, and it is not obvious. The ventilator starts at 450 mL, which is
    // 6.25 mL/kg and inside the range the objective asks for — but starting
    // ventilation WITHOUT entering a volume is scored as 0.0 mL/kg, because the
    // objective reduces over accepted settings and an unstated field is not one.
    expect(SCENARIO.equipment.ventilator.tidalVolumeMl).toBe(450);
    const unstated = run([
      ...FIXTURES.expert.slice(0, 6),
      { tick: 2400, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } },
    ] as LearnerAction[]);
    expect(unstated.findings[3]!.finding).toContain('0.0 mL/kg');
    expect(unstated.findings[3]!.outcome).not.toBe('met');
    // And the expert path, which states 500 mL, is read at 6.9 and met.
    const expert = run(FIXTURES.expert);
    expect(expert.findings[3]!.finding).toContain('6.9 mL/kg');
    expect(expert.findings[3]!.outcome).toBe('met');
  });
});
