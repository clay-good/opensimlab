/**
 * Reference transcripts for the pediatric SVT lesson, replayed through the
 * real engine.
 *
 * The assertion this file exists for is the one a reported sinus rhythm makes
 * tempting: conversion is a checkpoint, and nothing in this lesson ever proves
 * the mechanism, the cause, the treatment effect, or the durability.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-supraventricular-tachycardia';
import { PEDIATRIC_SVT_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-svt-fixtures';
import type { PediatricSvtAction } from '../../src/modules/pediatrics/pediatric-supraventricular-tachycardia';
import { pediatricSvtCompletionEvidence } from '../../src/modules/pediatrics/pediatric-svt-completion';
import { pediatricSvtInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-svt-guidance';

type Choices = readonly (readonly [number, PediatricSvtAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricSvtAction): LearnerAction => ({ tick, type: 'pediatric-supraventricular-tachycardia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment);
    const prompt = pediatricSvtInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment)).toBe(before);
    // Conversion closes nothing, on any frame of any path.
    const patient = frame.equipment.resuscitation.pediatricSupraventricularTachycardiaAssessment;
    if (patient) {
      expect(patient.svtFinallyProven).toBe(false);
      expect(patient.mechanismProven).toBe(false);
      expect(patient.treatmentEffectProven).toBe(false);
      expect(patient.durableConversionProven).toBe(false);
      expect(patient.recurrenceExcluded).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricSupraventricularTachycardiaAssessment! };
}

describe('Pediatric SVT transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricSvtCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricSvtCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(pediatricSvtCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricSvtCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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

  it('refuses the broader review until the rhythm has an owner', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      careAtTick: null, safetyAtTick: null, laterResponseAtTick: null, handoffAtTick: null,
    });
    expect(errored.patient.qualifiedRhythmCareOwnershipActive).toBe(false);
    expect(errored.patient.qualifiedSafetyReviewActive).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Activate qualified pediatric rhythm-care and resuscitation ownership before safety review');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from the same refusal and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the supplied clock, rhythm, pulse, perfusion, and whole-child trajectory first');
    expect(transcript).toContain('Activate qualified pediatric rhythm-care and resuscitation ownership before safety review');
    expect(transcript).toContain('Allow elapsed simulated time after qualified care and safety ownership are active');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    expect(recovered.patient.trajectoryAtTick).toBeLessThan(recovered.patient.recognitionAtTick!);
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.careAtTick!);
    expect(recovered.patient.careAtTick).toBeLessThan(recovered.patient.safetyAtTick!);
    expect(recovered.patient.safetyAtTick).toBeLessThan(recovered.patient.laterResponseAtTick!);
    expect(recovered.patient.laterResponseAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('reports sinus rhythm and still closes nothing', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.abruptRegularNarrowTachycardiaAuthored).toBe(true);
    expect(expert.patient.probableSvtPatternAuthored).toBe(true);
    expect(expert.patient.perfusionCompromiseAuthored).toBe(true);
    expect(expert.patient.laterReportAuthored).toBe(true);
    expect(expert.patient.laterSinusRhythmAuthored).toBe(true);
    // And every question the conversion invites stays open.
    expect(expert.patient.svtFinallyProven).toBe(false);
    expect(expert.patient.sinusTachycardiaExcluded).toBe(false);
    expect(expert.patient.mechanismProven).toBe(false);
    expect(expert.patient.causeProven).toBe(false);
    expect(expert.patient.treatmentEffectProven).toBe(false);
    expect(expert.patient.durableConversionProven).toBe(false);
    expect(expert.patient.durableRecoveryProven).toBe(false);
    expect(expert.patient.heartFailureExcluded).toBe(false);
    expect(expert.patient.deteriorationExcluded).toBe(false);
    expect(expert.patient.recurrenceExcluded).toBe(false);
    expect(expert.patient.dispositionDetermined).toBe(false);
  });

  it('certifies that the whole escalation ladder stayed with the qualified team', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.ecgAcquiredByLearner).toBe(false);
    expect(recovered.patient.ecgInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.mechanismAssignedByLearner).toBe(false);
    expect(recovered.patient.maneuverPerformedByLearner).toBe(false);
    expect(recovered.patient.accessPlacedByLearner).toBe(false);
    expect(recovered.patient.modalitySelectedByLearner).toBe(false);
    expect(recovered.patient.adenosineSelectedByLearner).toBe(false);
    expect(recovered.patient.doseSelectedByLearner).toBe(false);
    expect(recovered.patient.energySelectedByLearner).toBe(false);
    expect(recovered.patient.sedationSelectedByLearner).toBe(false);
    expect(recovered.patient.cardioversionPerformedByLearner).toBe(false);
    expect(recovered.patient.drugDeliveredByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
