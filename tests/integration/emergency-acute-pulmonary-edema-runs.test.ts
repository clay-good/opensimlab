/**
 * Reference transcripts for the emergency acute-pulmonary-edema lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the three initial treatments are
 * gated against nothing at all — any order is accepted — while the reassessment
 * is gated behind all three, so the familiar one cannot stand in for the set.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ACUTE_PULMONARY_EDEMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';
import { ACUTE_PULMONARY_EDEMA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/acute-pulmonary-edema-fixtures';
import {
  ACUTE_PULMONARY_EDEMA_ACTIONS, ACUTE_PULMONARY_EDEMA_OBJECTIVES,
  ACUTE_PULMONARY_EDEMA_PARALLEL_ACTIONS,
  supportsAcutePulmonaryEdema, type AcutePulmonaryEdemaAction,
} from '../../src/modules/emergency-medicine/acute-pulmonary-edema';
import { acutePulmonaryEdemaCompletionEvidence } from '../../src/modules/emergency-medicine/acute-pulmonary-edema-completion';
import { acutePulmonaryEdemaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/acute-pulmonary-edema-guidance';

type Choices = readonly (readonly [number, AcutePulmonaryEdemaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AcutePulmonaryEdemaAction): LearnerAction => ({ tick, type: 'acute-pulmonary-edema-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.acutePulmonaryEdemaAssessment);
    const prompt = acutePulmonaryEdemaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.acutePulmonaryEdemaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.acutePulmonaryEdemaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.acutePulmonaryEdemaAssessment! };
}

describe('Emergency acute pulmonary edema transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(ACUTE_PULMONARY_EDEMA_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(1);
    expect(supportsAcutePulmonaryEdema(SCENARIO)).toBe(true);
    expect(supportsAcutePulmonaryEdema({ ...SCENARIO, timeline: [] })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(acutePulmonaryEdemaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(acutePulmonaryEdemaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
    expect(acutePulmonaryEdemaCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(acutePulmonaryEdemaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...ACUTE_PULMONARY_EDEMA_OBJECTIVES]);
    expect([...ACUTE_PULMONARY_EDEMA_OBJECTIVES]).not.toEqual([...ACUTE_PULMONARY_EDEMA_ACTIONS.slice(0, 4)]);
    expect(supportsAcutePulmonaryEdema({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: ACUTE_PULMONARY_EDEMA_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: ACUTE_PULMONARY_EDEMA_ACTIONS[index]!,
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
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('refuses the reassessment when the loop diuretic stood in for all three', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.diureticIntentAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      nivAtTick: null, vasodilatorIntentAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record NIV with titrated oxygen, loop-diuretic intent, and vasodilator intent');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the whole pattern, immediate mimics, and precipitants before treatment.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.nivAtTick!);
    expect(recovered.patient.vasodilatorIntentAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every treatment and the reassessment before the pattern is reviewed', () => {
    for (const action of ACUTE_PULMONARY_EDEMA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the whole pattern, immediate mimics, and precipitants before treatment.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('accepts the three initial treatments in any order, because none gates another', () => {
    const orders: readonly (readonly AcutePulmonaryEdemaAction[])[] = [
      ['record-niv-and-titrated-oxygen', 'record-loop-diuretic-intent', 'record-vasodilator-intent'],
      ['record-loop-diuretic-intent', 'record-vasodilator-intent', 'record-niv-and-titrated-oxygen'],
      ['record-vasodilator-intent', 'record-niv-and-titrated-oxygen', 'record-loop-diuretic-intent'],
      ['record-vasodilator-intent', 'record-loop-diuretic-intent', 'record-niv-and-titrated-oxygen'],
    ];
    for (const order of orders) {
      const actions: Choices = [
        [0, 'review-pattern-mimics-and-precipitants'],
        ...order.map((action, index) => [index + 1, action] as const),
        [4, 'reassess-breathing-pressure-and-perfusion'],
      ];
      const done = run(actions, 6);
      expect(done.patient.reassessedAtTick, order.join(' → ')).not.toBeNull();
      expect(JSON.stringify(done.events), order.join(' → ')).not.toContain('order-refused');
      expect(findings(done.events).map(({ outcome }) => outcome))
        .toEqual(['met', 'met', 'met', 'met']);
    }
    expect(ACUTE_PULMONARY_EDEMA_PARALLEL_ACTIONS).toHaveLength(3);
  });

  it('refuses a reassessment recorded on the same tick as the last treatment', () => {
    const early = run([
      [0, 'review-pattern-mimics-and-precipitants'],
      [1, 'record-niv-and-titrated-oxygen'],
      [2, 'record-loop-diuretic-intent'],
      [3, 'record-vasodilator-intent'],
      [3, 'reassess-breathing-pressure-and-perfusion'],
    ], 5);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
