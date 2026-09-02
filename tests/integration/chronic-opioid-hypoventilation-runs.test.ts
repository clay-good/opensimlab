/**
 * Reference transcripts for the post-drainage pneumothorax lesson, replayed
 * through the real engine.
 *
 * The evidence and contributor reviews may be completed in either order, so
 * the error path is not a wrong sequence between them. It is coordinating the
 * prescriber, sleep and respiratory plan before either review exists — which
 * is how a clinic ends up changing somebody's long-term analgesia on the
 * strength of a partner's description.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { CHRONIC_OPIOID_RELATED_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/chronic-opioid-related-hypoventilation-reassessment';
import { CHRONIC_OPIOID_HYPOVENTILATION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/chronic-opioid-related-hypoventilation-reassessment-fixtures';
import type { ChronicOpioidHypoventilationAction } from '../../src/modules/respiratory-medicine/chronic-opioid-related-hypoventilation-reassessment';
import { chronicOpioidHypoventilationCompletionEvidence } from '../../src/modules/respiratory-medicine/chronic-opioid-related-hypoventilation-reassessment-completion';
import { chronicOpioidHypoventilationInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/chronic-opioid-related-hypoventilation-reassessment-guidance';

type Choices = readonly (readonly [number, ChronicOpioidHypoventilationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: ChronicOpioidHypoventilationAction): LearnerAction => ({ tick, type: 'chronic-opioid-related-hypoventilation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.chronicOpioidHypoventilationAssessment);
    const prompt = chronicOpioidHypoventilationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      chronicOpioidHypoventilation: frame.equipment.resuscitation.chronicOpioidHypoventilationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.chronicOpioidHypoventilationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.chronicOpioidHypoventilationAssessment! };
}

describe('Opioid-hypoventilation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // Five objectives, so the cap is not outstanding here and only the two
    // runtime requirements remain.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(chronicOpioidHypoventilationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(9);
    expect(chronicOpioidHypoventilationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(chronicOpioidHypoventilationCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(chronicOpioidHypoventilationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.handoffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses the coordinated plan before either review exists', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      evidenceAtTick: null, alternativesAtTick: null,
      coordinatedPlanAtTick: null, handoffAtTick: null,
    });
    // The two reviews may be done in either order. Reaching for a prescriber
    // plan before either of them exists is the failure.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('order-refused');
    expect(recovered.patient.examinationPerformedByLearner).toBe(false);
    expect(recovered.patient.bloodGasAcquiredByLearner).toBe(false);
    expect(recovered.patient.sleepStudyAcquiredByLearner).toBe(false);
    expect(recovered.patient.sleepStudyInterpretedByLearner).toBe(false);
    expect(recovered.patient.drugOrDoseSelected).toBe(false);
    expect(recovered.patient.taperSelected).toBe(false);
    expect(recovered.patient.opioidChangedByLearner).toBe(false);
    expect(recovered.patient.naloxoneSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.supportDeviceSelectedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.diagnosisDetermined).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.opioidCausalityProven).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
