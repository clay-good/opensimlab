/**
 * Reference transcripts for the eclampsia lesson, replayed through the real
 * engine.
 *
 * The error path is the one a stopped seizure invites: go and work out what
 * caused it — the pending imaging, the toxicology, the alternatives — before
 * calling it eclampsia and starting the maternal response. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the naming and the activation, and a second
 * convulsion does not wait for the differential.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ECLAMPSIA_FIRST_SEIZURE_RESPONSE as SCENARIO } from '../../src/modules/obstetrics/scenarios/eclampsia-first-seizure-response';
import { ECLAMPSIA_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/eclampsia-first-seizure-response-fixtures';
import type { EclampsiaAction } from '../../src/modules/obstetrics/eclampsia-first-seizure-response';
import { eclampsiaCompletionEvidence } from '../../src/modules/obstetrics/eclampsia-first-seizure-response-completion';
import { eclampsiaInlinePrompt } from '../../src/modules/obstetrics/tutor/eclampsia-first-seizure-response-guidance';

type Choices = readonly (readonly [number, EclampsiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: EclampsiaAction): LearnerAction => ({ tick, type: 'eclampsia-first-seizure-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsEclampsiaAssessment);
    const prompt = eclampsiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      eclampsia: frame.equipment.resuscitation.obstetricsEclampsiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsEclampsiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsEclampsiaAssessment! };
}

describe('Eclampsia transcripts through the real engine and debrief', () => {
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
    expect(eclampsiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(eclampsiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(eclampsiaCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(eclampsiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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

  it('refuses the evidence review before the eclampsia has been named and the response started', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null,
      reassessmentAtTick: null, handoffAtTick: null,
    });
    // Reviewing the alternatives is not the failure. Reviewing them before
    // naming the eclampsia and starting the response, while a second
    // convulsion is not waiting for the differential, is.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('recognition-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('recognition-order-refused');
    expect(recovered.patient.seizureTimedByLearner).toBe(false);
    expect(recovered.patient.injuryProtectionPerformedByLearner).toBe(false);
    expect(recovered.patient.patientPositionedByLearner).toBe(false);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.fetalStatusInterpretedByLearner).toBe(false);
    expect(recovered.patient.bloodPressureMeasuredByLearner).toBe(false);
    expect(recovered.patient.laboratoryAcquiredByLearner).toBe(false);
    expect(recovered.patient.imagingOrEegAcquiredByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.alternativeExcludedByLearner).toBe(false);
    expect(recovered.patient.magnesiumSelectedByLearner).toBe(false);
    expect(recovered.patient.antihypertensiveSelectedByLearner).toBe(false);
    expect(recovered.patient.airwayOrVentilationSelectedByLearner).toBe(false);
    expect(recovered.patient.deliverySelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.durableSeizureControlProven).toBe(false);
    expect(recovered.patient.durablePressureControlProven).toBe(false);
    expect(recovered.patient.neurologicRecoveryProven).toBe(false);
    expect(recovered.patient.fetalSafetyProven).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
