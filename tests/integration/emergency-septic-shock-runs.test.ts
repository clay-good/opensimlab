/**
 * Reference transcripts for the emergency septic-shock lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is unusual: the engine refuses nothing
 * when source control is skipped. It is gated by the first review alone, so a
 * run that completes both enforced chains faultlessly and never escalates the
 * obstructed source is caught only by the objective.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SEPTIC_SHOCK as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/septic-shock';
import { SEPTIC_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/septic-shock-fixtures';
import {
  SEPTIC_SHOCK_ACTIONS, SEPTIC_SHOCK_OBJECTIVES,
  supportsSepticShock, type SepticShockAction,
} from '../../src/modules/emergency-medicine/septic-shock';
import { septicShockEmergencyCompletionEvidence } from '../../src/modules/emergency-medicine/septic-shock-completion';
import { septicShockInlinePrompt } from '../../src/modules/emergency-medicine/tutor/septic-shock-guidance';

type Choices = readonly (readonly [number, SepticShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type is `-assessment`, not `-response`.
const choice = (tick: number, action: SepticShockAction): LearnerAction => ({ tick, type: 'septic-shock-assessment', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.septicShockAssessment);
    const prompt = septicShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.septicShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.septicShockAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.septicShockAssessment! };
}

describe('Emergency septic shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SEPTIC_SHOCK_ACTIONS).toHaveLength(7);
    expect(SCENARIO.metadata.objectives).toHaveLength(4);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsSepticShock(SCENARIO)).toBe(true);
    expect(supportsSepticShock({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'sepsis-pattern'),
    })).toBe(false);
    expect(septicShockEmergencyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(septicShockEmergencyCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(septicShockEmergencyCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(septicShockEmergencyCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...SEPTIC_SHOCK_OBJECTIVES]);
    expect([...SEPTIC_SHOCK_OBJECTIVES]).not.toEqual([...SEPTIC_SHOCK_ACTIONS.slice(0, 4)]);
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
    expect(expert.patient.sourceControlEscalationAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.infectionAndOrganDysfunctionReviewedAtTick).toBeNull();
  });

  it('publishes the authored lactate, the 30 mL/kg course and the persistent panel', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const text = JSON.stringify(expert.events);
    expect(text).toContain('Fixed initial lactate: 5.2 mmol/L');
    expect(text).toContain('A fixed 2,100 mL balanced-crystalloid course (30 mL/kg for this 70 kg vignette)');
    expect(text).toContain('retains 25% intravascularly');
    expect(text).toContain('Ongoing fluid is not an automatic next step.');
    expect(text).toContain('initial MAP of 65 mmHg');
  });

  it('fails only the source-control objective when nothing at all was refused', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // Every enforced chain completed.
    expect(errored.patient).toMatchObject({ sourceControlEscalationAtTick: null });
    expect(errored.patient.norepinephrineIntentAtTick).not.toBeNull();
    expect(errored.patient.antimicrobialIntentAtTick).not.toBeNull();
    // The engine refused nothing: source control was never gated behind anything.
    expect(JSON.stringify(errored.events)).not.toContain('septic-shock-order-refused');
    const outcomes = findings(errored.events).map(({ outcome }) => outcome);
    expect(outcomes.slice(0, 3)).toEqual(['met', 'met', 'met']);
    expect(outcomes[3]).not.toBe('met');
  });

  it('refuses the antimicrobial before the cultures, and the reassessment on the fluid tick', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.norepinephrineIntentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Record cultures and lactate first, without delaying immediate antimicrobial intent.');
    expect(transcript).toContain('allow the next engine tick before reassessment');
    expect(recovered.patient.culturesAndLactateAtTick).toBeLessThan(recovered.patient.antimicrobialIntentAtTick!);
  });

  it('lets source control be recorded before the fluid and the vasopressor', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.sourceControlEscalationAtTick).toBe(5);
    expect(recovered.patient.sourceControlEscalationAtTick)
      .toBeLessThan(recovered.patient.initialCrystalloidAtTick!);
    expect(recovered.patient.sourceControlEscalationAtTick)
      .toBeLessThan(recovered.patient.norepinephrineIntentAtTick!);
  });

  it('refuses every control before the sepsis pattern is active', () => {
    for (const action of SEPTIC_SHOCK_ACTIONS) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('The bounded septic-shock choices are available only in the declared lesson.');
      expect(refused.patient.infectionAndOrganDysfunctionReviewedAtTick).toBeNull();
    }
  });

  it('refuses every later step before the infection evidence is reviewed', () => {
    for (const action of SEPTIC_SHOCK_ACTIONS.slice(1)) {
      const refused = run([[1, action]], 3);
      // Some steps meet their own gate first — the antimicrobial is refused for
      // the missing cultures rather than the missing review — so the assertion
      // is that a refusal happened and nothing downstream was recorded.
      expect(JSON.stringify(refused.events), action).toMatch(/refused/);
      expect(refused.patient.infectionAndOrganDysfunctionReviewedAtTick, action).toBeNull();
      expect(refused.patient.culturesAndLactateAtTick, action).toBeNull();
      expect(refused.patient.sourceControlEscalationAtTick, action).toBeNull();
    }
  });

  it('refuses the vasopressor until the post-fluid reassessment is recorded', () => {
    const short = run([
      [1, 'review-infection-and-organ-dysfunction'],
      [2, 'begin-initial-crystalloid'],
      [3, 'start-norepinephrine-intent'],
    ], 5);
    expect(short.patient.norepinephrineIntentAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Reassess perfusion after the initial fluid course before recording vasopressor intent.');
  });
});
