/**
 * Reference transcripts for the failed-intubation lesson, replayed through the
 * real engine.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: take stock of the airway before declaring the failure out
 * loud. It is an ordering error rather than a treatment error, because this
 * lesson touches no airway. What it skips is the declaration, which is the
 * thing that stops another attempt from happening.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { FAILED_OBSTETRIC_INTUBATION_OXYGENATION_FIRST as SCENARIO } from '../../src/modules/obstetrics/scenarios/failed-obstetric-intubation-oxygenation-first';
import { FAILED_INTUBATION_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/failed-obstetric-intubation-oxygenation-first-fixtures';
import type { FailedIntubationAction } from '../../src/modules/obstetrics/failed-obstetric-intubation-oxygenation-first';
import { failedIntubationCompletionEvidence } from '../../src/modules/obstetrics/failed-obstetric-intubation-oxygenation-first-completion';
import { failedIntubationInlinePrompt } from '../../src/modules/obstetrics/tutor/failed-obstetric-intubation-oxygenation-first-guidance';

type Choices = readonly (readonly [number, FailedIntubationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: FailedIntubationAction): LearnerAction => ({ tick, type: 'failed-obstetric-intubation-oxygenation-first-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsFailedIntubationAssessment);
    const prompt = failedIntubationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      failedIntubation: frame.equipment.resuscitation.obstetricsFailedIntubationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsFailedIntubationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsFailedIntubationAssessment! };
}

describe('Failed-intubation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'obstetrics', 'delivery-room', 'state_transition');
    expect(audit.complete).toBe(false);
    // The objectives cap is a content-design decision across several modules,
    // and the two runtime requirements need people and hardware. Nothing else
    // remains.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(failedIntubationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(failedIntubationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(failedIntubationCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(failedIntubationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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
    expect(idle.patient.supportAtTick).toBeNull();
  });

  it('refuses every later step before the coordinated response has been activated', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      supportAtTick: null, contextAtTick: null, safetyAtTick: null,
      decisionAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Taking stock is not the failure. Doing it before the failed intubation is
    // declared is, because the declaration is what stops a third attempt and
    // repeated attempts are what cause the harm.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('support-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('support-order-refused');
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.monitoringInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.airwayManagedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.airwayDeviceSelectedOrManipulatedByLearner).toBe(false);
    expect(recovered.patient.positionChangedByLearner).toBe(false);
    expect(recovered.patient.suctionOrFrontOfNeckAccessPerformedByLearner).toBe(false);
    expect(recovered.patient.drugDoseDeviceAnesthesiaOrBirthPlanSelectedByLearner).toBe(false);
    expect(recovered.patient.wakeOrProceedDecisionMadeByLearner).toBe(false);
    expect(recovered.patient.surgeryPerformedByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.newbornAssessedByLearner).toBe(false);
    expect(recovered.patient.airwaySafetyProven).toBe(false);
    expect(recovered.patient.aspirationExcluded).toBe(false);
    expect(recovered.patient.awarenessExcluded).toBe(false);
    expect(recovered.patient.fetalRecoveryProven).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
