/**
 * Reference transcripts for the transcutaneous-pacing capture lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is the strictness: this is the only
 * cardiology lesson with no unordered lane anywhere, because the patient has no
 * pulse and there is nothing a learner may legitimately do first.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { TRANSCUTANEOUS_PACING_MECHANICAL_CAPTURE_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/transcutaneous-pacing-mechanical-capture-reassessment';
import { TRANSCUTANEOUS_PACING_CAPTURE_FIXTURES as FIXTURES } from '../../src/modules/cardiology/transcutaneous-pacing-capture-fixtures';
import {
  TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS, supportsTranscutaneousPacingCapture,
  type TranscutaneousPacingCaptureAction,
} from '../../src/modules/cardiology/transcutaneous-pacing-capture';
import { transcutaneousPacingCaptureCompletionEvidence } from '../../src/modules/cardiology/transcutaneous-pacing-capture-completion';
import { transcutaneousPacingCaptureInlinePrompt } from '../../src/modules/cardiology/tutor/transcutaneous-pacing-capture-guidance';

type Choices = readonly (readonly [number, TranscutaneousPacingCaptureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: TranscutaneousPacingCaptureAction): LearnerAction => ({ tick, type: 'transcutaneous-pacing-capture-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.transcutaneousPacingCaptureAssessment);
    const prompt = transcutaneousPacingCaptureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.transcutaneousPacingCaptureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.transcutaneousPacingCaptureAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.transcutaneousPacingCaptureAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(false);
      expect(patient.electricalCaptureAuthored).toBe(true);
      expect(patient.mechanicalCaptureAbsent).toBe(true);
      expect(patient.cprDeliveredByLearner).toBe(false);
      expect(patient.pacingDeliveredByLearner).toBe(false);
      expect(patient.roscReported).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.transcutaneousPacingCaptureAssessment! };
}

describe('Transcutaneous-pacing capture transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    // Four steps and four objectives: the shortest lesson in the module.
    expect(TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS).toHaveLength(4);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS]);
    expect(supportsTranscutaneousPacingCapture(SCENARIO)).toBe(true);
    expect(supportsTranscutaneousPacingCapture({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['inclusive-runtime-verification', 'report-control-coverage']);
    expect(transcutaneousPacingCaptureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(8);
    expect(transcutaneousPacingCaptureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(transcutaneousPacingCaptureCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(transcutaneousPacingCaptureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    expect(expert.patient.handoffAtTick).not.toBeNull();
    expect(expert.patient.nonshockableArrestPathwayActivated).toBe(true);
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.recognitionAtTick).toBeNull();
    expect(idle.patient.nonshockableArrestPathwayActivated).toBe(false);
  });

  it('refuses the cause review while nobody has started the arrest', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.recognitionAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      pulselessResponseAtTick: null, causesBridgeAtTick: null, handoffAtTick: null,
    });
    expect(errored.patient.nonshockableArrestPathwayActivated).toBe(false);
    expect(JSON.stringify(errored.events))
      .toContain('Activate the pulse-loss pathway before reviewing causes or any later pacing bridge');
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met']);
  });

  it('recovers from both refusals and clears the time gate', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the authored electrical and mechanical capture evidence before opening the pulse-loss pathway');
    expect(transcript).toContain('Activate the pulse-loss pathway before reviewing causes or any later pacing bridge');
    expect(transcript).toContain('Allow a later simulated tick before handing off the active resuscitation trajectory');
    expect(recovered.patient.recognitionAtTick).toBeLessThan(recovered.patient.pulselessResponseAtTick!);
    expect(recovered.patient.pulselessResponseAtTick).toBeLessThan(recovered.patient.causesBridgeAtTick!);
    expect(recovered.patient.causesBridgeAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the capture evidence is reconciled', () => {
    for (const action of TRANSCUTANEOUS_PACING_CAPTURE_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the authored electrical and mechanical capture evidence before opening the pulse-loss pathway');
      expect(refused.patient.recognitionAtTick).toBeNull();
    }
  });

  it('never reports a return of circulation and never delivers anything', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.roscReported).toBe(false);
    expect(expert.patient.outcomePredicted).toBe(false);
    expect(expert.patient.cprDeliveredByLearner).toBe(false);
    expect(expert.patient.procedurePerformedByLearner).toBe(false);
  });
});
