/**
 * Reference transcripts for the decompensated heart-failure lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that an improved symptom never
 * produces a discharge-ready patient: residualCongestion stays true and
 * dischargeReady stays false on every frame of every path.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { ACUTE_DECOMPENSATED_HEART_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/acute-decompensated-heart-failure';
import { HEART_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/heart-failure-fixtures';
import type { HeartFailureAction } from '../../src/modules/cardiology/heart-failure';
import { heartFailureCompletionEvidence } from '../../src/modules/cardiology/heart-failure-completion';
import { heartFailureInlinePrompt } from '../../src/modules/cardiology/tutor/heart-failure-guidance';

type Choices = readonly (readonly [number, HeartFailureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HeartFailureAction): LearnerAction => ({ tick, type: 'heart-failure-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.heartFailureAssessment);
    const prompt = heartFailureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.heartFailureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.heartFailureAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.heartFailureAssessment;
    if (patient) {
      expect(patient.residualCongestion).toBe(true);
      expect(patient.dischargeReady).toBe(false);
      expect(patient.doseCalculated).toBe(false);
      expect(patient.treatmentDelivered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.heartFailureAssessment! };
}

describe('Heart-failure transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(heartFailureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(heartFailureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(heartFailureCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(heartFailureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(expert.patient.readinessAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.statusAtTick).toBeNull();
  });

  it('refuses a transition recorded on the improved symptom alone', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.statusAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      responseAtTick: null, toleranceAtTick: null, transitionAtTick: null, readinessAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the reported decongestion response before tolerance and precipitant context');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from both order refusals and completes in order', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.readinessAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile current congestion and perfusion before judging response or transition');
    expect(transcript).toContain('Review tolerance and precipitant context before recording transition intent');
    expect(recovered.patient.statusAtTick).toBeLessThan(recovered.patient.responseAtTick!);
    expect(recovered.patient.responseAtTick).toBeLessThan(recovered.patient.toleranceAtTick!);
    expect(recovered.patient.toleranceAtTick).toBeLessThan(recovered.patient.transitionAtTick!);
    expect(recovered.patient.transitionAtTick).toBeLessThan(recovered.patient.readinessAtTick!);
  });

  it('keeps him congested and not discharge-ready at the end', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.residualCongestion).toBe(true);
    expect(expert.patient.dischargeReady).toBe(false);
    expect(expert.patient.doseCalculated).toBe(false);
    expect(expert.patient.treatmentDelivered).toBe(false);
  });
});
