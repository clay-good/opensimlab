/**
 * Reference transcripts for the complete-heart-block lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that stability never becomes
 * reassurance: the block persists on every frame, nothing is ever paced, and
 * the escalation is accepted before the cause review rather than after it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { COMPLETE_HEART_BLOCK as SCENARIO } from '../../src/modules/cardiology/scenarios/complete-heart-block';
import { COMPLETE_HEART_BLOCK_FIXTURES as FIXTURES } from '../../src/modules/cardiology/complete-heart-block-fixtures';
import {
  COMPLETE_HEART_BLOCK_ACTIONS, supportsCompleteHeartBlock,
  type CompleteHeartBlockAction,
} from '../../src/modules/cardiology/complete-heart-block';
import { completeHeartBlockCompletionEvidence } from '../../src/modules/cardiology/complete-heart-block-completion';
import { completeHeartBlockInlinePrompt } from '../../src/modules/cardiology/tutor/complete-heart-block-guidance';

type Choices = readonly (readonly [number, CompleteHeartBlockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: CompleteHeartBlockAction): LearnerAction => ({ tick, type: 'complete-heart-block-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.completeHeartBlockAssessment);
    const prompt = completeHeartBlockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.completeHeartBlockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.completeHeartBlockAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.completeHeartBlockAssessment;
    if (patient) {
      expect(patient.hemodynamicallyStable).toBe(true);
      expect(patient.pacingDelivered).toBe(false);
      expect(patient.captureAssessed).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.completeHeartBlockAssessment! };
}

describe('Complete heart block transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(COMPLETE_HEART_BLOCK_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...COMPLETE_HEART_BLOCK_ACTIONS]);
    expect(supportsCompleteHeartBlock(SCENARIO)).toBe(true);
    expect(supportsCompleteHeartBlock({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'complete-heart-block-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(completeHeartBlockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(8);
    expect(completeHeartBlockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(completeHeartBlockCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(completeHeartBlockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    // The escalation lands before the cause review, and nothing objects.
    expect(expert.patient.pathwayAtTick).toBeLessThan(expert.patient.contextAtTick!);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.stabilityAtTick).toBeNull();
  });

  it('refuses the reassessment when the escalation was never activated', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.contextAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      pathwayAtTick: null, reassessmentAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Complete both cause review and pacing-capable escalation before reassessing the persistent block');
  });

  it('accepts the unordered pair in the other order and clears the time gate', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the fixed AV-dissociation report, mechanical pulse, and current whole-patient stability first');
    expect(transcript).toContain('Allow a later simulated tick before reviewing persistence');
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.pathwayAtTick!);
    expect(recovered.patient.pathwayAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
    expect(recovered.patient.reassessmentAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the two rhythms are reconciled', () => {
    for (const action of COMPLETE_HEART_BLOCK_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the fixed AV-dissociation report, mechanical pulse, and current whole-patient stability first');
      expect(refused.patient.stabilityAtTick).toBeNull();
    }
  });

  it('leaves the block in place and paces nothing', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.hemodynamicallyStable).toBe(true);
    expect(expert.patient.pacingDelivered).toBe(false);
    expect(expert.patient.captureAssessed).toBe(false);
    expect(JSON.stringify(expert.events)).toContain('the fixed complete AV block persists');
  });
});
