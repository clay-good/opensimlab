/**
 * Reference transcripts for the foreign-body airway lesson, replayed through
 * the real engine.
 *
 * This lesson walks down a three-rung deterioration ladder with a time gate at
 * every rung, and it ends with the object never seen. The assertions pin both:
 * the gates hold, and nothing anywhere declares an arrest, proves a pulse loss,
 * or reports the airway cleared.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PEDIATRIC_FOREIGN_BODY_AIRWAY_OBSTRUCTION as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-foreign-body-airway-obstruction';
import { PEDIATRIC_FBAO_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-fbao-fixtures';
import type { PediatricFbaoAction } from '../../src/modules/pediatrics/pediatric-foreign-body-airway-obstruction';
import { pediatricFbaoCompletionEvidence } from '../../src/modules/pediatrics/pediatric-fbao-completion';
import { pediatricFbaoInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-fbao-guidance';

type Choices = readonly (readonly [number, PediatricFbaoAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PediatricFbaoAction): LearnerAction => ({ tick, type: 'pediatric-foreign-body-airway-obstruction-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pediatricForeignBodyAirwayObstructionAssessment);
    const prompt = pediatricFbaoInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pediatricForeignBodyAirwayObstructionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pediatricForeignBodyAirwayObstructionAssessment)).toBe(before);
    // An ECG trace at the bottom rung never becomes an arrest, and no maneuver
    // ever becomes the learner's, on any frame of any path.
    const patient = frame.equipment.resuscitation.pediatricForeignBodyAirwayObstructionAssessment;
    if (patient) {
      expect(patient.cardiacArrestDeclared).toBe(false);
      expect(patient.pulseLossProven).toBe(false);
      expect(patient.objectClearanceReported).toBe(false);
      expect(patient.blindFingerSweepPerformedByLearner).toBe(false);
      expect(patient.abdominalThrustsPerformedByLearner).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pediatricForeignBodyAirwayObstructionAssessment! };
}

describe('Foreign-body airway transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'pediatrics', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pediatricFbaoCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toHaveLength(10);
    expect(pediatricFbaoCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pediatricFbaoCompletionEvidence(SCENARIO, 'changed', 'pediatrics')).toEqual([]);
    expect(pediatricFbaoCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'pediatrics')).toEqual([]);
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
    expect(idle.patient.reconciledAtTick).toBeNull();
  });

  it('refuses a deterioration declared in the minute the cough was preserved', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.effectiveCoughAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      severeResponsiveAtTick: null, responsivePathwayAtTick: null,
      unresponsivePathwayAtTick: null, handoffAtTick: null,
    });
    expect(errored.patient.severeResponsiveTransitionAuthored).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Allow elapsed simulated time before reviewing the fixed minute-2 transition');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('walks all three deterioration gates and still reaches a correct handoff', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the witnessed event, cough, airflow, responsiveness, breathing, pulse, perfusion, and whole-child trajectory first');
    expect(transcript).toContain('Allow elapsed simulated time before reviewing the fixed minute-2 transition');
    expect(transcript).toContain('Allow elapsed simulated time before reviewing the fixed minute-3 unresponsive transition');
    expect(transcript).toContain('Allow another simulated tick before handing off');
    // The ladder held: every rung landed strictly after the one below it.
    expect(recovered.patient.reconciledAtTick).toBeLessThan(recovered.patient.effectiveCoughAtTick!);
    expect(recovered.patient.effectiveCoughAtTick).toBeLessThan(recovered.patient.severeResponsiveAtTick!);
    expect(recovered.patient.severeResponsiveAtTick).toBeLessThan(recovered.patient.responsivePathwayAtTick!);
    expect(recovered.patient.responsivePathwayAtTick).toBeLessThan(recovered.patient.unresponsivePathwayAtTick!);
    expect(recovered.patient.unresponsivePathwayAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('takes the child down the ladder without ever calling it an arrest', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.witnessedAbruptChokingAuthored).toBe(true);
    expect(expert.patient.initialEffectiveCoughAuthored).toBe(true);
    expect(expert.patient.continuousSurveillanceAuthored).toBe(true);
    // Middle rung: responsive, and a pulse is present.
    expect(expert.patient.severeResponsiveTransitionAuthored).toBe(true);
    expect(expert.patient.severeResponsivePulsePresent).toBe(true);
    expect(expert.patient.qualifiedResponsivePathwayActive).toBe(true);
    // Bottom rung: unresponsive, and pulse status is deliberately withheld.
    expect(expert.patient.unresponsiveNoNormalBreathingAuthored).toBe(true);
    expect(expert.patient.unresponsivePulseStatusUnavailable).toBe(true);
    expect(expert.patient.qualifiedUnresponsiveCprPathwayActive).toBe(true);
    expect(expert.patient.cardiacArrestDeclared).toBe(false);
    expect(expert.patient.pulseLossProven).toBe(false);
    // And nothing about the object was ever settled.
    expect(expert.patient.objectClearanceReported).toBe(false);
    expect(expert.patient.completeClearanceProven).toBe(false);
    expect(expert.patient.aspirationExcluded).toBe(false);
    expect(expert.patient.airwayInjuryExcluded).toBe(false);
    expect(expert.patient.roscReported).toBe(false);
  });

  it('certifies that no maneuver and no sweep was ever the learner’s', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.responsivenessAssessedByLearner).toBe(false);
    expect(recovered.patient.pulseAssessedByLearner).toBe(false);
    expect(recovered.patient.coughAssessedByLearner).toBe(false);
    expect(recovered.patient.objectVisualizedByLearner).toBe(false);
    expect(recovered.patient.objectRemovedByLearner).toBe(false);
    expect(recovered.patient.backBlowsPerformedByLearner).toBe(false);
    expect(recovered.patient.abdominalThrustsPerformedByLearner).toBe(false);
    expect(recovered.patient.chestThrustsPerformedByLearner).toBe(false);
    expect(recovered.patient.blindFingerSweepPerformedByLearner).toBe(false);
    expect(recovered.patient.cprDeliveredByLearner).toBe(false);
    expect(recovered.patient.chestCompressionsDeliveredByLearner).toBe(false);
    expect(recovered.patient.suctionPerformedByLearner).toBe(false);
    expect(recovered.patient.laryngoscopyPerformedByLearner).toBe(false);
    expect(recovered.patient.forcepsUsedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
  });
});
