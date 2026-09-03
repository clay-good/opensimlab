/**
 * Reference transcripts for the mixed-shock lesson, replayed through the real
 * engine.
 *
 * The assertion this file exists for is that support is gated behind the
 * haemodynamic integration, so neither of the two preceding lessons' answers
 * can be applied to a patient who is both of them.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { MIXED_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/mixed-shock';
import { MIXED_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/critical-care/mixed-shock-fixtures';
import {
  MIXED_SHOCK_ACTIONS, supportsMixedShock, type MixedShockAction,
} from '../../src/modules/critical-care/mixed-shock';
import { mixedShockCompletionEvidence } from '../../src/modules/critical-care/mixed-shock-completion';
import { mixedShockInlinePrompt } from '../../src/modules/critical-care/tutor/mixed-shock-guidance';

type Choices = readonly (readonly [number, MixedShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: MixedShockAction): LearnerAction => ({ tick, type: 'mixed-shock-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.mixedShockAssessment);
    const prompt = mixedShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.mixedShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.mixedShockAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.mixedShockAssessment! };
}

describe('Mixed-shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(MIXED_SHOCK_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...MIXED_SHOCK_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsMixedShock(SCENARIO)).toBe(true);
    expect(supportsMixedShock({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'mixed-shock-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(mixedShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(mixedShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(mixedShockCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(mixedShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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

  it('refuses support chosen before the panel that says she is both', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      hemodynamicsAtTick: null, supportAtTick: null, causesAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Integrate output, filling pressure, vascular tone, treatment context, and the whole patient before recording support');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Recognize the discordant whole-patient trajectory and activate experienced help first');
    expect(transcript).toContain('Record support for both physiological halves before reviewing cause control');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.hemodynamicsAtTick!);
    expect(recovered.patient.hemodynamicsAtTick).toBeLessThan(recovered.patient.supportAtTick!);
    expect(recovered.patient.supportAtTick).toBeLessThan(recovered.patient.causesAtTick!);
    expect(recovered.patient.causesAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('refuses every later step before the discordance is named', () => {
    for (const action of MIXED_SHOCK_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Recognize the discordant whole-patient trajectory and activate experienced help first');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('holds both physiologies rather than choosing a label', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.hemodynamicsAtTick).not.toBeNull();
    expect(expert.patient.causesAtTick).not.toBeNull();
    // Both cause pathways stay open through to the ending.
    expect(expert.patient.reassessmentAtTick).toBeGreaterThan(expert.patient.causesAtTick!);
  });
});
