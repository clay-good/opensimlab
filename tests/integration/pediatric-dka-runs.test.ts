/**
 * Reference transcripts for the pediatric DKA lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is the one the improving minute-60 panel
 * makes tempting: no number anywhere in this lesson ever flips
 * cerebralInjuryExcluded.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';
import { PEDIATRIC_DKA_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-dka-fixtures';
import type { PediatricDkaAction } from '../../src/modules/pediatrics/pediatric-diabetic-ketoacidosis';
import { pediatricDkaCompletionEvidence } from '../../src/modules/pediatrics/pediatric-dka-completion';
import { pediatricDkaInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-dka-guidance';

type Choices = readonly (readonly [number, PediatricDkaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricDkaAction): LearnerAction => ({ tick, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment);
    const prompt = pediatricDkaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment)).toBe(before);
    // The risk is never retired by anything that happens in this lesson.
    const patient = frame.equipment.resuscitation.pediatricDiabeticKetoacidosisAssessment;
    if (patient) {
      expect(patient.cerebralInjuryExcluded).toBe(false);
      expect(patient.cerebralInjuryRiskActive).toBe(true);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricDiabeticKetoacidosisAssessment! };
}

describe('Pediatric DKA transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricDkaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricDkaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'endocrine-metabolic')).toEqual([]);
    expect(pediatricDkaCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricDkaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
  });

  it.each(['expert', 'commonError', 'recovery', 'noAction'] as const)('replays every %s frame identically across guidance levels and regions', (path) => {
    const actions: Choices = FIXTURES[path];
    const until = (actions.at(-1)?.[0] ?? 0) + 2;
    const reference = run(actions, until);
    for (const level of ['guided', 'coached'] as const) {
      expect(run(actions, until, level).hash).toBe(reference.hash);
    }
    expect(run(actions, until, 'unassisted', 'GB').hash).toBe(reference.hash);
  });

  it('meets every objective on the expert path and none with no action', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(findings(expert.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.handoffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses the later report while nobody is watching her brain', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.careAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.qualifiedCareOwnershipActive).toBe(true);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Keep qualified DKA care and neurological-metabolic safety review active in parallel');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair safety-first and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.careAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the supplied illness, whole-child state, and fixed biochemical pattern first');
    expect(transcript).toContain('Keep qualified DKA care and neurological-metabolic safety review active in parallel');
    expect(transcript).toContain('Allow elapsed simulated time after both qualified care and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.careAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('never lets an absent warning cluster become an exclusion', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.pediatricDkaAuthored).toBe(true);
    expect(expert.patient.fixedBiochemicalPatternAuthored).toBe(true);
    expect(expert.patient.dehydrationAuthored).toBe(true);
    expect(expert.patient.shockAuthored).toBe(false);
    // No cluster now, risk still live, exclusion never claimed — even after
    // the minute-60 panel improves on every axis.
    expect(expert.patient.cerebralInjuryAuthored).toBe(false);
    expect(expert.patient.cerebralInjuryRiskActive).toBe(true);
    expect(expert.patient.cerebralInjuryExcluded).toBe(false);
    expect(expert.patient.laterReportAuthored).toBe(true);
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.biochemicalResolutionProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that no arithmetic and no treatment was ever done by the learner', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.neurologicExamPerformedByLearner).toBe(false);
    expect(recovered.patient.dehydrationCalculatedByLearner).toBe(false);
    expect(recovered.patient.sodiumCalculatedByLearner).toBe(false);
    expect(recovered.patient.osmolalityCalculatedByLearner).toBe(false);
    expect(recovered.patient.anionGapCalculatedByLearner).toBe(false);
    expect(recovered.patient.severityCalculatedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.testInterpretedByLearner).toBe(false);
    expect(recovered.patient.fluidSelectedByLearner).toBe(false);
    expect(recovered.patient.insulinSelectedByLearner).toBe(false);
    expect(recovered.patient.electrolyteSelectedByLearner).toBe(false);
    expect(recovered.patient.glucoseSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidRateSelectedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.infusionOperatedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
