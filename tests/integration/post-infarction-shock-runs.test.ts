/**
 * Reference transcripts for the post-infarction shock lesson, replayed through
 * the real engine.
 *
 * The assertion this file exists for is that a pressure response is never an
 * improvement and no device is ever chosen: pressureAloneUsed,
 * routineDeviceSelected and treatmentDelivered stay false on every frame.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { POST_INFARCTION_CARDIOGENIC_SHOCK_ESCALATION as SCENARIO } from '../../src/modules/cardiology/scenarios/post-infarction-cardiogenic-shock-escalation';
import { POST_INFARCTION_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/cardiology/post-infarction-shock-fixtures';
import type { PostInfarctionShockAction } from '../../src/modules/cardiology/post-infarction-shock';
import { postInfarctionShockCompletionEvidence } from '../../src/modules/cardiology/post-infarction-shock-completion';
import { postInfarctionShockInlinePrompt } from '../../src/modules/cardiology/tutor/post-infarction-shock-guidance';

type Choices = readonly (readonly [number, PostInfarctionShockAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PostInfarctionShockAction): LearnerAction => ({ tick, type: 'post-infarction-shock-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.postInfarctionShockAssessment);
    const prompt = postInfarctionShockInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.postInfarctionShockAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.postInfarctionShockAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.postInfarctionShockAssessment;
    if (patient) {
      expect(patient.pressureAloneUsed).toBe(false);
      expect(patient.routineDeviceSelected).toBe(false);
      expect(patient.treatmentDelivered).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.postInfarctionShockAssessment! };
}

describe('Post-infarction shock transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'ward', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(postInfarctionShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(postInfarctionShockCompletionEvidence(SCENARIO, ENGINE_VERSION, 'critical-care')).toEqual([]);
    expect(postInfarctionShockCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(postInfarctionShockCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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

  it('refuses the bridge while nobody has been called', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.causesAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      transferAtTick: null, bridgeAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Reopen causes and activate the shock/transfer pathway before recording the transport bridge');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'not-met', 'not-met', 'not-met']);
  });

  it('accepts the unordered pair call-first and clears the handoff gate', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met']);
    // The pair really was taken in the opposite order from the expert path.
    expect(recovered.patient.transferAtTick).toBeLessThan(recovered.patient.causesAtTick!);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the serial perfusion trajectory before cause review or escalation');
    expect(transcript).toContain('Reopen causes and activate the shock/transfer pathway before recording the transport bridge');
    expect(transcript).toContain('allow reassessment time to pass');
    expect(recovered.patient.causesAtTick).toBeLessThan(recovered.patient.bridgeAtTick!);
    expect(recovered.patient.bridgeAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('never lets the pressure response stand in for improvement', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.pressureAloneUsed).toBe(false);
    expect(expert.patient.routineDeviceSelected).toBe(false);
    expect(expert.patient.treatmentDelivered).toBe(false);
  });
});
