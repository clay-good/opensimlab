/**
 * Reference transcripts for the spontaneous-breathing-trial lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the trial is gated behind the
 * readiness review, so nobody runs one on a patient they never assessed.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { SPONTANEOUS_BREATHING_TRIAL as SCENARIO } from '../../src/modules/critical-care/scenarios/spontaneous-breathing-trial';
import { SPONTANEOUS_BREATHING_TRIAL_FIXTURES as FIXTURES } from '../../src/modules/critical-care/spontaneous-breathing-trial-fixtures';
import {
  SPONTANEOUS_BREATHING_TRIAL_ACTIONS, supportsSpontaneousBreathingTrial,
  type SpontaneousBreathingTrialAction,
} from '../../src/modules/critical-care/spontaneous-breathing-trial';
import { spontaneousBreathingTrialCompletionEvidence } from '../../src/modules/critical-care/spontaneous-breathing-trial-completion';
import { spontaneousBreathingTrialInlinePrompt } from '../../src/modules/critical-care/tutor/spontaneous-breathing-trial-guidance';

type Choices = readonly (readonly [number, SpontaneousBreathingTrialAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: SpontaneousBreathingTrialAction): LearnerAction => ({ tick, type: 'spontaneous-breathing-trial-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.spontaneousBreathingTrialAssessment);
    const prompt = spontaneousBreathingTrialInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.spontaneousBreathingTrialAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.spontaneousBreathingTrialAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.spontaneousBreathingTrialAssessment! };
}

describe('Spontaneous breathing trial transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(SPONTANEOUS_BREATHING_TRIAL_ACTIONS).toHaveLength(5);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...SPONTANEOUS_BREATHING_TRIAL_ACTIONS]);
    expect(SCENARIO.timeline).toHaveLength(2);
    expect(supportsSpontaneousBreathingTrial(SCENARIO)).toBe(true);
    expect(supportsSpontaneousBreathingTrial({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'spontaneous-breathing-trial-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'critical-care', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(spontaneousBreathingTrialCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toHaveLength(9);
    expect(spontaneousBreathingTrialCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toEqual([]);
    expect(spontaneousBreathingTrialCompletionEvidence(SCENARIO, 'changed', 'critical-care')).toEqual([]);
    expect(spontaneousBreathingTrialCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'critical-care')).toEqual([]);
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
    expect(expert.patient.planAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.readinessAtTick).toBeNull();
  });

  it('refuses the whole trial when nobody reviewed readiness', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient).toMatchObject({
      readinessAtTick: null, startedAtTick: null, failureAtTick: null,
      recoveryAtTick: null, planAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review standardized readiness before starting a trial');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
  });

  it('refuses each skipped step in turn and still completes from the same positions', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.planAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Review standardized readiness before starting a trial');
    expect(transcript).toContain('Stop the failed trial and review recovery before planning another assessment');
    expect(recovered.patient.readinessAtTick).toBeLessThan(recovered.patient.startedAtTick!);
    expect(recovered.patient.startedAtTick).toBeLessThan(recovered.patient.failureAtTick!);
    expect(recovered.patient.failureAtTick).toBeLessThan(recovered.patient.recoveryAtTick!);
    expect(recovered.patient.recoveryAtTick).toBeLessThan(recovered.patient.planAtTick!);
  });

  it('refuses every later step before readiness is reviewed', () => {
    for (const action of SPONTANEOUS_BREATHING_TRIAL_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Review standardized readiness before starting a trial');
      expect(refused.patient.readinessAtTick).toBeNull();
    }
  });

  it('refuses the tolerance panel until a trial has actually been started', () => {
    const short = run([[0, 'review-sbt-readiness'], [1, 'recognize-sbt-failure']], 4);
    expect(JSON.stringify(short.events))
      .toContain('Start the bounded trial before reviewing its tolerance panel');
    expect(short.patient.failureAtTick).toBeNull();
  });
});
