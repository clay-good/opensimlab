/**
 * Reference transcripts for the post-intubation hypotension lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the mechanism is gated behind the
 * danger review, so a story that fits cannot substitute for excluding the two
 * things that kill in minutes.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { POST_INTUBATION_HYPOTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/post-intubation-hypotension';
import { POST_INTUBATION_HYPOTENSION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/post-intubation-hypotension-fixtures';
import {
  POST_INTUBATION_HYPOTENSION_ACTIONS, supportsPostIntubationHypotension,
  type PostIntubationHypotensionAction,
} from '../../src/modules/critical-care/post-intubation-hypotension';
import { postIntubationHypotensionCompletionEvidence } from '../../src/modules/critical-care/post-intubation-hypotension-completion';
import { postIntubationHypotensionInlinePrompt } from '../../src/modules/critical-care/tutor/post-intubation-hypotension-guidance';

type Choices = readonly (readonly [number, PostIntubationHypotensionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PostIntubationHypotensionAction): LearnerAction => ({ tick, type: 'post-intubation-hypotension-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.postIntubationHypotensionAssessment);
    const prompt = postIntubationHypotensionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.postIntubationHypotensionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.postIntubationHypotensionAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.postIntubationHypotensionAssessment! };
}

describe('Post-intubation hypotension transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(POST_INTUBATION_HYPOTENSION_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...POST_INTUBATION_HYPOTENSION_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsPostIntubationHypotension(SCENARIO)).toBe(true);
    expect(supportsPostIntubationHypotension({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'post-intubation-hypotension-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(postIntubationHypotensionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(postIntubationHypotensionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(postIntubationHypotensionCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(postIntubationHypotensionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.reassessmentAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.pressureAtTick).toBeNull();
  });

  it('refuses the mechanism when the dangerous alternatives were never checked', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.pressureAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      dangerAtTick: null, mechanismAtTick: null,
      supportAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review immediate airway, ventilation, rhythm, bleeding, allergy, pump, and obstructive alternatives first');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Validate severe hypotension and call experienced help before classifying its mechanism');
    expect(transcript).toContain('Classify the whole hemodynamic pattern before recording support');
    expect(recovered.patient.pressureAtTick).toBeLessThan(recovered.patient.dangerAtTick!);
    expect(recovered.patient.dangerAtTick).toBeLessThan(recovered.patient.mechanismAtTick!);
    expect(recovered.patient.mechanismAtTick).toBeLessThan(recovered.patient.supportAtTick!);
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the pressure is validated', () => {
    for (const action of POST_INTUBATION_HYPOTENSION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Validate severe hypotension and call experienced help before classifying its mechanism');
      expect(refused.patient.pressureAtTick).toBeNull();
    }
  });

  it('keeps the danger review ahead of the mechanism on the expert path', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.dangerAtTick).toBeLessThan(expert.patient.mechanismAtTick!);
  });
});
