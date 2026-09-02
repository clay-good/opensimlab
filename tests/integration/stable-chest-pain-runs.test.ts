/**
 * Reference transcripts for the stable-chest-pain lesson, replayed through the
 * real engine.
 *
 * The first cardiology lesson given evidence, and the first anywhere in this
 * repository with no time gate: what the engine enforces is the order of
 * reasoning rather than the passage of time, because nobody here is
 * deteriorating.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { STABLE_CHEST_PAIN_EVALUATION as SCENARIO } from '../../src/modules/cardiology/scenarios/stable-chest-pain-evaluation';
import { STABLE_CHEST_PAIN_FIXTURES as FIXTURES } from '../../src/modules/cardiology/stable-chest-pain-fixtures';
import type { StableChestPainAction } from '../../src/modules/cardiology/stable-chest-pain';
import { stableChestPainCompletionEvidence } from '../../src/modules/cardiology/stable-chest-pain-completion';
import { stableChestPainInlinePrompt } from '../../src/modules/cardiology/tutor/stable-chest-pain-guidance';

type Choices = readonly (readonly [number, StableChestPainAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: StableChestPainAction): LearnerAction => ({ tick, type: 'stable-chest-pain-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.stableChestPainAssessment);
    const prompt = stableChestPainInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.stableChestPainAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.stableChestPainAssessment)).toBe(before);
    // The band stays a band and no test is ever performed, on any frame.
    const patient = frame.equipment.resuscitation.stableChestPainAssessment;
    if (patient) {
      expect(patient.clinicalLikelihood).toBe('not-very-low');
      expect(patient.exactScoreCalculated).toBe(false);
      expect(patient.testPerformed).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.stableChestPainAssessment! };
}

describe('Stable-chest-pain transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.1', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    // Five objectives, so this lesson clears the shared observable-objectives
    // cap that every six-objective pediatrics lesson leaves outstanding.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(stableChestPainCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(stableChestPainCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(stableChestPainCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(stableChestPainCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(expert.patient.safetyNetAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.stabilityAtTick).toBeNull();
  });

  it('refuses a testing pathway before the likelihood is estimated', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.patternAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      likelihoodAtTick: null, testingAtTick: null, safetyNetAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the whole clinical likelihood before recording a testing pathway');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from both order refusals and completes in order', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.safetyNetAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Verify stability and acute-change triggers before characterizing or testing');
    expect(transcript).toContain('Review the whole clinical likelihood before recording a testing pathway');
    expect(recovered.patient.stabilityAtTick).toBeLessThan(recovered.patient.patternAtTick!);
    expect(recovered.patient.patternAtTick).toBeLessThan(recovered.patient.likelihoodAtTick!);
    expect(recovered.patient.likelihoodAtTick).toBeLessThan(recovered.patient.testingAtTick!);
    expect(recovered.patient.testingAtTick).toBeLessThan(recovered.patient.safetyNetAtTick!);
  });

  it('keeps the likelihood a band and never calls the symptom atypical', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.clinicalLikelihood).toBe('not-very-low');
    expect(expert.patient.exactScoreCalculated).toBe(false);
    expect(expert.patient.testPerformed).toBe(false);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('without calling it atypical');
    expect(transcript).toContain('no exact score or coronary diagnosis was calculated');
    expect(transcript).toContain('No test was ordered or performed');
  });
});
