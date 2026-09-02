/**
 * Reference transcripts for the pediatric anaphylaxis lesson, replayed through
 * the real engine.
 *
 * Two things this file pins. The engine ordering that puts the repeat dose
 * before the broader review, because the interval is the treatment. And that
 * nothing the minute-18 report contains ever closes a question.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_ANAPHYLAXIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-anaphylaxis';
import { PEDIATRIC_ANAPHYLAXIS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-anaphylaxis-fixtures';
import type { PediatricAnaphylaxisAction } from '../../src/modules/pediatrics/pediatric-anaphylaxis';
import { pediatricAnaphylaxisCompletionEvidence } from '../../src/modules/pediatrics/pediatric-anaphylaxis-completion';
import { pediatricAnaphylaxisInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-anaphylaxis-guidance';

type Choices = readonly (readonly [number, PediatricAnaphylaxisAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricAnaphylaxisAction): LearnerAction => ({ tick, type: 'pediatric-anaphylaxis-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricAnaphylaxisAssessment);
    const prompt = pediatricAnaphylaxisInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricAnaphylaxisAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricAnaphylaxisAssessment)).toBe(before);
    // Improvement after epinephrine closes nothing, on any frame of any path.
    const patient = frame.equipment.resuscitation.pediatricAnaphylaxisAssessment;
    if (patient) {
      expect(patient.anaphylaxisFinallyProven).toBe(false);
      expect(patient.triggerConfirmed).toBe(false);
      expect(patient.airwayRiskResolved).toBe(false);
      expect(patient.shockResolved).toBe(false);
      expect(patient.biphasicReactionExcluded).toBe(false);
      expect(patient.refractoryAnaphylaxisExcluded).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricAnaphylaxisAssessment! };
}

describe('Pediatric anaphylaxis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricAnaphylaxisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricAnaphylaxisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pediatricAnaphylaxisCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricAnaphylaxisCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the broader review until the repeat dose has an owner', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      firstLineAtTick: null, safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
    });
    expect(errored.patient.qualifiedFirstLineOwnershipActive).toBe(false);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Activate immediate qualified first-line ownership before broader safety review');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from the same refusal and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied exposure, qualified care, and whole-child trajectory first');
    expect(transcript).toContain('Activate immediate qualified first-line ownership before broader safety review');
    expect(transcript).toContain('Allow elapsed simulated time after qualified first-line and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    // The strict line held: every step landed in the declared order.
    expect(recovered.patient.trajectoryAtTick).toBeLessThan(recovered.patient.recognitionAtTick!);
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.firstLineAtTick!);
    expect(recovered.patient.firstLineAtTick).toBeLessThan(recovered.patient.safetyAtTick!);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('keeps a child with no rash in anaphylaxis and closes nothing at the end', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.plausibleExposureAuthored).toBe(true);
    expect(expert.patient.multisystemCompromiseAuthored).toBe(true);
    expect(expert.patient.firstLineCareAuthored).toBe(true);
    expect(expert.patient.laterReportAuthored).toBe(true);
    expect(expert.patient.anaphylaxisFinallyProven).toBe(false);
    expect(expert.patient.triggerConfirmed).toBe(false);
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.airwayRiskResolved).toBe(false);
    expect(expert.patient.shockResolved).toBe(false);
    expect(expert.patient.refractoryAnaphylaxisExcluded).toBe(false);
    expect(expert.patient.biphasicReactionExcluded).toBe(false);
    expect(expert.patient.recurrenceExcluded).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.dischargeReadinessProven).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });

  it('certifies that no dose and no positioning was ever the learner’s', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.exposureVerifiedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.classificationMadeByLearner).toBe(false);
    expect(recovered.patient.positioningPerformedByLearner).toBe(false);
    expect(recovered.patient.triggerRemovedByLearner).toBe(false);
    expect(recovered.patient.epinephrineSelectedByLearner).toBe(false);
    expect(recovered.patient.productSelectedByLearner).toBe(false);
    expect(recovered.patient.concentrationSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.routeSelectedByLearner).toBe(false);
    expect(recovered.patient.intervalSelectedByLearner).toBe(false);
    expect(recovered.patient.drugDeliveredByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.fluidDeliveredByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
