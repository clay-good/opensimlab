/**
 * Reference transcripts for the post-repositioning tube-migration lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the position panel is gated behind
 * support and help, so a patient at 89% gets oxygen and hands before she gets a
 * name.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ENDOTRACHEAL_TUBE_MIGRATION_AFTER_REPOSITIONING as SCENARIO } from '../../src/modules/critical-care/scenarios/endotracheal-tube-migration-after-repositioning';
import { TUBE_MIGRATION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/tube-migration-fixtures';
import {
  TUBE_MIGRATION_ACTIONS, supportsTubeMigration, type TubeMigrationAction,
} from '../../src/modules/critical-care/tube-migration';
import { tubeMigrationCompletionEvidence } from '../../src/modules/critical-care/tube-migration-completion';
import { tubeMigrationInlinePrompt } from '../../src/modules/critical-care/tutor/tube-migration-guidance';

type Choices = readonly (readonly [number, TubeMigrationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: TubeMigrationAction): LearnerAction => ({ tick, type: 'endotracheal-tube-migration-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.endotrachealTubeMigrationAssessment);
    const prompt = tubeMigrationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.endotrachealTubeMigrationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.endotrachealTubeMigrationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.endotrachealTubeMigrationAssessment! };
}

describe('Post-repositioning tube migration transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(TUBE_MIGRATION_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...TUBE_MIGRATION_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsTubeMigration(SCENARIO)).toBe(true);
    expect(supportsTubeMigration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'endotracheal-tube-migration-after-repositioning-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(tubeMigrationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(tubeMigrationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(tubeMigrationCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(tubeMigrationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.reassessedAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.recognizedAtTick).toBeNull();
  });

  it('refuses the position panel when support and help were never recorded', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognizedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      supportedAtTick: null, positionReviewedAtTick: null,
      correctionAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record immediate support and experienced help before the position review');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize the post-repositioning ventilation change before support or airway correction');
    expect(transcript).toContain('Integrate the complete airway-position panel before correction intent');
    expect(recovered.patient.recognizedAtTick).toBeLessThan(recovered.patient.supportedAtTick!);
    expect(recovered.patient.supportedAtTick).toBeLessThan(recovered.patient.positionReviewedAtTick!);
    expect(recovered.patient.positionReviewedAtTick).toBeLessThan(recovered.patient.correctionAtTick!);
    expect(recovered.patient.correctionAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the change is recognized', () => {
    for (const action of TUBE_MIGRATION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize the post-repositioning ventilation change before support or airway correction');
      expect(refused.patient.recognizedAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the correction intent is on the record', () => {
    const short = run([[0, 'recognize-post-repositioning-ventilation-change'],
      [1, 'bridge-post-repositioning-oxygenation'],
      [2, 'integrate-tube-depth-and-bilateral-ventilation'],
      [3, 'reassess-tube-position-and-gas-exchange']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Record bounded experienced-airway correction intent before response proof');
    expect(short.patient.reassessedAtTick).toBeNull();
  });
});
