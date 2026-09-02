/**
 * Reference transcripts for the stable narrow-complex tachycardia lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the rhythm converts and the
 * mechanism is still not proven: mechanismProven stays false on every frame of
 * every path, including after the authored conversion.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/regular-narrow-complex-tachycardia';
import { STABLE_NARROW_TACHYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/cardiology/stable-narrow-tachycardia-fixtures';
import {
  STABLE_NARROW_TACHYCARDIA_ACTIONS, STABLE_NARROW_TACHYCARDIA_OBJECTIVES,
  type StableNarrowTachycardiaAction,
} from '../../src/modules/cardiology/stable-narrow-tachycardia';
import { stableNarrowTachycardiaCompletionEvidence } from '../../src/modules/cardiology/stable-narrow-tachycardia-completion';
import { stableNarrowTachycardiaInlinePrompt } from '../../src/modules/cardiology/tutor/stable-narrow-tachycardia-guidance';

type Choices = readonly (readonly [number, StableNarrowTachycardiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: StableNarrowTachycardiaAction): LearnerAction => ({ tick, type: 'stable-narrow-tachycardia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.stableNarrowTachycardiaAssessment);
    const prompt = stableNarrowTachycardiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.stableNarrowTachycardiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.stableNarrowTachycardiaAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.stableNarrowTachycardiaAssessment;
    if (patient) {
      expect(patient.hemodynamicallyStable).toBe(true);
      expect(patient.mechanismProven).toBe(false);
      expect(patient.treatmentDelivered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.stableNarrowTachycardiaAssessment! };
}

describe('Stable narrow-tachycardia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    // Six recorded steps, five declared objectives: the vagal-response
    // observation is a step without an objective, on purpose.
    expect(STABLE_NARROW_TACHYCARDIA_ACTIONS).toHaveLength(6);
    expect(STABLE_NARROW_TACHYCARDIA_OBJECTIVES).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...STABLE_NARROW_TACHYCARDIA_OBJECTIVES]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(stableNarrowTachycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(stableNarrowTachycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(stableNarrowTachycardiaCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(stableNarrowTachycardiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(idle.patient.stabilityAtTick).toBeNull();
  });

  it('refuses the drug until somebody has looked at the maneuver', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.vagalAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      vagalResponseAtTick: null, adenosineAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the elapsed vagal nonresponse before adenosine intent');
    // The vagal objective is not credited by the intent alone: Debrief.tsx
    // requires the intent AND its elapsed response review, in that order. So
    // recording a maneuver and never looking at it scores it as not-met, which
    // is the lesson's argument enforced by the debrief rather than by prose.
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from the order refusal and both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile rhythm and whole-patient stability before the monitored pathway');
    expect(transcript).toContain('Record vagal intent, allow an engine tick, then review the authored response');
    expect(transcript).toContain('Record adenosine intent, allow an engine tick, then reassess the authored trajectory');
    expect(recovered.patient.stabilityAtTick).toBeLessThan(recovered.patient.contextAtTick!);
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.vagalAtTick!);
    expect(recovered.patient.vagalAtTick).toBeLessThan(recovered.patient.vagalResponseAtTick!);
    expect(recovered.patient.vagalResponseAtTick).toBeLessThan(recovered.patient.adenosineAtTick!);
    expect(recovered.patient.adenosineAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('converts the rhythm and proves no mechanism', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.hemodynamicallyStable).toBe(true);
    expect(expert.patient.mechanismProven).toBe(false);
    expect(expert.patient.treatmentDelivered).toBe(false);
  });
});
