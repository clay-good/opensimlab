/**
 * Reference transcripts for the bradycardic-arrest lesson, replayed through
 * the real engine.
 *
 * This is the only lesson in the module that ends with no outcome at all, and
 * the assertions here pin that: no ROSC is ever reported, no death is ever
 * declared, and no resuscitation is ever terminated.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_BRADYCARDIC_ARREST as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-bradycardic-arrest';
import { PEDIATRIC_BRADYCARDIC_ARREST_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-bradycardic-arrest-fixtures';
import type { PediatricBradycardicArrestAction } from '../../src/modules/pediatrics/pediatric-bradycardic-arrest';
import { pediatricBradycardicArrestCompletionEvidence } from '../../src/modules/pediatrics/pediatric-bradycardic-arrest-completion';
import { pediatricBradycardicArrestInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-bradycardic-arrest-guidance';

type Choices = readonly (readonly [number, PediatricBradycardicArrestAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricBradycardicArrestAction): LearnerAction => ({ tick, type: 'pediatric-bradycardic-arrest-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricBradycardicArrestAssessment);
    const prompt = pediatricBradycardicArrestInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricBradycardicArrestAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricBradycardicArrestAssessment)).toBe(before);
    // Nothing in this lesson ever ends the resuscitation, either way.
    const patient = frame.equipment.resuscitation.pediatricBradycardicArrestAssessment;
    if (patient) {
      expect(patient.roscReported).toBe(false);
      expect(patient.deathDeclared).toBe(false);
      expect(patient.resuscitationTerminated).toBe(false);
      expect(patient.causeProven).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricBradycardicArrestAssessment! };
}

describe('Bradycardic-arrest transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricBradycardicArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricBradycardicArrestCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(pediatricBradycardicArrestCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricBradycardicArrestCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the review until the resuscitation has an owner', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      resuscitationAtTick: null, safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
    });
    expect(errored.patient.qualifiedResuscitationOwnershipActive).toBe(false);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Activate qualified pediatric resuscitation ownership before safety review');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from the same refusal and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied support, rhythm, pulse, perfusion, and whole-child trajectory first');
    expect(transcript).toContain('Activate qualified pediatric resuscitation ownership before safety review');
    expect(transcript).toContain('Allow elapsed simulated time after qualified resuscitation and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.trajectoryAtTick).toBeLessThan(recovered.patient.recognitionAtTick!);
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.resuscitationAtTick!);
    expect(recovered.patient.resuscitationAtTick).toBeLessThan(recovered.patient.safetyAtTick!);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('is the one lesson whose later checkpoint is a deterioration', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.initialPulsePresent).toBe(true);
    expect(expert.patient.effectiveAssistedVentilationAuthored).toBe(true);
    expect(expert.patient.persistentBradycardiaWithCompromiseAuthored).toBe(true);
    // The later report takes her into an arrest rather than out of one.
    expect(expert.patient.laterReportAuthored).toBe(true);
    expect(expert.patient.laterPulseLossAuthored).toBe(true);
    expect(expert.patient.laterPeaAuthored).toBe(true);
    // And nothing resolves after it.
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.roscReported).toBe(false);
    expect(expert.patient.durableRoscProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.neurologicRecoveryProven).toBe(false);
    expect(expert.patient.conductionMechanismProven).toBe(false);
    expect(expert.patient.deathDeclared).toBe(false);
    expect(expert.patient.resuscitationTerminated).toBe(false);
  });

  it('certifies that no compression, no drug and no shock was ever the learner’s', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.pulseAssessedByLearner).toBe(false);
    expect(recovered.patient.ecgInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.causeAssignedByLearner).toBe(false);
    expect(recovered.patient.cprDeliveredByLearner).toBe(false);
    expect(recovered.patient.chestCompressionsDeliveredByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.epinephrineSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.pacingSelectedByLearner).toBe(false);
    expect(recovered.patient.energySelectedByLearner).toBe(false);
    expect(recovered.patient.shockDeliveredByLearner).toBe(false);
    expect(recovered.patient.defibrillationPerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
