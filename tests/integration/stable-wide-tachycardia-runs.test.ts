/**
 * Reference transcripts for the stable wide-complex tachycardia lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is that the rhythm terminates and nobody
 * ever proves what it was: mechanismProven stays false on every frame,
 * including after the authored conversion to sinus.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { WIDE_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/wide-complex-tachycardia';
import { STABLE_WIDE_TACHYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/cardiology/stable-wide-tachycardia-fixtures';
import {
  STABLE_WIDE_TACHYCARDIA_ACTIONS, STABLE_WIDE_TACHYCARDIA_OBJECTIVES,
  type StableWideTachycardiaAction,
} from '../../src/modules/cardiology/stable-wide-tachycardia';
import { stableWideTachycardiaCompletionEvidence } from '../../src/modules/cardiology/stable-wide-tachycardia-completion';
import { stableWideTachycardiaInlinePrompt } from '../../src/modules/cardiology/tutor/stable-wide-tachycardia-guidance';

type Choices = readonly (readonly [number, StableWideTachycardiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: StableWideTachycardiaAction): LearnerAction => ({ tick, type: 'stable-wide-tachycardia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.stableWideTachycardiaAssessment);
    const prompt = stableWideTachycardiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.stableWideTachycardiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.stableWideTachycardiaAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.stableWideTachycardiaAssessment;
    if (patient) {
      expect(patient.hemodynamicallyStable).toBe(true);
      expect(patient.mechanismProven).toBe(false);
      expect(patient.learnerTreatmentDelivered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.stableWideTachycardiaAssessment! };
}

describe('Stable wide-tachycardia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    // Seven recorded steps, six declared objectives.
    expect(STABLE_WIDE_TACHYCARDIA_ACTIONS).toHaveLength(7);
    expect(STABLE_WIDE_TACHYCARDIA_OBJECTIVES).toHaveLength(6);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...STABLE_WIDE_TACHYCARDIA_OBJECTIVES]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives, so unlike its cardiology siblings this lesson leaves the
    // observable-objectives cap outstanding as well as the two runtime items.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(stableWideTachycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(stableWideTachycardiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(stableWideTachycardiaCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(stableWideTachycardiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.reassessmentAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.stabilityAtTick).toBeNull();
  });

  it('refuses escalation until somebody has looked at the drug', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.medicationAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      nonresponseAtTick: null, cardioversionAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the elapsed fixed medication nonresponse before escalation');
  });

  it('refuses the drug before the room is ready, and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Prepare monitoring, expert help, and rescue capability before the authored medication path');
    expect(transcript).toContain('Record the authored medication path, allow an engine tick, then review the reported response');
    expect(transcript).toContain('Record cardioversion intent, allow an engine tick, then reassess the fixed report');
    expect(recovered.patient.stabilityAtTick).toBeLessThan(recovered.patient.contextAtTick!);
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.readinessAtTick!);
    expect(recovered.patient.readinessAtTick).toBeLessThan(recovered.patient.medicationAtTick!);
    expect(recovered.patient.medicationAtTick).toBeLessThan(recovered.patient.nonresponseAtTick!);
    expect(recovered.patient.nonresponseAtTick).toBeLessThan(recovered.patient.cardioversionAtTick!);
    expect(recovered.patient.cardioversionAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('terminates the rhythm and proves no mechanism', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.hemodynamicallyStable).toBe(true);
    expect(expert.patient.mechanismProven).toBe(false);
    expect(expert.patient.learnerTreatmentDelivered).toBe(false);
  });
});
