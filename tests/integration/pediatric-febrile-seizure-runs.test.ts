/**
 * Reference transcripts for the febrile-seizure lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is the one a well-looking toddler makes
 * tempting: "simple features to date" never hardens into a diagnosis, and no
 * negative finding anywhere becomes an exclusion.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_FEBRILE_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-febrile-seizure';
import { PEDIATRIC_FEBRILE_SEIZURE_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-febrile-seizure-fixtures';
import type { PediatricFebrileSeizureAction } from '../../src/modules/pediatrics/pediatric-febrile-seizure';
import { pediatricFebrileSeizureCompletionEvidence } from '../../src/modules/pediatrics/pediatric-febrile-seizure-completion';
import { pediatricFebrileSeizureInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-febrile-seizure-guidance';

type Choices = readonly (readonly [number, PediatricFebrileSeizureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricFebrileSeizureAction): LearnerAction => ({ tick, type: 'pediatric-febrile-seizure-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricFebrileSeizureAssessment);
    const prompt = pediatricFebrileSeizureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricFebrileSeizureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricFebrileSeizureAssessment)).toBe(before);
    // Nothing in this lesson ever hardens the pattern into a verdict.
    const patient = frame.equipment.resuscitation.pediatricFebrileSeizureAssessment;
    if (patient) {
      expect(patient.simpleFebrileSeizureFinallyProven).toBe(false);
      expect(patient.benignCourseProven).toBe(false);
      expect(patient.cnsInfectionExcluded).toBe(false);
      expect(patient.seriousInfectionExcluded).toBe(false);
      expect(patient.recurrenceExcluded).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricFebrileSeizureAssessment! };
}

describe('Febrile-seizure transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricFebrileSeizureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricFebrileSeizureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(pediatricFebrileSeizureCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricFebrileSeizureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the later report while the dangerous causes were never opened', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.careAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null });
    expect(errored.patient.qualifiedCareOwnershipActive).toBe(true);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Keep qualified care ownership and infection-recurrence safety review active in parallel');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair red-flags-first and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.careAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied event, recovery, fever, and whole-child trajectory first');
    expect(transcript).toContain('Keep qualified care ownership and infection-recurrence safety review active in parallel');
    expect(transcript).toContain('Allow elapsed simulated time after both care and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.careAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('keeps simple features to date from hardening into a diagnosis', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.stoppedSeizureAuthored).toBe(true);
    expect(expert.patient.feverAuthored).toBe(true);
    expect(expert.patient.statusEpilepticusAuthored).toBe(false);
    expect(expert.patient.laterReportAuthored).toBe(true);
    // The improving half-hour settles nothing.
    expect(expert.patient.simpleFebrileSeizureFinallyProven).toBe(false);
    expect(expert.patient.benignCourseProven).toBe(false);
    expect(expert.patient.seizureCauseProven).toBe(false);
    expect(expert.patient.cnsInfectionExcluded).toBe(false);
    expect(expert.patient.seriousInfectionExcluded).toBe(false);
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.recurrenceExcluded).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that no test and no treatment was ever reached for', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.temperatureAcquiredByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.testInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.classificationMadeByLearner).toBe(false);
    expect(recovered.patient.lumbarPuncturePerformedByLearner).toBe(false);
    expect(recovered.patient.eegAcquiredByLearner).toBe(false);
    expect(recovered.patient.imagingAcquiredByLearner).toBe(false);
    expect(recovered.patient.antipyreticSelectedByLearner).toBe(false);
    expect(recovered.patient.anticonvulsantSelectedByLearner).toBe(false);
    expect(recovered.patient.antimicrobialSelectedByLearner).toBe(false);
    expect(recovered.patient.drugDeliveredByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
