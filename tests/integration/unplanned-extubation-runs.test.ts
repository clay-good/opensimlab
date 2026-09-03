/**
 * Reference transcripts for the unplanned-extubation lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is unusual: the common-error path reaches
 * the *correct* clinical decision and is still refused, because the airway plan
 * is gated behind the panel that establishes it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { UNPLANNED_EXTUBATION as SCENARIO } from '../../src/modules/critical-care/scenarios/unplanned-extubation';
import { UNPLANNED_EXTUBATION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/unplanned-extubation-fixtures';
import {
  UNPLANNED_EXTUBATION_ACTIONS, supportsUnplannedExtubation, type UnplannedExtubationAction,
} from '../../src/modules/critical-care/unplanned-extubation';
import { unplannedExtubationCompletionEvidence } from '../../src/modules/critical-care/unplanned-extubation-completion';
import { unplannedExtubationInlinePrompt } from '../../src/modules/critical-care/tutor/unplanned-extubation-guidance';

type Choices = readonly (readonly [number, UnplannedExtubationAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: UnplannedExtubationAction): LearnerAction => ({ tick, type: 'unplanned-extubation-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.unplannedExtubationAssessment);
    const prompt = unplannedExtubationInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.unplannedExtubationAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.unplannedExtubationAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.unplannedExtubationAssessment! };
}

describe('Unplanned-extubation transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(UNPLANNED_EXTUBATION_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...UNPLANNED_EXTUBATION_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsUnplannedExtubation(SCENARIO)).toBe(true);
    expect(supportsUnplannedExtubation({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'unplanned-extubation-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(unplannedExtubationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(unplannedExtubationCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(unplannedExtubationCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(unplannedExtubationCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(idle.patient.supportAtTick).toBeNull();
  });

  it('refuses the correct decision when it is reached without the panel', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.supportAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      assessmentAtTick: null, failureAtTick: null,
      airwayPlanAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the whole-patient tolerance panel before deciding on a definitive airway');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Announce the event, support oxygenation, and call experienced help before the tolerance assessment');
    expect(transcript).toContain('Classify the observed trajectory before recording the airway plan');
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.assessmentAtTick!);
    expect(recovered.patient.assessmentAtTick).toBeLessThan(recovered.patient.failureAtTick!);
    expect(recovered.patient.failureAtTick).toBeLessThan(recovered.patient.airwayPlanAtTick!);
    expect(recovered.patient.airwayPlanAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before oxygen and help are arranged', () => {
    for (const action of UNPLANNED_EXTUBATION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Announce the event, support oxygenation, and call experienced help before the tolerance assessment');
      expect(refused.patient.supportAtTick).toBeNull();
    }
  });

  it('keeps the tolerance panel ahead of the airway plan on the expert path', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.assessmentAtTick).toBeLessThan(expert.patient.airwayPlanAtTick!);
  });
});
