/**
 * Reference transcripts for the emergency hemorrhagic-shock lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that definitive bleeding control sits
 * behind pelvic stabilization, so a run that spends the vignette resuscitating
 * cannot reach for control at the end and have it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { HEMORRHAGIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hemorrhagic-shock';
import { HEMORRHAGIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/hemorrhagic-shock-fixtures';
import {
  HEMORRHAGIC_SHOCK_ACTIONS, HEMORRHAGIC_SHOCK_OBJECTIVES,
  supportsHemorrhagicShock, type HemorrhagicShockAction,
} from '../../src/modules/emergency-medicine/hemorrhagic-shock';
import { hemorrhagicShockCompletionEvidence } from '../../src/modules/emergency-medicine/hemorrhagic-shock-completion';
import { hemorrhagicShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/hemorrhagic-shock-guidance';

type Choices = readonly (readonly [number, HemorrhagicShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HemorrhagicShockAction): LearnerAction => ({ tick, type: 'hemorrhagic-shock-assessment', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.hemorrhagicShockAssessment);
    const prompt = hemorrhagicShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.hemorrhagicShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.hemorrhagicShockAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hemorrhagicShockAssessment! };
}

describe('Emergency hemorrhagic shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(HEMORRHAGIC_SHOCK_ACTIONS).toHaveLength(7);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(3);
    expect(supportsHemorrhagicShock(SCENARIO)).toBe(true);
    expect(supportsHemorrhagicShock({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'blunt-pelvic-trauma'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(hemorrhagicShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(hemorrhagicShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'trauma')).toEqual([]);
    expect(hemorrhagicShockCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(hemorrhagicShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...HEMORRHAGIC_SHOCK_OBJECTIVES]);
    expect([...HEMORRHAGIC_SHOCK_OBJECTIVES]).not.toEqual([...HEMORRHAGIC_SHOCK_ACTIONS.slice(0, 4)]);
    expect(supportsHemorrhagicShock({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: HEMORRHAGIC_SHOCK_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: HEMORRHAGIC_SHOCK_ACTIONS[index]!,
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
    expect(idle.patient.mechanismAndPerfusionReviewedAtTick).toBeNull();
  });

  it('refuses definitive control at the end of a run that only resuscitated', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.reassessedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      pelvicStabilizationAtTick: null, definitiveControlEscalatedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record pelvic-stabilization intent before definitive bleeding-control escalation');
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the mechanism, injury pattern, and tissue-perfusion evidence before recording a response');
    expect(transcript).toContain('Activate the major-hemorrhage response before the bounded red-cell bridge');
    expect(recovered.patient.mechanismAndPerfusionReviewedAtTick).toBeLessThan(recovered.patient.pelvicStabilizationAtTick!);
    expect(recovered.patient.pelvicStabilizationAtTick).toBeLessThan(recovered.patient.definitiveControlEscalatedAtTick!);
    expect(recovered.patient.majorHemorrhageActivatedAtTick).toBeLessThan(recovered.patient.redCellsAtTick!);
    expect(recovered.patient.redCellsAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the mechanism and perfusion are reviewed', () => {
    for (const action of HEMORRHAGIC_SHOCK_ACTIONS.slice(1)) {
      const refused = run([[1, action]], 3);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the mechanism, injury pattern, and tissue-perfusion evidence before recording a response');
      expect(refused.patient.mechanismAndPerfusionReviewedAtTick).toBeNull();
    }
  });

  it('refuses the reassessment in the same instant as the red-cell bridge', () => {
    const engine = create(); engine.step();
    for (const action of ['review-mechanism-and-perfusion', 'activate-major-hemorrhage',
      'review-coagulation-and-temperature'] as const) {
      engine.apply(choice(engine.tick, action)); engine.step();
    }
    // Both in one tick: the bridge lands, and the reassessment reading it does not.
    engine.apply(choice(engine.tick, 'give-two-red-cell-units'));
    engine.apply(choice(engine.tick, 'reassess-perfusion'));
    const frame = engine.step();
    const patient = frame.equipment.resuscitation.hemorrhagicShockAssessment!;
    expect(patient.redCellsAtTick).not.toBeNull();
    expect(patient.reassessedAtTick).toBeNull();
  });
});
