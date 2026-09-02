/**
 * Reference transcripts for the concealed-abruption lesson, replayed through
 * the real engine.
 *
 * The error path is the one 80 mL of blood invites: go and read the supplied
 * evidence — the placental-location record, the coagulation, the fetal report —
 * before calling this a concealed hemorrhage and bringing the room. It is an
 * ordering error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the naming and the call, and the blood that is
 * not on the floor is still leaving her circulation while the thinking happens.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { CONCEALED_PLACENTAL_ABRUPTION_HEMORRHAGE as SCENARIO } from '../../src/modules/obstetrics/scenarios/concealed-placental-abruption-hemorrhage';
import { CONCEALED_ABRUPTION_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/concealed-placental-abruption-hemorrhage-fixtures';
import type { ConcealedAbruptionAction } from '../../src/modules/obstetrics/concealed-placental-abruption-hemorrhage';
import { concealedAbruptionCompletionEvidence } from '../../src/modules/obstetrics/concealed-placental-abruption-hemorrhage-completion';
import { concealedAbruptionInlinePrompt } from '../../src/modules/obstetrics/tutor/concealed-placental-abruption-hemorrhage-guidance';

type Choices = readonly (readonly [number, ConcealedAbruptionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ConcealedAbruptionAction): LearnerAction => ({ tick, type: 'concealed-placental-abruption-hemorrhage-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsConcealedAbruptionAssessment);
    const prompt = concealedAbruptionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      concealedAbruption: frame.equipment.resuscitation.obstetricsConcealedAbruptionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsConcealedAbruptionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsConcealedAbruptionAssessment! };
}

describe('Concealed-abruption transcripts through the real engine and debrief', () => {
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
    expect(concealedAbruptionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(concealedAbruptionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(concealedAbruptionCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(concealedAbruptionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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

  it('refuses the evidence review before the concealed hemorrhage has been named and the room called', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      recognitionAtTick: null, supportAtTick: null, evidenceAtTick: null,
      reassessmentAtTick: null, handoffAtTick: null,
    });
    // Reading the supplied evidence is not the failure. Reading it before
    // naming the concealed hemorrhage and calling the room, while blood that
    // nobody can see is still leaving her circulation, is.
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
    expect(recovered.patient.bloodLossMeasuredByLearner).toBe(false);
    expect(recovered.patient.totalBloodLossCalculatedByLearner).toBe(false);
    expect(recovered.patient.fetalTraceInterpretedByLearner).toBe(false);
    expect(recovered.patient.ultrasoundAcquiredByLearner).toBe(false);
    expect(recovered.patient.ultrasoundInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.alternativeExcludedByLearner).toBe(false);
    expect(recovered.patient.bloodComponentSelectedByLearner).toBe(false);
    expect(recovered.patient.anesthesiaSelectedByLearner).toBe(false);
    expect(recovered.patient.deliverySelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.concealedLossQuantified).toBe(false);
    expect(recovered.patient.coagulationSafetyProven).toBe(false);
    expect(recovered.patient.fetalRecoveryProven).toBe(false);
    expect(recovered.patient.deliveryCompleted).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.fertilityOutcomePredicted).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
