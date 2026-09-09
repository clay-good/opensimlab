/**
 * Reference transcripts for the paediatric IV-induction lesson, replayed through
 * the real engine and scored by the real debrief.
 *
 * The assertion this file exists for isolates a unit from a dose: entering 60 mg
 * gives this 20 kg child exactly 3.00 mg/kg, the debrief says so, and it scores
 * partly met rather than met purely because it was not entered by weight.
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
import { ROUTINE_PEDIATRIC_IV_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-pediatric-iv-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTINE_PEDIATRIC_IV_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-pediatric-iv-induction-fixtures';
import {
  ROUTINE_PEDIATRIC_IV_INDUCTION_OBJECTIVES, supportsRoutinePediatricIvInduction,
} from '../../src/modules/anesthesia/routine-pediatric-iv-induction';
import { routinePediatricIvInductionCompletionEvidence } from '../../src/modules/anesthesia/routine-pediatric-iv-induction-completion';

/** The child this lesson is about, and the arithmetic that follows. */
const WEIGHT_KG = 20;

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
const lowestSaturationAfterInduction = (result: ReturnType<typeof run>) =>
  Math.round(Math.min(...result.history.slice(1500).map(({ state }) => state.spo2Percent ?? 100)));

const VENTILATE = (tick: number, tidalVolumeMl: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: {
    delivering: true, mode: 'volume-control', fio2: 1,
    tidalVolumeMl, respiratoryRateBpm: 18,
  },
});

describe('Paediatric IV-induction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.patient.weightKg).toBe(WEIGHT_KG);
    expect(supportsRoutinePediatricIvInduction(SCENARIO)).toBe(true);
    // The adult induction lesson this one is the paediatric counterpart to.
    expect(supportsRoutinePediatricIvInduction(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsRoutinePediatricIvInduction({
      ...SCENARIO, patient: { ...SCENARIO.patient, ageYears: 42 },
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'anesthesia', 'operating-room', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(routinePediatricIvInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'anesthesia')).toHaveLength(8);
    expect(routinePediatricIvInductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toEqual([]);
    expect(routinePediatricIvInductionCompletionEvidence(SCENARIO, 'changed', 'anesthesia')).toEqual([]);
    expect(routinePediatricIvInductionCompletionEvidence(
      { ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'anesthesia',
    )).toEqual([]);
  });

  it('guards on the declared objectives', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id))
      .toEqual([...ROUTINE_PEDIATRIC_IV_INDUCTION_OBJECTIVES]);
    expect(supportsRoutinePediatricIvInduction({
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
    expect(expert.findings[1]!.finding).toContain('3.00 mg/kg for the 20 kg child, entered by weight');
    expect(expert.findings[2]!.finding).toContain('140 mL (7.0 mL/kg)');
    expect(lowestSaturationAfterInduction(expert)).toBe(100);
  });

  it('scores the unit the dose was entered in, not the dose', () => {
    // The reason this lesson is worth binding. 60 mg IS 3 mg/kg here, and the
    // debrief computes and reports exactly that on both paths.
    const byWeight = run(FIXTURES.expert);
    const asAbsolute = run([
      VENTILATE(100, 140),
      { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 3 * WEIGHT_KG, unit: 'mg' } },
      VENTILATE(1800, 140),
    ] as LearnerAction[]);
    expect(byWeight.findings[1]!.finding).toContain('3.00 mg/kg');
    expect(asAbsolute.findings[1]!.finding).toContain('3.00 mg/kg');
    expect(byWeight.findings[1]!.outcome).toBe('met');
    expect(asAbsolute.findings[1]!.outcome).toBe('partly-met');
    expect(asAbsolute.findings[1]!.finding).toContain('entered as an absolute dose');
    // Everything else about the two runs is identical.
    expect(outcomes(asAbsolute).filter((_, index) => index !== 1))
      .toEqual(outcomes(byWeight).filter((_, index) => index !== 1));
    expect(lowestSaturationAfterInduction(asAbsolute))
      .toBe(lowestSaturationAfterInduction(byWeight));
  });

  it('loses the ventilation objective to an adult tidal volume, and harms nobody', () => {
    const errored = run(FIXTURES.commonError);
    expect(outcomes(errored)).toEqual(['met', 'met', 'not-met', 'met']);
    expect(errored.findings[2]!.finding).toContain('450 mL (22.5 mL/kg)');
    expect(lowestSaturationAfterInduction(errored)).toBe(100);
  });

  it('costs an objective and no saturation to overdose or skip preoxygenation', () => {
    const overDosed = run([
      VENTILATE(100, 140),
      { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 5, unit: 'mg/kg' } },
      VENTILATE(1800, 140),
    ] as LearnerAction[]);
    expect(overDosed.findings[1]!.outcome).toBe('not-met');
    expect(lowestSaturationAfterInduction(overDosed)).toBe(100);
    const unPreoxygenated = run([
      { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 3, unit: 'mg/kg' } },
      VENTILATE(1800, 140),
    ] as LearnerAction[]);
    expect(unPreoxygenated.findings[0]!.outcome).toBe('not-met');
    expect(unPreoxygenated.findings[0]!.finding).toContain('0.16');
    expect(lowestSaturationAfterInduction(unPreoxygenated)).toBe(98);
  });

  it('accepts the machine default as a stated volume, unlike the geriatric lesson', () => {
    // Worth pinning as a contrast: routine-geriatric-induction scores an
    // unstated tidal volume at 0.0 mL/kg and fails it. Here the ventilator's
    // own 120 mL is 6.0 mL/kg, already in band, and the objective is met.
    expect(SCENARIO.equipment.ventilator.tidalVolumeMl).toBe(120);
    const unstated = run([
      { tick: 100, type: 'ventilator', payload: { delivering: true, fio2: 1 } },
      { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 3, unit: 'mg/kg' } },
    ] as LearnerAction[]);
    expect(unstated.findings[2]!.outcome).toBe('met');
    expect(unstated.findings[2]!.finding).toContain('120 mL (6.0 mL/kg)');
  });

  it('keeps the desaturation objective real', () => {
    // The counterweight: stopping the breaths after induction does harm.
    const apnoeic = run([
      VENTILATE(100, 140),
      { tick: 1500, type: 'bolus', payload: { drugId: 'propofol', amount: 3, unit: 'mg/kg' } },
      { tick: 1600, type: 'ventilator', payload: { delivering: false } },
    ] as LearnerAction[]);
    expect(apnoeic.findings[3]!.outcome).toBe('not-met');
    expect(lowestSaturationAfterInduction(apnoeic)).toBe(36);
  });

  it('resizes the breath in time on the recovery path', () => {
    const recovered = run(FIXTURES.recovery);
    expect(outcomes(recovered)).toEqual(['met', 'met', 'met', 'met']);
    expect(recovered.findings[2]!.finding).toContain('140 mL (7.0 mL/kg)');
    expect(FIXTURES.recovery.slice(0, FIXTURES.commonError.length))
      .toEqual([...FIXTURES.commonError]);
  });

  it('exercises nothing without an accepted induction dose', () => {
    const idle = run(FIXTURES.noAction);
    expect(outcomes(idle)).toEqual([
      'not-exercised', 'not-exercised', 'not-exercised', 'not-exercised',
    ]);
  });

  it('states the limits it cannot measure', () => {
    expect(SCENARIO.metadata.limitations).toContain('paedfusor-pk-does-not-validate-pediatric-depth');
    expect(SCENARIO.metadata.limitations).toContain('pediatric-case-is-one-bounded-profile');
  });
});
