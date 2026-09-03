/**
 * Reference transcripts for the acute-aortic-syndrome lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that every pathway decision is gated
 * behind repeating an examination that was symmetric the first time.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ACUTE_AORTIC_SYNDROME as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-aortic-syndrome';
import { ACUTE_AORTIC_SYNDROME_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/acute-aortic-syndrome-fixtures';
import {
  ACUTE_AORTIC_SYNDROME_ACTIONS, ACUTE_AORTIC_SYNDROME_OBJECTIVES,
  supportsAcuteAorticSyndrome, type AcuteAorticSyndromeAction,
} from '../../src/modules/emergency-medicine/acute-aortic-syndrome';
import { acuteAorticSyndromeCompletionEvidence } from '../../src/modules/emergency-medicine/acute-aortic-syndrome-completion';
import { acuteAorticSyndromeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/acute-aortic-syndrome-guidance';

type Choices = readonly (readonly [number, AcuteAorticSyndromeAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AcuteAorticSyndromeAction): LearnerAction => ({ tick, type: 'acute-aortic-syndrome-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.acuteAorticSyndromeAssessment);
    const prompt = acuteAorticSyndromeInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.acuteAorticSyndromeAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.acuteAorticSyndromeAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.acuteAorticSyndromeAssessment! };
}

describe('Acute aortic syndrome transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    // Six recorded steps against five declared objectives: emergency medicine does
    // not share critical care's five-and-five shape.
    expect(ACUTE_AORTIC_SYNDROME_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsAcuteAorticSyndrome(SCENARIO)).toBe(true);
    expect(supportsAcuteAorticSyndrome({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'acute-aortic-syndrome-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(acuteAorticSyndromeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(acuteAorticSyndromeCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(acuteAorticSyndromeCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(acuteAorticSyndromeCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    // Only one of the five overlaps, so comparing the action array would let the
    // guard pass on a scenario the engine cannot actually run.
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ACUTE_AORTIC_SYNDROME_OBJECTIVES]);
    expect([...ACUTE_AORTIC_SYNDROME_OBJECTIVES]).not.toEqual([...ACUTE_AORTIC_SYNDROME_ACTIONS]);
    expect(supportsAcuteAorticSyndrome({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: ACUTE_AORTIC_SYNDROME_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: ACUTE_AORTIC_SYNDROME_ACTIONS[index]!,
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
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.handedOffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.initialReviewedAtTick).toBeNull();
  });

  it('refuses the pathway when the symmetric examination was never repeated', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.initialReviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      evolutionReviewedAtTick: null, escalatedAtTick: null,
      antiImpulseAtTick: null, imagingAtTick: null, handedOffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Repeat bilateral pressures, pulses, limb perfusion, and neurologic findings before selecting a pathway');
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handedOffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the incomplete initial pain, ECG, bilateral pressure, pulse, perfusion, and neurologic pattern first');
    expect(transcript).toContain('Record monitored analgesia and rate-first, perfusion-preserving anti-impulse intent before imaging workflow');
    expect(recovered.patient.initialReviewedAtTick).toBeLessThan(recovered.patient.evolutionReviewedAtTick!);
    expect(recovered.patient.evolutionReviewedAtTick).toBeLessThan(recovered.patient.escalatedAtTick!);
    expect(recovered.patient.escalatedAtTick).toBeLessThan(recovered.patient.antiImpulseAtTick!);
    expect(recovered.patient.antiImpulseAtTick).toBeLessThan(recovered.patient.imagingAtTick!);
    expect(recovered.patient.imagingAtTick).toBeLessThan(recovered.patient.handedOffAtTick!);
  });

  it('refuses every later step before the initial pattern is reviewed', () => {
    for (const action of ACUTE_AORTIC_SYNDROME_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the incomplete initial pain, ECG, bilateral pressure, pulse, perfusion, and neurologic pattern first');
      expect(refused.patient.initialReviewedAtTick).toBeNull();
    }
  });

  it('refuses the handoff until definitive imaging has been prioritized', () => {
    const short = run([[0, 'review-aortic-initial-pattern'], [1, 'repeat-aortic-asymmetry-exam'],
      [2, 'activate-aortic-pathway'], [3, 'record-aortic-anti-impulse-intent'],
      [4, 'repeat-and-handoff-aortic-evolution']], 6);
    expect(JSON.stringify(short.events))
      .toContain('Prioritize urgent definitive aortic imaging before the final serial handoff');
    expect(short.patient.handedOffAtTick).toBeNull();
  });
});
