/**
 * Reference transcripts for the AF-with-rapid-response lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that a lower rate never settles the
 * two questions that matter: durationCertain stays false and no score is ever
 * calculated, on every frame of every path.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE as SCENARIO } from '../../src/modules/cardiology/scenarios/atrial-fibrillation-with-rapid-response';
import { AF_RVR_FIXTURES as FIXTURES } from '../../src/modules/cardiology/af-rvr-fixtures';
import type { AfRvrAction } from '../../src/modules/cardiology/af-rvr';
import { afRvrCompletionEvidence } from '../../src/modules/cardiology/af-rvr-completion';
import { afRvrInlinePrompt } from '../../src/modules/cardiology/tutor/af-rvr-guidance';

type Choices = readonly (readonly [number, AfRvrAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: AfRvrAction): LearnerAction => ({ tick, type: 'af-rvr-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.afRvrAssessment);
    const prompt = afRvrInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.afRvrAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.afRvrAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.afRvrAssessment;
    if (patient) {
      expect(patient.hemodynamicallyStable).toBe(true);
      expect(patient.durationCertain).toBe(false);
      expect(patient.exactScoreCalculated).toBe(false);
      expect(patient.treatmentDelivered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.afRvrAssessment! };
}

describe('AF-RVR transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(afRvrCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(afRvrCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(afRvrCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(afRvrCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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

  it('refuses rate-control intent before the duration has been asked about', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.stabilityAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      contextAtTick: null, rateIntentAtTick: null, strokePreventionAtTick: null, reassessmentAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review duration, history, ventricular function, and contributors before recording rate-control intent');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from both order refusals and completes in order', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.reassessmentAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile rhythm and current stability before rate, rhythm, or stroke-prevention planning');
    expect(transcript).toContain('Record bounded rate-control intent before stroke-prevention planning');
    expect(recovered.patient.stabilityAtTick).toBeLessThan(recovered.patient.contextAtTick!);
    expect(recovered.patient.contextAtTick).toBeLessThan(recovered.patient.rateIntentAtTick!);
    expect(recovered.patient.rateIntentAtTick).toBeLessThan(recovered.patient.strokePreventionAtTick!);
    expect(recovered.patient.strokePreventionAtTick).toBeLessThan(recovered.patient.reassessmentAtTick!);
  });

  it('leaves the duration uncertain and the score uncalculated at the end', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.hemodynamicallyStable).toBe(true);
    expect(expert.patient.durationCertain).toBe(false);
    expect(expert.patient.exactScoreCalculated).toBe(false);
    expect(expert.patient.treatmentDelivered).toBe(false);
  });
});
