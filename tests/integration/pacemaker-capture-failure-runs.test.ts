/**
 * Reference transcripts for the pacemaker capture-failure lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that the rescue is one of the three
 * lanes rather than a step after them: a learner can troubleshoot the device
 * perfectly and still leave a dependent patient at 32/min waiting.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { PACEMAKER_CAPTURE_FAILURE as SCENARIO } from '../../src/modules/cardiology/scenarios/pacemaker-capture-failure';
import { PACEMAKER_CAPTURE_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/pacemaker-capture-failure-fixtures';
import {
  PACEMAKER_CAPTURE_FAILURE_ACTIONS, supportsPacemakerCaptureFailure,
  type PacemakerCaptureFailureAction,
} from '../../src/modules/cardiology/pacemaker-capture-failure';
import { pacemakerCaptureFailureCompletionEvidence } from '../../src/modules/cardiology/pacemaker-capture-failure-completion';
import { pacemakerCaptureFailureInlinePrompt } from '../../src/modules/cardiology/tutor/pacemaker-capture-failure-guidance';

type Choices = readonly (readonly [number, PacemakerCaptureFailureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: PacemakerCaptureFailureAction): LearnerAction => ({ tick, type: 'pacemaker-capture-failure-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.pacemakerCaptureFailureAssessment);
    const prompt = pacemakerCaptureFailureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.pacemakerCaptureFailureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.pacemakerCaptureFailureAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.pacemakerCaptureFailureAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(true);
      expect(patient.electricalCaptureFailureAuthored).toBe(true);
      expect(patient.pacingDeliveredByLearner).toBe(false);
      expect(patient.deviceInterrogatedByLearner).toBe(false);
      expect(patient.deviceProgrammedByLearner).toBe(false);
      expect(patient.leadManipulatedByLearner).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.pacemakerCaptureFailureAssessment! };
}

describe('Pacemaker capture-failure transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(PACEMAKER_CAPTURE_FAILURE_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...PACEMAKER_CAPTURE_FAILURE_ACTIONS]);
    expect(SCENARIO.timeline.every((event) => event.type === 'narrative')).toBe(true);
    expect(supportsPacemakerCaptureFailure(SCENARIO)).toBe(true);
    expect(supportsPacemakerCaptureFailure({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.id !== 'pacemaker-capture-failure-device-report'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(pacemakerCaptureFailureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(pacemakerCaptureFailureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(pacemakerCaptureFailureCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(pacemakerCaptureFailureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(expert.patient.handoffAtTick).not.toBeNull();
    expect(expert.patient.rescueAtTick).toBeLessThan(expert.patient.deviceSystemAtTick!);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.recognitionAtTick).toBeNull();
  });

  it('lets both troubleshooting lanes be correct and still refuses, because nobody organised the bridge', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.deviceSystemAtTick).not.toBeNull();
    expect(errored.patient.causesAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({ rescueAtTick: null, laterPanelAtTick: null, handoffAtTick: null });
    expect(JSON.stringify(errored.events))
      .toContain('Activate rescue and complete both device-system and cause-review lanes before reviewing the later panel');
    expect(findings(errored.events).filter(({ outcome }) => outcome === 'met')).toHaveLength(3);
  });

  it('accepts the three lanes in any order and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the authored pulse, perfusion, and electrical-noncapture pattern before rescue or device review');
    expect(transcript).toContain('Allow a later simulated tick before reviewing the authored experienced-team response');
    expect(transcript).toContain('Allow another later simulated tick before handing off the unresolved device-system trajectory');
    // Causes, then device, then rescue — and nothing objects to the rescue coming last.
    expect(recovered.patient.causesAtTick).toBeLessThan(recovered.patient.deviceSystemAtTick!);
    expect(recovered.patient.deviceSystemAtTick).toBeLessThan(recovered.patient.rescueAtTick!);
    expect(recovered.patient.rescueAtTick).toBeLessThan(recovered.patient.laterPanelAtTick!);
  });

  it('refuses every later step before the pulse and the pattern are reconciled', () => {
    for (const action of PACEMAKER_CAPTURE_FAILURE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the authored pulse, perfusion, and electrical-noncapture pattern before rescue or device review');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('interrogates nothing, programs nothing, and paces nothing', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.deviceInterrogatedByLearner).toBe(false);
    expect(expert.patient.deviceProgrammedByLearner).toBe(false);
    expect(expert.patient.outputSelectedByLearner).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
  });
});
