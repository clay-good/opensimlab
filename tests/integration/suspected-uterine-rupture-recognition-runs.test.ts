/**
 * Reference transcripts for the uterine-rupture lesson, replayed through the
 * real engine.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: satisfy yourself that this really is a rupture before
 * calling for a theatre. It is an ordering error rather than a treatment
 * error, because this lesson performs no surgery. What it skips is the
 * activation, and the only thing that would confirm the diagnosis is the
 * operation the activation exists to arrange.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SUSPECTED_UTERINE_RUPTURE_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/suspected-uterine-rupture-recognition';
import { UTERINE_RUPTURE_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/suspected-uterine-rupture-recognition-fixtures';
import type { UterineRuptureAction } from '../../src/modules/obstetrics/suspected-uterine-rupture-recognition';
import { uterineRuptureCompletionEvidence } from '../../src/modules/obstetrics/suspected-uterine-rupture-recognition-completion';
import { uterineRuptureInlinePrompt } from '../../src/modules/obstetrics/tutor/suspected-uterine-rupture-recognition-guidance';

type Choices = readonly (readonly [number, UterineRuptureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: UterineRuptureAction): LearnerAction => ({ tick, type: 'suspected-uterine-rupture-recognition-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsUterineRuptureAssessment);
    const prompt = uterineRuptureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      uterineRupture: frame.equipment.resuscitation.obstetricsUterineRuptureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsUterineRuptureAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsUterineRuptureAssessment! };
}

describe('Uterine-rupture transcripts through the real engine and debrief', () => {
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
    expect(uterineRuptureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(uterineRuptureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(uterineRuptureCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(uterineRuptureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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
      supportAtTick: null, contextAtTick: null, uncertaintyAtTick: null,
      readinessAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Wanting to be sure is not the failure. Waiting to be sure before calling
    // for a theatre is, because the only thing that would confirm this is the
    // operation the waiting delays.
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
    expect(recovered.patient.fetalMonitoringInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.infusionChangedByLearner).toBe(false);
    expect(recovered.patient.resuscitationDeliveredByLearner).toBe(false);
    expect(recovered.patient.drugDoseRouteTargetSelectedByLearner).toBe(false);
    expect(recovered.patient.anesthesiaSelectedByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.surgeryPerformedByLearner).toBe(false);
    expect(recovered.patient.repairSelectedByLearner).toBe(false);
    expect(recovered.patient.hysterectomyDeterminedByLearner).toBe(false);
    expect(recovered.patient.newbornCarePerformedByLearner).toBe(false);
    expect(recovered.patient.ruptureOperativelyConfirmed).toBe(false);
    expect(recovered.patient.hemostasisProven).toBe(false);
    expect(recovered.patient.fetalRecoveryProven).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.fertilityOutcomePredicted).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
