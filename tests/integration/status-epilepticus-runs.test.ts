/**
 * Reference transcripts for the critical-care refractory status-epilepticus
 * lesson, replayed through the real engine.
 *
 * The assertion this file exists for is that the continuous-anesthetic pathway
 * is gated behind the systemic review, so a drug that lowers blood pressure is
 * not started before anyone has looked at a MAP of 62.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/critical-care/scenarios/status-epilepticus';
import { STATUS_EPILEPTICUS_FIXTURES as FIXTURES } from '../../src/modules/critical-care/status-epilepticus-fixtures';
import {
  STATUS_EPILEPTICUS_ACTIONS, supportsStatusEpilepticus, type StatusEpilepticusAction,
} from '../../src/modules/critical-care/status-epilepticus';
import { statusEpilepticusCompletionEvidence } from '../../src/modules/critical-care/status-epilepticus-completion';
import { statusEpilepticusInlinePrompt } from '../../src/modules/critical-care/tutor/status-epilepticus-guidance';

type Choices = readonly (readonly [number, StatusEpilepticusAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: StatusEpilepticusAction): LearnerAction => ({ tick, type: 'critical-care-status-epilepticus-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.criticalCareStatusEpilepticusAssessment);
    const prompt = statusEpilepticusInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.criticalCareStatusEpilepticusAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.criticalCareStatusEpilepticusAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.criticalCareStatusEpilepticusAssessment! };
}

describe('Refractory status epilepticus transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(STATUS_EPILEPTICUS_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...STATUS_EPILEPTICUS_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsStatusEpilepticus(SCENARIO)).toBe(true);
    expect(supportsStatusEpilepticus({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'critical-care-status-epilepticus-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(statusEpilepticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(statusEpilepticusCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neurology')).toEqual([]);
    expect(statusEpilepticusCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(statusEpilepticusCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(idle.patient.recognitionAtTick).toBeNull();
  });

  it('refuses the anesthetic pathway when nobody looked at the body it goes into', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      patternAtTick: null, pathwayAtTick: null,
      causesAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the fixed EEG, airway, ventilation, perfusion, medication, and mimic context before activating refractory therapy');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize refractory electrographic status and activate experienced help first');
    expect(transcript).toContain('Activate the expert refractory-status and continuous-EEG pathway before cause review');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.patternAtTick!);
    expect(recovered.patient.patternAtTick).toBeLessThan(recovered.patient.pathwayAtTick!);
    expect(recovered.patient.pathwayAtTick).toBeLessThan(recovered.patient.causesAtTick!);
    expect(recovered.patient.causesAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the refractory pattern is recognized', () => {
    for (const action of STATUS_EPILEPTICUS_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize refractory electrographic status and activate experienced help first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the cause pathways are on the record', () => {
    const short = run([[0, 'recognize-refractory-status-epilepticus'],
      [1, 'review-refractory-status-pattern'],
      [2, 'activate-refractory-status-pathway'],
      [3, 'reassess-refractory-status-trajectory']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Keep reversible and dangerous causes active before reviewing the fixed response');
    expect(short.patient.reassessmentAtTick).toBeNull();
  });
});
