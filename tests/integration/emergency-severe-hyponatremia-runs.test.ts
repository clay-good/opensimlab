/**
 * Reference transcripts for the emergency severe-hyponatraemia lesson,
 * replayed through the real engine.
 *
 * The assertion this file exists for is the turn in the middle: the correction
 * works, and the same panel that proves it also shows the urine output rising
 * from 35 to 180 mL/h — so the danger reverses direction, and the engine
 * refuses the guardrails to anyone who never read it.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';
import { SEVERE_HYPONATREMIA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/severe-hyponatremia-with-seizure-fixtures';
import {
  SEVERE_HYPONATREMIA_ACTIONS, SEVERE_HYPONATREMIA_OBJECTIVES,
  supportsSevereHyponatremia, type SevereHyponatremiaAction,
} from '../../src/modules/emergency-medicine/severe-hyponatremia-with-seizure';
import { severeHyponatremiaCompletionEvidence } from '../../src/modules/emergency-medicine/severe-hyponatremia-with-seizure-completion';
import { severeHyponatremiaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/severe-hyponatremia-with-seizure-guidance';

type Choices = readonly (readonly [number, SevereHyponatremiaAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
// The engine action type is shorter than the scenario id.
const choice = (tick: number, action: SevereHyponatremiaAction): LearnerAction => ({ tick, type: 'hyponatremia-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.hyponatremiaAssessment);
    const prompt = severeHyponatremiaInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.hyponatremiaAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.hyponatremiaAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hyponatremiaAssessment! };
}

describe('Emergency severe hyponatremia transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SEVERE_HYPONATREMIA_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsSevereHyponatremia(SCENARIO)).toBe(true);
    expect(supportsSevereHyponatremia({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'severe-hyponatremia-with-seizure-boundary'),
    })).toBe(false);
    expect(severeHyponatremiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(severeHyponatremiaCompletionEvidence(SCENARIO, ENGINE_VERSION, 'renal-electrolyte')).toEqual([]);
    expect(severeHyponatremiaCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(severeHyponatremiaCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...SEVERE_HYPONATREMIA_OBJECTIVES]);
    expect([...SEVERE_HYPONATREMIA_OBJECTIVES]).not.toEqual([...SEVERE_HYPONATREMIA_ACTIONS]);
    expect(supportsSevereHyponatremia({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: SEVERE_HYPONATREMIA_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: SEVERE_HYPONATREMIA_ACTIONS[index]!,
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
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    expect(expert.patient.guardrailsAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('warns with the urine output rather than the sodium, and hands over the ceilings', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const hypertonic = expert.events.find(({ eventId }) => eventId.startsWith('hyponatremia-hypertonic-'))!;
    expect(hypertonic.data).toMatchObject({
      initialSodiumMmolPerL: 112, firstHourTargetRiseMmolPerL: 5,
    });
    const panel = expert.events.find(({ eventId }) => eventId.startsWith('hyponatremia-reassessed-'))!;
    expect(panel.data).toMatchObject({
      sodiumMmolPerL: 117, sodiumRiseMmolPerL: 5, urineOutputMlPerHour: 180,
    });
    expect(JSON.stringify(panel)).toContain('a warning that correction could accelerate');
    const guardrails = expert.events.find(({ eventId }) => eventId.startsWith('hyponatremia-guardrails-'))!;
    expect(guardrails.data).toMatchObject({
      firstDayMaximumRiseMmolPerL: 10, laterDailyMaximumRiseMmolPerL: 8,
    });
    expect(JSON.stringify(guardrails)).toContain('chlorthalidone hold');
  });

  it('refuses the guardrails to a run that stopped when she woke up', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.hypertonicAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ reassessedAtTick: null, guardrailsAtTick: null });
    expect(JSON.stringify(errored.events))
      .toContain('Review the fixed first-hour neurologic, sodium, and urine-output response before closing the rescue phase.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'not-met', 'not-met']);
  });

  it('refuses the sodium-directed intent before the patient is protected, and still completes', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.guardrailsAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review the fixed neurologic state, sodium, glucose, osmolality, and immediate exclusions first.');
    expect(transcript).toContain('Record parallel stabilization, monitoring, access, glucose review, and expert escalation before sodium-directed intent.');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.stabilizedAtTick!);
    expect(recovered.patient.stabilizedAtTick).toBeLessThan(recovered.patient.hypertonicAtTick!);
    expect(recovered.patient.hypertonicAtTick).toBeLessThan(recovered.patient.reassessedAtTick!);
    expect(recovered.patient.reassessedAtTick).toBeLessThan(recovered.patient.guardrailsAtTick!);
  });

  it('refuses every later step before the pattern is reviewed', () => {
    for (const action of SEVERE_HYPONATREMIA_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review the fixed neurologic state, sodium, glucose, osmolality, and immediate exclusions first.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('refuses the first-hour panel until the hypertonic intent is recorded', () => {
    const short = run([
      [0, 'review-hyponatremia-pattern'],
      [1, 'record-hyponatremia-stabilization'],
      [2, 'reassess-hyponatremia-first-hour'],
    ], 4);
    expect(short.patient.reassessedAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Record immediate symptom-led hypertonic-saline intent before the authored first-hour reassessment.');
  });
});
