/**
 * Reference transcripts for the amniotic-fluid-embolism lesson, replayed
 * through the real engine.
 *
 * This is the one lesson in the module whose response comes before its
 * understanding, so the error path is the ordinary instinct rather than an
 * exotic one: work out what is happening before calling the room. It is an
 * ordering error rather than a treatment error, because this lesson delivers
 * no treatment. What it skips is the activation, and everything that follows
 * refuses until it has happened.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SUSPECTED_AMNIOTIC_FLUID_EMBOLISM_PATTERN as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-amniotic-fluid-embolism-pattern';
import { AFE_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/suspected-amniotic-fluid-embolism-pattern-fixtures';
import type { AfeAction } from '../../src/modules/obstetrics/suspected-amniotic-fluid-embolism-pattern';
import { afeCompletionEvidence } from '../../src/modules/obstetrics/suspected-amniotic-fluid-embolism-pattern-completion';
import { afeInlinePrompt } from '../../src/modules/obstetrics/tutor/suspected-amniotic-fluid-embolism-pattern-guidance';

type Choices = readonly (readonly [number, AfeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AfeAction): LearnerAction => ({ tick, type: 'suspected-amniotic-fluid-embolism-pattern-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsAfeAssessment);
    const prompt = afeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      afe: frame.equipment.resuscitation.obstetricsAfeAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsAfeAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsAfeAssessment! };
}

describe('Amniotic-fluid-embolism transcripts through the real engine and debrief', () => {
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
    expect(afeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(afeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(afeCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(afeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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
      supportAtTick: null, trajectoryAtTick: null, recognitionAtTick: null,
      evidenceAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Working out what is happening is not the failure. Doing it before the
    // room is called is, because there is no confirmatory test to reach and
    // the interval spent deciding is the interval she does not have.
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
    expect(recovered.patient.pulseAssessedByLearner).toBe(false);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.bloodLossMeasuredByLearner).toBe(false);
    expect(recovered.patient.uterusOrGenitalTractAssessedByLearner).toBe(false);
    expect(recovered.patient.laboratoryAcquiredByLearner).toBe(false);
    expect(recovered.patient.dicScoreCalculatedByLearner).toBe(false);
    expect(recovered.patient.imagingOrEchoAcquiredByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.alternativeExcludedByLearner).toBe(false);
    expect(recovered.patient.oxygenOrVentilationSelectedByLearner).toBe(false);
    expect(recovered.patient.fluidOrVasoactiveSelectedByLearner).toBe(false);
    expect(recovered.patient.bloodOrCoagulationProductSelectedByLearner).toBe(false);
    expect(recovered.patient.cprOrDefibrillationPerformedByLearner).toBe(false);
    expect(recovered.patient.ecmoSelectedByLearner).toBe(false);
    expect(recovered.patient.deliveryOrProcedureSelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.cardiacArrestOccurred).toBe(false);
    expect(recovered.patient.respiratoryRecoveryProven).toBe(false);
    expect(recovered.patient.hemodynamicRecoveryProven).toBe(false);
    expect(recovered.patient.bleedingControlProven).toBe(false);
    expect(recovered.patient.coagulopathyControlProven).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
