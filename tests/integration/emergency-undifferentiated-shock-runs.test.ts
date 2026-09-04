/**
 * Reference transcripts for the emergency undifferentiated-shock lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the bounded fluid challenge sits
 * behind the passive leg raise, so the irreversible test cannot be taken before
 * the reversible one that justifies it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { UNDIFFERENTIATED_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/undifferentiated-shock';
import { UNDIFFERENTIATED_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/undifferentiated-shock-fixtures';
import {
  UNDIFFERENTIATED_SHOCK_ACTIONS, UNDIFFERENTIATED_SHOCK_OBJECTIVES,
  supportsUndifferentiatedShock, type UndifferentiatedShockAction,
} from '../../src/modules/emergency-medicine/undifferentiated-shock';
import { undifferentiatedShockCompletionEvidence } from '../../src/modules/emergency-medicine/undifferentiated-shock-completion';
import { undifferentiatedShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/undifferentiated-shock-guidance';

type Choices = readonly (readonly [number, UndifferentiatedShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: UndifferentiatedShockAction): LearnerAction => ({ tick, type: 'undifferentiated-shock-assessment', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.undifferentiatedShockAssessment);
    const prompt = undifferentiatedShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.undifferentiatedShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.undifferentiatedShockAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.undifferentiatedShockAssessment! };
}

describe('Emergency undifferentiated shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(UNDIFFERENTIATED_SHOCK_ACTIONS).toHaveLength(7);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsUndifferentiatedShock(SCENARIO)).toBe(true);
    expect(supportsUndifferentiatedShock({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'fluid-responsive-low-preload'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(undifferentiatedShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(undifferentiatedShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(undifferentiatedShockCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(undifferentiatedShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...UNDIFFERENTIATED_SHOCK_OBJECTIVES]);
    expect([...UNDIFFERENTIATED_SHOCK_OBJECTIVES]).not.toEqual([...UNDIFFERENTIATED_SHOCK_ACTIONS.slice(0, 4)]);
    expect(supportsUndifferentiatedShock({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: UNDIFFERENTIATED_SHOCK_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: UNDIFFERENTIATED_SHOCK_ACTIONS[index]!,
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
    expect(findings(expert.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met']);
    expect(expert.patient.escalationAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome)).toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.perfusionReviewedAtTick).toBeNull();
  });

  it('refuses the fluid challenge taken as an opening move', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.lactateReviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      fluidChallengeAtTick: null, perfusionReassessedAtTick: null, escalationAtTick: null,
    });
    const transcript = JSON.stringify(errored.events);
    expect(transcript).toContain('Review the fixed dynamic fluid-responsiveness response before the bounded challenge');
    expect(transcript).toContain('Deliver the bounded challenge and allow the next engine tick before serial reassessment');
  });

  it('accepts the two opening reviews in either order', () => {
    const forward = run([[1, 'review-perfusion'], [2, 'review-lactate']], 4);
    const reversed = run([[1, 'review-lactate'], [2, 'review-perfusion']], 4);
    for (const patient of [forward.patient, reversed.patient]) {
      expect(patient.perfusionReviewedAtTick).not.toBeNull();
      expect(patient.lactateReviewedAtTick).not.toBeNull();
    }
    expect(JSON.stringify(reversed.events)).not.toContain('order-refused');
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.escalationAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome)).toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the fixed focused cardiac-ultrasound findings before the passive-leg-raise response');
    expect(transcript).toContain('Review the fixed dynamic fluid-responsiveness response before the bounded challenge');
    expect(recovered.patient.focusedEchoReviewedAtTick).toBeLessThan(recovered.patient.passiveLegRaiseAtTick!);
    expect(recovered.patient.passiveLegRaiseAtTick).toBeLessThan(recovered.patient.fluidChallengeAtTick!);
    expect(recovered.patient.fluidChallengeAtTick).toBeLessThan(recovered.patient.perfusionReassessedAtTick!);
    expect(recovered.patient.perfusionReassessedAtTick).toBeLessThan(recovered.patient.escalationAtTick!);
  });

  it('refuses the reassessment in the same instant as the fluid it reads', () => {
    const engine = create(); engine.step();
    for (const action of ['review-perfusion', 'review-lactate', 'review-focused-echo',
      'perform-passive-leg-raise'] as const) {
      engine.apply(choice(engine.tick, action)); engine.step();
    }
    engine.apply(choice(engine.tick, 'give-targeted-fluid-challenge'));
    engine.apply(choice(engine.tick, 'reassess-perfusion'));
    const patient = engine.step().equipment.resuscitation.undifferentiatedShockAssessment!;
    expect(patient.fluidChallengeAtTick).not.toBeNull();
    expect(patient.perfusionReassessedAtTick).toBeNull();
  });
});
