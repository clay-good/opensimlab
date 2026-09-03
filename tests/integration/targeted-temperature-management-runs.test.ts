/**
 * Reference transcripts for the post-arrest temperature-control lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the protocol is gated behind the
 * whole-context review, so no isolated sign turns into a prognosis on the way
 * to a remembered number.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TARGETED_TEMPERATURE_MANAGEMENT as SCENARIO } from '../../src/modules/critical-care/scenarios/targeted-temperature-management';
import { TARGETED_TEMPERATURE_MANAGEMENT_FIXTURES as FIXTURES } from '../../src/modules/critical-care/targeted-temperature-management-fixtures';
import {
  TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS, supportsTargetedTemperatureManagement,
  type TargetedTemperatureManagementAction,
} from '../../src/modules/critical-care/targeted-temperature-management';
import { targetedTemperatureManagementCompletionEvidence } from '../../src/modules/critical-care/targeted-temperature-management-completion';
import { targetedTemperatureManagementInlinePrompt } from '../../src/modules/critical-care/tutor/targeted-temperature-management-guidance';

type Choices = readonly (readonly [number, TargetedTemperatureManagementAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: TargetedTemperatureManagementAction): LearnerAction => ({ tick, type: 'targeted-temperature-management-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.postArrestTemperatureAssessment);
    const prompt = targetedTemperatureManagementInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.postArrestTemperatureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.postArrestTemperatureAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.postArrestTemperatureAssessment! };
}

describe('Post-arrest temperature control transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsTargetedTemperatureManagement(SCENARIO)).toBe(true);
    expect(supportsTargetedTemperatureManagement({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'targeted-temperature-management-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(targetedTemperatureManagementCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(targetedTemperatureManagementCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(targetedTemperatureManagementCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(targetedTemperatureManagementCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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

  it('refuses the protocol when the whole context was never reviewed', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      contextAtTick: null, protocolAtTick: null,
      guardrailsAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the fixed neurologic, temperature, perfusion, oxygenation, ventilation, seizure, and cause context before choosing a protocol');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize temperature-control eligibility and activate experienced post-arrest help first');
    expect(transcript).toContain('Activate an individualized protocolized temperature range before recording guardrails');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.contextAtTick!);
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.protocolAtTick!);
    expect(recovered.patient.protocolAtTick).toBeLessThan(recovered.patient.guardrailsAtTick!);
    expect(recovered.patient.guardrailsAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before eligibility is recognized', () => {
    for (const action of TARGETED_TEMPERATURE_MANAGEMENT_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize temperature-control eligibility and activate experienced post-arrest help first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('refuses the reassessment until the guardrails are on the record', () => {
    const short = run([[0, 'recognize-post-arrest-temperature-control'],
      [1, 'review-post-arrest-temperature-context'],
      [2, 'activate-post-arrest-temperature-protocol'],
      [3, 'reassess-post-arrest-temperature-trajectory']], 5);
    expect(JSON.stringify(short.events))
      .toContain('Record temperature-control and whole-patient guardrails before reviewing the fixed response');
    expect(short.patient.reassessmentAtTick).toBeNull();
  });
});
