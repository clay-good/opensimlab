/**
 * Reference transcripts for the ICU handoff lesson, replayed through the real
 * engine.
 *
 * The assertion this file exists for is that escalation and acceptance are both
 * gated behind the cross-check, so nobody acts on a headline they did not test.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ICU_HANDOFF_WITH_HIDDEN_DETERIORATION as SCENARIO } from '../../src/modules/critical-care/scenarios/icu-handoff-with-hidden-deterioration';
import { ICU_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/critical-care/icu-handoff-fixtures';
import {
  ICU_HANDOFF_ACTIONS, supportsIcuHandoff, type IcuHandoffAction,
} from '../../src/modules/critical-care/icu-handoff';
import { icuHandoffCompletionEvidence } from '../../src/modules/critical-care/icu-handoff-completion';
import { icuHandoffInlinePrompt } from '../../src/modules/critical-care/tutor/icu-handoff-guidance';

type Choices = readonly (readonly [number, IcuHandoffAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: IcuHandoffAction): LearnerAction => ({ tick, type: 'icu-hidden-deterioration-handoff-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.icuHiddenDeteriorationHandoffAssessment);
    const prompt = icuHandoffInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.icuHiddenDeteriorationHandoffAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.icuHiddenDeteriorationHandoffAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.icuHiddenDeteriorationHandoffAssessment! };
}

describe('ICU handoff transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(ICU_HANDOFF_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ICU_HANDOFF_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsIcuHandoff(SCENARIO)).toBe(true);
    expect(supportsIcuHandoff({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'icu-handoff-with-hidden-deterioration-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(icuHandoffCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(icuHandoffCompletionEvidence(SCENARIO, ENGINE_VERSION, 'neonatology')).toEqual([]);
    expect(icuHandoffCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(icuHandoffCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.acceptanceAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.readinessAtTick).toBeNull();
  });

  it('refuses escalation and acceptance when the headline was never checked', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.readinessAtTick).not.toBeNull();
    expect(errored.patient.contentAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      crossCheckAtTick: null, escalationAtTick: null, acceptanceAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Cross-check the outgoing claim against the patient, dated trends, devices, infusions, orders, and pending source control before escalation or acceptance');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.acceptanceAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Establish receiver readiness, monitoring continuity, and bedside coverage before receiving content');
    expect(transcript).toContain('Escalate the corrected worsening-shock state with priorities, triggers, contingencies, and named owners before synthesis and acceptance');
    expect(recovered.patient.readinessAtTick).toBeLessThan(recovered.patient.contentAtTick!);
    expect(recovered.patient.contentAtTick).toBeLessThan(recovered.patient.crossCheckAtTick!);
    expect(recovered.patient.crossCheckAtTick).toBeLessThan(recovered.patient.escalationAtTick!);
    expect(recovered.patient.escalationAtTick).toBeLessThan(recovered.patient.acceptanceAtTick!);
  });

  it('refuses every later step before readiness is established', () => {
    for (const action of ICU_HANDOFF_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Establish receiver readiness, monitoring continuity, and bedside coverage before receiving content');
      expect(refused.patient.readinessAtTick).toBeNull();
    }
  });

  it('refuses the cross-check until the content has actually been received', () => {
    const short = run([[0, 'establish-icu-handoff-readiness'], [1, 'cross-check-hidden-deterioration']], 4);
    expect(JSON.stringify(short.events))
      .toContain('Receive the fixed illness-severity, summary, support, task, and contingency content before cross-checking it');
    expect(short.patient.crossCheckAtTick).toBeNull();
  });
});
