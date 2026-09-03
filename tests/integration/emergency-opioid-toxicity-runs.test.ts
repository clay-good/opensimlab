/**
 * Reference transcripts for the emergency opioid-toxicity lesson, replayed
 * through the real engine.
 *
 * Two assertions this file exists for: the naloxone intent is refused until
 * ventilation is recorded, and the authored twenty-five-minute panel moves in
 * the wrong direction after a correct response, because opioid effect can
 * outlast naloxone.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { OPIOID_TOXICITY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/opioid-toxicity';
import { OPIOID_TOXICITY_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/opioid-toxicity-fixtures';
import {
  OPIOID_TOXICITY_ACTIONS, OPIOID_TOXICITY_OBJECTIVES,
  supportsOpioidToxicity, type OpioidToxicityAction,
} from '../../src/modules/emergency-medicine/opioid-toxicity';
import { opioidToxicityCompletionEvidence } from '../../src/modules/emergency-medicine/opioid-toxicity-completion';
import { opioidToxicityInlinePrompt } from '../../src/modules/emergency-medicine/tutor/opioid-toxicity-guidance';

type Choices = readonly (readonly [number, OpioidToxicityAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: OpioidToxicityAction): LearnerAction => ({ tick, type: 'opioid-toxicity-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.opioidToxicityAssessment);
    const prompt = opioidToxicityInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.opioidToxicityAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.opioidToxicityAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.opioidToxicityAssessment! };
}

describe('Emergency opioid toxicity transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(OPIOID_TOXICITY_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsOpioidToxicity(SCENARIO)).toBe(true);
    expect(supportsOpioidToxicity({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'opioid-toxicity-boundary'),
    })).toBe(false);
    expect(opioidToxicityCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toHaveLength(9);
    expect(opioidToxicityCompletionEvidence(SCENARIO, ENGINE_VERSION, 'toxicology')).toEqual([]);
    expect(opioidToxicityCompletionEvidence(SCENARIO, 'changed', 'emergency-medicine')).toEqual([]);
    expect(opioidToxicityCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'emergency-medicine', 'emergency-department', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
  });

  it('guards on the declared objectives, which are not the control ids', () => {
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...OPIOID_TOXICITY_OBJECTIVES]);
    expect([...OPIOID_TOXICITY_OBJECTIVES]).not.toEqual([...OPIOID_TOXICITY_ACTIONS.slice(0, 5)]);
    expect(supportsOpioidToxicity({
      ...SCENARIO,
      metadata: {
        ...SCENARIO.metadata,
        objectives: OPIOID_TOXICITY_OBJECTIVES.map((_, index) => ({
          ...SCENARIO.metadata.objectives[index]!, id: OPIOID_TOXICITY_ACTIONS[index]!,
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
    expect(expert.patient.recurrencePlanAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.patternReviewedAtTick).toBeNull();
  });

  it('gets worse after a correct response, because the antagonist wears off first', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const initial = expert.events.find(({ eventId }) => eventId.startsWith('opioid-initial-reassessed-'))!;
    expect(initial.data).toMatchObject({ respiratoryRatePerMin: 14, spo2Percent: 97, etco2MmHg: 43 });
    const recurrence = expert.events.find(({ eventId }) => eventId.startsWith('opioid-recurrence-reviewed-'))!;
    expect(recurrence.data).toMatchObject({ respiratoryRatePerMin: 7, spo2Percent: 90, etco2MmHg: 58 });
    expect(JSON.stringify(recurrence)).toContain('opioid effect can outlast naloxone');
    // The direction of travel is the lesson: worse on every respiratory number.
    expect(Number(recurrence.data!.respiratoryRatePerMin))
      .toBeLessThan(Number(initial.data!.respiratoryRatePerMin));
    expect(Number(recurrence.data!.etco2MmHg)).toBeGreaterThan(Number(initial.data!.etco2MmHg));
  });

  it('refuses the naloxone intent while nobody is ventilating', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.patternReviewedAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      ventilationAtTick: null, antagonistAtTick: null, recurrencePlanAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Support airway and breathing immediately rather than waiting for an opioid antagonist to work.');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.recurrencePlanAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review responsiveness, pulse, breathing, oxygenation, carbon dioxide, glucose, exposure, and immediate mimics first.');
    expect(transcript).toContain('Review the fixed initial breathing and responsiveness panel before advancing the observation clock.');
    expect(recovered.patient.patternReviewedAtTick).toBeLessThan(recovered.patient.ventilationAtTick!);
    expect(recovered.patient.ventilationAtTick).toBeLessThan(recovered.patient.antagonistAtTick!);
    expect(recovered.patient.initialReassessmentAtTick).toBeLessThan(recovered.patient.recurrenceReviewedAtTick!);
    expect(recovered.patient.recurrenceReviewedAtTick).toBeLessThan(recovered.patient.recurrencePlanAtTick!);
  });

  it('refuses every later step before the pattern is reviewed', () => {
    for (const action of OPIOID_TOXICITY_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review responsiveness, pulse, breathing, oxygenation, carbon dioxide, glucose, exposure, and immediate mimics first.');
      expect(refused.patient.patternReviewedAtTick).toBeNull();
    }
  });

  it('refuses the safety plan until the recurrence panel has been read', () => {
    const short = run([
      [0, 'review-opioid-toxicity-pattern'],
      [1, 'record-opioid-ventilation-support'],
      [2, 'record-opioid-naloxone-intent'],
      [3, 'reassess-opioid-initial-response'],
      [4, 'record-opioid-recurrence-and-safety-plan'],
    ], 6);
    expect(short.patient.recurrencePlanAtTick).toBeNull();
    expect(JSON.stringify(short.events))
      .toContain('Recognize the fixed recurrent respiratory depression before recording renewed rescue and observation.');
  });
});
