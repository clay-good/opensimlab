/**
 * Reference transcripts for the emergency status-epilepticus lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the lorazepam is gated behind the
 * stabilisation bundle, and the strongest single reason is the smallest item
 * on that bundle: a point-of-care glucose.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/status-epilepticus';
import { STATUS_EPILEPTICUS_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/status-epilepticus-fixtures';
import {
  STATUS_EPILEPTICUS_ACTIONS, STATUS_EPILEPTICUS_OBJECTIVES,
  supportsStatusEpilepticus, type StatusEpilepticusAction,
} from '../../src/modules/emergency-medicine/status-epilepticus';
import { statusEpilepticusCompletionEvidence } from '../../src/modules/emergency-medicine/status-epilepticus-completion';
import { statusEpilepticusInlinePrompt } from '../../src/modules/emergency-medicine/tutor/status-epilepticus-guidance';

type Choices = readonly (readonly [number, StatusEpilepticusAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: StatusEpilepticusAction): LearnerAction => ({ tick, type: 'status-epilepticus-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.statusEpilepticusAssessment);
    const prompt = statusEpilepticusInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.statusEpilepticusAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.statusEpilepticusAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.statusEpilepticusAssessment! };
}

describe('Emergency status epilepticus transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(STATUS_EPILEPTICUS_ACTIONS).toHaveLength(4);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsStatusEpilepticus(SCENARIO)).toBe(true);
    expect(supportsStatusEpilepticus({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'status-epilepticus'),
    })).toBe(false);
    expect(statusEpilepticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(statusEpilepticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(statusEpilepticusCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(statusEpilepticusCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...STATUS_EPILEPTICUS_OBJECTIVES]);
    expect([...STATUS_EPILEPTICUS_OBJECTIVES]).not.toEqual([...STATUS_EPILEPTICUS_ACTIONS]);
    expect(supportsStatusEpilepticus({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: STATUS_EPILEPTICUS_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: STATUS_EPILEPTICUS_ACTIONS[index]!,
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
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.reviewedAtTick).toBeNull();
  });

  it('returns the glucose in the bundle and keeps the second-line boundary', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const text = JSON.stringify(expert.events);
    expect(text).toContain('point-of-care glucose of 118 mg/dL');
    expect(text).toContain('protected from injury without restraint');
    expect(text).toContain('The modeled convulsions stop on the next physiology update');
    expect(text).toContain('Persistent or recurrent seizure would require prompt second-line antiseizure therapy');
  });

  it('refuses the lorazepam when the bundle and the glucose were skipped', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.reviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      supportedAtTick: null, lorazepamAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record immediate stabilization and point-of-care glucose before the medication action.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review seizure type, duration, recovery, airway, breathing, circulation, and glucose status first.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.reviewedAtTick).toBeLessThan(recovered.patient.supportedAtTick!);
    expect(recovered.patient.supportedAtTick).toBeLessThan(recovered.patient.lorazepamAtTick!);
    expect(recovered.patient.lorazepamAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the convulsive pattern is reviewed', () => {
    for (const action of STATUS_EPILEPTICUS_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review seizure type, duration, recovery, airway, breathing, circulation, and glucose status first.');
      expect(refused.patient.reviewedAtTick).toBeNull();
    }
  });

  it('refuses a reassessment recorded on the same tick as the drug', () => {
    const early = run([
      [0, 'review-convulsive-status'],
      [1, 'record-status-stabilization'],
      [2, 'give-lorazepam-4-mg-iv'],
      [2, 'reassess-after-lorazepam'],
    ], 4);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
