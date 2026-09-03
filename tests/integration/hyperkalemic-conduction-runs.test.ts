/**
 * Reference transcripts for the hyperkalemic-conduction lesson, replayed
 * through the real engine.
 *
 * The assertion this file exists for is that a better-looking monitor never
 * shortens the review: the later panel refuses until all three parallel lanes
 * have landed, whatever order they came in.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { HYPERKALEMIC_CONDUCTION_DISTURBANCE as SCENARIO } from '../../src/modules/cardiology/scenarios/hyperkalemic-conduction-disturbance';
import { HYPERKALEMIC_CONDUCTION_FIXTURES as FIXTURES } from '../../src/modules/cardiology/hyperkalemic-conduction-fixtures';
import {
  HYPERKALEMIC_CONDUCTION_ACTIONS, supportsHyperkalemicConduction,
  type HyperkalemicConductionAction,
} from '../../src/modules/cardiology/hyperkalemic-conduction';
import { hyperkalemicConductionCompletionEvidence } from '../../src/modules/cardiology/hyperkalemic-conduction-completion';
import { hyperkalemicConductionInlinePrompt } from '../../src/modules/cardiology/tutor/hyperkalemic-conduction-guidance';

type Choices = readonly (readonly [number, HyperkalemicConductionAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: HyperkalemicConductionAction): LearnerAction => ({ tick, type: 'hyperkalemic-conduction-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    const before = JSON.stringify(frame.equipment.resuscitation.hyperkalemicConductionAssessment);
    const prompt = hyperkalemicConductionInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.hyperkalemicConductionAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.hyperkalemicConductionAssessment)).toBe(before);
    const patient = frame.equipment.resuscitation.hyperkalemicConductionAssessment;
    if (patient) {
      expect(patient.initialPulsePresent).toBe(true);
      expect(patient.treatmentDeliveredByLearner).toBe(false);
      expect(patient.pacingDelivered).toBe(false);
      expect(patient.captureAssessed).toBe(false);
      expect(patient.permanentDeviceSelected).toBe(false);
    }
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.hyperkalemicConductionAssessment! };
}

describe('Hyperkalemic conduction transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.0', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    expect(HYPERKALEMIC_CONDUCTION_ACTIONS).toHaveLength(6);
    expect(SCENARIO.metadata.objectives.map(({ id }) => id)).toEqual([...HYPERKALEMIC_CONDUCTION_ACTIONS]);
    expect(supportsHyperkalemicConduction(SCENARIO)).toBe(true);
    expect(supportsHyperkalemicConduction({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hyperkalemic-conduction-disturbance-boundary'),
    })).toBe(false);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'cardiology', 'clinic', 'state_transition');
    expect(audit.complete).toBe(false);
    // Six objectives, so the observable-objectives cap stays outstanding too.
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(hyperkalemicConductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'cardiology')).toHaveLength(9);
    expect(hyperkalemicConductionCompletionEvidence(SCENARIO, ENGINE_VERSION, 'emergency-medicine')).toEqual([]);
    expect(hyperkalemicConductionCompletionEvidence(SCENARIO, 'changed', 'cardiology')).toEqual([]);
    expect(hyperkalemicConductionCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'cardiology')).toEqual([]);
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
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.reconciledAtTick).toBeNull();
  });

  it('refuses the later panel when a narrower QRS is treated as the end of the review', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    expect(errored.patient.calciumResponseAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      shiftSurveillanceAtTick: null, removalDeviceAtTick: null,
      laterPanelAtTick: null, handoffAtTick: null,
    });
    expect(JSON.stringify(errored.events))
      .toContain('Review the calcium-response, shifting-surveillance, and removal/device-restraint lanes before the later panel');
  });

  it('accepts the three lanes in any order and clears both time gates', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    expect(transcript).toContain('Reconcile the pulse, whole-patient stability, potassium, ECG reports, and treatment timeline before interpreting the response');
    expect(transcript).toContain('Allow a later simulated tick before reviewing the authored follow-up potassium, glucose, and ECG report');
    expect(transcript).toContain('Allow a later simulated tick before handing off surveillance and the unresolved conduction question');
    // Removal, then shifting, then calcium — and nothing objects.
    expect(recovered.patient.removalDeviceAtTick).toBeLessThan(recovered.patient.shiftSurveillanceAtTick!);
    expect(recovered.patient.shiftSurveillanceAtTick).toBeLessThan(recovered.patient.calciumResponseAtTick!);
    expect(recovered.patient.calciumResponseAtTick).toBeLessThan(recovered.patient.laterPanelAtTick!);
    expect(recovered.patient.laterPanelAtTick).toBeLessThan(recovered.patient.handoffAtTick!);
  });

  it('refuses every later step before the three timepoints are put in order', () => {
    for (const action of HYPERKALEMIC_CONDUCTION_ACTIONS.slice(1)) {
      const refused = run([[0, action]], 2);
      expect(JSON.stringify(refused.events), action)
        .toContain('Reconcile the pulse, whole-patient stability, potassium, ECG reports, and treatment timeline before interpreting the response');
      expect(refused.patient.reconciledAtTick).toBeNull();
    }
  });

  it('lets nobody in this lesson deliver a treatment or choose a device', () => {
    const expert = run(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(expert.patient.treatmentDeliveredByLearner).toBe(false);
    expect(expert.patient.permanentDeviceSelected).toBe(false);
    const transcript = JSON.stringify(expert.events);
    expect(transcript).toContain('potassium 5.8 mmol/L');
    expect(transcript).toContain('no potassium-lowering effect');
  });
});
