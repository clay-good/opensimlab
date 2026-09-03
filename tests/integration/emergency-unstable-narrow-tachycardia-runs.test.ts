/**
 * Reference transcripts for the emergency unstable narrow-complex tachycardia
 * lesson, replayed through the real engine.
 *
 * The assertion this file exists for is that the cardioversion is gated behind
 * the preparation, because the difference between a synchronised shock and an
 * unsynchronised one is a setting and a marker somebody has to see.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { UNSTABLE_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-narrow-complex-tachycardia';
import { UNSTABLE_NARROW_TACHYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/unstable-narrow-complex-tachycardia-fixtures';
import {
  UNSTABLE_NARROW_TACHYCARDIA_ACTIONS, UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES,
  supportsUnstableNarrowTachycardia, type UnstableNarrowTachycardiaAction,
} from '../../src/modules/emergency-medicine/unstable-narrow-complex-tachycardia';
import { unstableNarrowTachycardiaCompletionEvidence } from '../../src/modules/emergency-medicine/unstable-narrow-complex-tachycardia-completion';
import { unstableNarrowTachycardiaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/unstable-narrow-complex-tachycardia-guidance';

type Choices = readonly (readonly [number, UnstableNarrowTachycardiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type is shorter than the scenario id.
const choice = (tick: number, action: UnstableNarrowTachycardiaAction): LearnerAction => ({ tick, type: 'unstable-narrow-tachycardia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.unstableNarrowTachycardiaAssessment);
    const prompt = unstableNarrowTachycardiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.unstableNarrowTachycardiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.unstableNarrowTachycardiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.unstableNarrowTachycardiaAssessment! };
}

describe('Emergency unstable narrow-complex tachycardia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(UNSTABLE_NARROW_TACHYCARDIA_ACTIONS).toHaveLength(4);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsUnstableNarrowTachycardia(SCENARIO)).toBe(true);
    expect(supportsUnstableNarrowTachycardia({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
    expect(unstableNarrowTachycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(unstableNarrowTachycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(unstableNarrowTachycardiaCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(unstableNarrowTachycardiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES]);
    expect([...UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES]).not.toEqual([...UNSTABLE_NARROW_TACHYCARDIA_ACTIONS]);
    expect(supportsUnstableNarrowTachycardia({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: UNSTABLE_NARROW_TACHYCARDIA_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: UNSTABLE_NARROW_TACHYCARDIA_ACTIONS[index]!,
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

  it('does not select routine oxygen, names no mechanism, and leaves recurrence open', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const text = JSON.stringify(expert.events);
    expect(text).toContain('Routine oxygen was not selected because SpO₂ is 94%');
    expect(text).toContain('The bedside teaching waveform does not encode atrial mechanism and is not a diagnostic rhythm strip');
    expect(text).toContain('sedation only if feasible and without delaying the shock');
    expect(text).toContain('Refractory or recurrent tachycardia, causal investigation, medication therapy, anticoagulation questions, disposition, and outcome remain outside this vignette');
  });

  it('refuses the cardioversion when nobody prepared to deliver it', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.reviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      preparedAtTick: null, cardiovertedAtTick: null, reassessedAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Record immediate support and synchronized-cardioversion preparation first.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses the skipped review and the too-early reassessment, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessedAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the rhythm features and whole-patient instability before treatment.');
    expect(transcript).toContain('then allow the next engine tick before reassessment');
    expect(recovered.patient.reviewedAtTick).toBeLessThan(recovered.patient.preparedAtTick!);
    expect(recovered.patient.preparedAtTick).toBeLessThan(recovered.patient.cardiovertedAtTick!);
    expect(recovered.patient.cardiovertedAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
  });

  it('refuses every later step before the rhythm and instability are reviewed', () => {
    for (const action of UNSTABLE_NARROW_TACHYCARDIA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the rhythm features and whole-patient instability before treatment.');
      expect(refused.patient.reviewedAtTick).toBeNull();
    }
  });

  it('refuses a reassessment recorded on the same tick as the shock', () => {
    const early = run([
      [0, 'review-rhythm-and-instability'],
      [1, 'prepare-synchronized-cardioversion'],
      [2, 'record-synchronized-cardioversion-intent'],
      [2, 'reassess-rhythm-and-perfusion'],
    ], 4);
    expect(early.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(early.events))
      .toContain('then allow the next engine tick before reassessment');
  });
});
