/**
 * Reference transcripts for the emergency anaphylaxis lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that the intramuscular epinephrine is
 * gated ahead of both supportive adjuncts, so oxygen and a fluid bolus cannot
 * be recorded as though they were how you get ready for the drug.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ANAPHYLAXIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/anaphylaxis';
import { EMERGENCY_ANAPHYLAXIS_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/emergency-anaphylaxis-fixtures';
import {
  EMERGENCY_ANAPHYLAXIS_ACTIONS, EMERGENCY_ANAPHYLAXIS_OBJECTIVES,
  EMERGENCY_ANAPHYLAXIS_PARALLEL_ACTIONS, supportsEmergencyAnaphylaxis,
  type EmergencyAnaphylaxisAction,
} from '../../src/modules/emergency-medicine/emergency-anaphylaxis';
import { emergencyAnaphylaxisCompletionEvidence } from '../../src/modules/emergency-medicine/emergency-anaphylaxis-completion';
import { emergencyAnaphylaxisInlinePrompt } from '../../src/modules/emergency-medicine/tutor/emergency-anaphylaxis-guidance';

type Choices = readonly (readonly [number, EmergencyAnaphylaxisAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: EmergencyAnaphylaxisAction): LearnerAction => ({ tick, type: 'emergency-anaphylaxis-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.emergencyAnaphylaxisAssessment);
    const prompt = emergencyAnaphylaxisInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.emergencyAnaphylaxisAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.emergencyAnaphylaxisAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.emergencyAnaphylaxisAssessment! };
}

describe('Emergency anaphylaxis transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(EMERGENCY_ANAPHYLAXIS_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsEmergencyAnaphylaxis(SCENARIO)).toBe(true);
    expect(supportsEmergencyAnaphylaxis({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'anaphylaxis'),
    })).toBe(false);
    expect(emergencyAnaphylaxisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(emergencyAnaphylaxisCompletionEvidence(SCENARIO, ENGINE_VERSION, 'pediatrics')).toEqual([]);
    expect(emergencyAnaphylaxisCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(emergencyAnaphylaxisCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...EMERGENCY_ANAPHYLAXIS_OBJECTIVES]);
    expect([...EMERGENCY_ANAPHYLAXIS_OBJECTIVES]).not.toEqual([...EMERGENCY_ANAPHYLAXIS_ACTIONS.slice(0, 4)]);
    expect(supportsEmergencyAnaphylaxis({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: EMERGENCY_ANAPHYLAXIS_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: EMERGENCY_ANAPHYLAXIS_ACTIONS[index]!,
        })),
      },
    })).toBe(false);
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
      .toEqual(['met', 'met', 'met', 'met']);
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    expect(expert.patient.imEpinephrineAtTick).toBeLessThan(expert.patient.oxygenAtTick!);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('refuses both adjuncts while the intramuscular epinephrine is outstanding', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.positionedAndHelpedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      imEpinephrineAtTick: null, oxygenAtTick: null, crystalloidAtTick: null,
      reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record first-line intramuscular epinephrine before supportive adjuncts.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses the skipped positioning and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the fixed systemic pattern before recording response actions.');
    expect(transcript).toContain('Record positioning and emergency help before first-line treatment.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.positionedAndHelpedAtTick!);
    expect(recovered.patient.positionedAndHelpedAtTick).toBeLessThan(recovered.patient.imEpinephrineAtTick!);
    expect(recovered.patient.imEpinephrineAtTick).toBeLessThan(recovered.patient.crystalloidAtTick!);
  });

  it('refuses every later step before the systemic pattern is reviewed', () => {
    for (const action of EMERGENCY_ANAPHYLAXIS_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the fixed systemic pattern before recording response actions.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('accepts the two adjuncts in either order, because neither gates the other', () => {
    const orders: readonly (readonly EmergencyAnaphylaxisAction[])[] = [
      ['give-high-flow-oxygen', 'begin-fixed-crystalloid'],
      ['begin-fixed-crystalloid', 'give-high-flow-oxygen'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-systemic-pattern'],
        [1, 'position-and-call-for-help'],
        [2, 'give-im-epinephrine'],
        ...order.map((action, index) => [index + 3, action] as const),
        [5, 'reassess-response'],
      ];
      const done = run(actions, 7);
      expect(done.patient.reassessedAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met']);
    }
    expect(EMERGENCY_ANAPHYLAXIS_PARALLEL_ACTIONS).toHaveLength(2);
  });

  it('refuses a reassessment recorded on the same tick as the second adjunct', () => {
    const early = run([
      [0, 'review-systemic-pattern'],
      [1, 'position-and-call-for-help'],
      [2, 'give-im-epinephrine'],
      [3, 'give-high-flow-oxygen'],
      [4, 'begin-fixed-crystalloid'],
      [4, 'reassess-response'],
    ], 6);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
