/**
 * Reference transcripts for the shoulder-dystocia lesson, replayed through the
 * real engine.
 *
 * The response comes before the understanding here too, so the error path is
 * the ordinary instinct: take in what has happened before calling the
 * emergency and starting the head-delivery clock. It is an ordering error
 * rather than a treatment error, because this lesson performs no maneuver.
 * What it skips is the activation, and the clock it skips is the one every
 * later decision is timed against.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SHOULDER_DYSTOCIA_COGNITIVE_SEQUENCE as SCENARIO } from '../../src/modules/obstetrics/scenarios/shoulder-dystocia-cognitive-sequence';
import { SHOULDER_DYSTOCIA_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/shoulder-dystocia-cognitive-sequence-fixtures';
import type { ShoulderDystociaAction } from '../../src/modules/obstetrics/shoulder-dystocia-cognitive-sequence';
import { shoulderDystociaCompletionEvidence } from '../../src/modules/obstetrics/shoulder-dystocia-cognitive-sequence-completion';
import { shoulderDystociaInlinePrompt } from '../../src/modules/obstetrics/tutor/shoulder-dystocia-cognitive-sequence-guidance';

type Choices = readonly (readonly [number, ShoulderDystociaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ShoulderDystociaAction): LearnerAction => ({ tick, type: 'shoulder-dystocia-cognitive-sequence-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsShoulderDystociaAssessment);
    const prompt = shoulderDystociaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      shoulderDystocia: frame.equipment.resuscitation.obstetricsShoulderDystociaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsShoulderDystociaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsShoulderDystociaAssessment! };
}

describe('Shoulder-dystocia transcripts through the real engine and debrief', () => {
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
    expect(shoulderDystociaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(shoulderDystociaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(shoulderDystociaCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(shoulderDystociaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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
      escalationAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    // Taking in what has happened is not the failure. Doing it before the
    // emergency is called is, because saying the word is what brings the extra
    // hands and the clock runs from the head rather than from the realization.
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
    expect(recovered.patient.tractionAppliedByLearner).toBe(false);
    expect(recovered.patient.pushingDirectedByLearner).toBe(false);
    expect(recovered.patient.positionChangedByLearner).toBe(false);
    expect(recovered.patient.pressureAppliedByLearner).toBe(false);
    expect(recovered.patient.maneuverPerformedByLearner).toBe(false);
    expect(recovered.patient.episiotomySelectedByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.newbornCarePerformedByLearner).toBe(false);
    expect(recovered.patient.drugDoseRouteSelectedByLearner).toBe(false);
    expect(recovered.patient.procedureSelectedByLearner).toBe(false);
    expect(recovered.patient.maternalInjuryDetermined).toBe(false);
    expect(recovered.patient.newbornInjuryDetermined).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
