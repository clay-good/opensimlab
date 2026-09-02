/**
 * Reference transcripts for the post-drainage pneumothorax lesson, replayed
 * through the real engine.
 *
 * This lesson has two independent lanes rather than one chain: after the
 * drainage response is reviewed, the drain system and the definitive planning
 * can be opened in either order, and the handoff waits for both. So the error
 * path is handing off with one lane still empty, which is how a persistent air
 * leak leaves the room without a pleural owner attached to it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SPONTANEOUS_TENSION_PNEUMOTHORAX_POST_DRAINAGE_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/spontaneous-tension-pneumothorax-post-drainage-reassessment';
import { POST_TENSION_PNEUMOTHORAX_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/spontaneous-tension-pneumothorax-post-drainage-reassessment-fixtures';
import type { PostTensionPneumothoraxAction } from '../../src/modules/respiratory-medicine/spontaneous-tension-pneumothorax-post-drainage-reassessment';
import { postTensionPneumothoraxCompletionEvidence } from '../../src/modules/respiratory-medicine/spontaneous-tension-pneumothorax-post-drainage-reassessment-completion';
import { postTensionPneumothoraxInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/spontaneous-tension-pneumothorax-post-drainage-reassessment-guidance';

type Choices = readonly (readonly [number, PostTensionPneumothoraxAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PostTensionPneumothoraxAction): LearnerAction => ({ tick, type: 'spontaneous-tension-pneumothorax-post-drainage-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.postTensionPneumothoraxAssessment);
    const prompt = postTensionPneumothoraxInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      postTensionPneumothorax: frame.equipment.resuscitation.postTensionPneumothoraxAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.postTensionPneumothoraxAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.postTensionPneumothoraxAssessment! };
}

describe('Post-drainage pneumothorax transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    // Five objectives rather than six, so the cap is not outstanding here and
    // only the two runtime requirements remain.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(postTensionPneumothoraxCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(9);
    expect(postTensionPneumothoraxCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(postTensionPneumothoraxCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(postTensionPneumothoraxCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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

  it('refuses the handoff while the planning lane is still empty', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({ etiologyAtTick: null, handoffAtTick: null });
    // Reading the drain system first is fine — the two lanes are independent.
    // Handing off before the planning lane exists is the failure.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('handoff-order-refused');
  });

  it('lets the same run recover, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The counterfactual is that the early error stays visible after the correction.
    expect(JSON.stringify(recovered.events)).toContain('handoff-order-refused');
    expect(recovered.patient.decompressionPerformedByLearner).toBe(false);
    expect(recovered.patient.chestDrainPlacedByLearner).toBe(false);
    expect(recovered.patient.drainManipulatedByLearner).toBe(false);
    expect(recovered.patient.suctionOrClampSelected).toBe(false);
    expect(recovered.patient.deviceOrSiteSelected).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.medicationDeliveredByLearner).toBe(false);
    expect(recovered.patient.testAcquiredByLearner).toBe(false);
    expect(recovered.patient.procedurePerformedByLearner).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.recurrencePredicted).toBe(false);
    expect(recovered.patient.priorTensionPhysiologyAuthored).toBe(true);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
