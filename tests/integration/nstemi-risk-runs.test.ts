/**
 * Reference transcripts for the NSTEMI risk-reassessment lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that stability is never inherited: the
 * strategy step refuses until the very-high-risk features have been re-screened
 * in this moment rather than an earlier one.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { NSTEMI_RISK_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/nstemi-risk-reassessment';
import { NSTEMI_RISK_FIXTURES as FIXTURES } from '../../src/modules/cardiology/nstemi-risk-fixtures';
import { NSTEMI_RISK_OBJECTIVES, type NstemiRiskAction } from '../../src/modules/cardiology/nstemi-risk';
import { nstemiRiskCompletionEvidence } from '../../src/modules/cardiology/nstemi-risk-completion';
import { nstemiRiskInlinePrompt } from '../../src/modules/cardiology/tutor/nstemi-risk-guidance';

type Choices = readonly (readonly [number, NstemiRiskAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: NstemiRiskAction): LearnerAction => ({ tick, type: 'nstemi-risk-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.nstemiRiskAssessment);
    const prompt = nstemiRiskInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.nstemiRiskAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.nstemiRiskAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.nstemiRiskAssessment;
    if (patient) {
      expect(patient.ischemicRisk).toBe('high');
      expect(patient.currentVeryHighRisk).toBe(false);
      expect(patient.exactScoreCalculated).toBe(false);
      expect(patient.procedurePerformed).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.nstemiRiskAssessment! };
}

describe('NSTEMI risk-reassessment transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    // The declared objectives are not the accepted action ids in this lesson.
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...NSTEMI_RISK_OBJECTIVES]);
    expect(NSTEMI_RISK_OBJECTIVES).toContain('classify-nstemi-invasive-strategy');
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(nstemiRiskCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(nstemiRiskCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(nstemiRiskCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(nstemiRiskCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(expert.patient.handoffAtTick).not.toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.trajectoryAtTick).toBeNull();
  });

  it('refuses a strategy recorded on inherited stability', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.verificationAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      veryHighRiskAtTick: null, strategyAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Re-screen current very-high-risk features before recording invasive strategy');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from both order refusals and completes in order', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the complete serial trajectory before classifying risk or strategy');
    expect(transcript).toContain('Re-screen current very-high-risk features before recording invasive strategy');
    expect(recovered.patient.trajectoryAtTick).toBeLessThan(recovered.patient.verificationAtTick!);
    expect(recovered.patient.verificationAtTick).toBeLessThan(recovered.patient.veryHighRiskAtTick!);
    expect(recovered.patient.veryHighRiskAtTick).toBeLessThan(recovered.patient.strategyAtTick!);
    expect(recovered.patient.strategyAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('reads three findings as one trajectory and claims no timing', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.ischemicRisk).toBe('high');
    expect(expert.patient.currentVeryHighRisk).toBe(false);
    expect(expert.patient.exactScoreCalculated).toBe(false);
    expect(expert.patient.procedurePerformed).toBe(false);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('One isolated value was not used');
  });
});
