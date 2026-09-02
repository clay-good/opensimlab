/**
 * Reference transcripts for the high-neuraxial-block lesson, replayed through
 * the real engine.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: work out how high the block has gone before calling for
 * someone who can manage an airway. It is an ordering error rather than a
 * treatment error, because this lesson delivers no treatment. What it skips is
 * the activation, and the block is still ascending while the assessment
 * happens.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { HIGH_NEURAXIAL_BLOCK_OBSTETRIC_COORDINATION as SCENARIO } from '../../src/modules/obstetrics/scenarios/high-neuraxial-block-obstetric-coordination';
import { HIGH_NEURAXIAL_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/high-neuraxial-block-obstetric-coordination-fixtures';
import type { HighNeuraxialAction } from '../../src/modules/obstetrics/high-neuraxial-block-obstetric-coordination';
import { highNeuraxialCompletionEvidence } from '../../src/modules/obstetrics/high-neuraxial-block-obstetric-coordination-completion';
import { highNeuraxialInlinePrompt } from '../../src/modules/obstetrics/tutor/high-neuraxial-block-obstetric-coordination-guidance';

type Choices = readonly (readonly [number, HighNeuraxialAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HighNeuraxialAction): LearnerAction => ({ tick, type: 'high-neuraxial-block-obstetric-coordination-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.obstetricsHighNeuraxialAssessment);
    const prompt = highNeuraxialInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      highNeuraxial: frame.equipment.resuscitation.obstetricsHighNeuraxialAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.obstetricsHighNeuraxialAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.obstetricsHighNeuraxialAssessment! };
}

describe('High-neuraxial-block transcripts through the real engine and debrief', () => {
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
    expect(highNeuraxialCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toHaveLength(9);
    expect(highNeuraxialCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(highNeuraxialCompletionEvidence(SCENARIO, 'changed', 'obstetrics')).toEqual([]);
    expect(highNeuraxialCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'obstetrics')).toEqual([]);
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
    // Establishing the level is not the failure. Doing it before airway-capable
    // help is on the way is, because the block is still climbing and any level
    // established is the one it has already passed.
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
    expect(recovered.patient.blockAssessedByLearner).toBe(false);
    expect(recovered.patient.monitoringInterpretedByLearner).toBe(false);
    expect(recovered.patient.diagnosisMadeByLearner).toBe(false);
    expect(recovered.patient.injectionOrInfusionChangedByLearner).toBe(false);
    expect(recovered.patient.positionChangedByLearner).toBe(false);
    expect(recovered.patient.airwayManagedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.ventilationDeliveredByLearner).toBe(false);
    expect(recovered.patient.circulationSupportedByLearner).toBe(false);
    expect(recovered.patient.drugDoseConcentrationRouteRateTargetSelectedByLearner).toBe(false);
    expect(recovered.patient.anesthesiaSelectedByLearner).toBe(false);
    expect(recovered.patient.birthPlanSelectedByLearner).toBe(false);
    expect(recovered.patient.deliveryPerformedByLearner).toBe(false);
    expect(recovered.patient.newbornAssessedByLearner).toBe(false);
    expect(recovered.patient.blockRecessionProven).toBe(false);
    expect(recovered.patient.fetalRecoveryProven).toBe(false);
    expect(recovered.patient.treatmentEffectProven).toBe(false);
    expect(recovered.patient.awarenessExcluded).toBe(false);
    expect(recovered.patient.safetyDispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
