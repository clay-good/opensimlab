/**
 * Reference transcripts for the portable-oxygen-failure lesson, replayed
 * through the real engine.
 *
 * All four authored errors are ordinary reflexes rather than blunders, and
 * they are offered at two separate moments: before the bridge, and again
 * after the empty cylinder has been localized.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine, ENGINE_VERSION } from '@anesthesia/engine';
import { auditClinicalScenario } from '@anesthesia/catalog/scenario-completion';
import { objectiveFindings } from '@anesthesia/ui/Debrief';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EngineEvent, LearnerAction } from '@platform/kernel/protocol';
import { OXYGEN_DEVICE_FAILURE as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/oxygen-device-failure';
import { OXYGEN_DEVICE_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/oxygen-device-failure-fixtures';
import type { OxygenDeviceFailureAction } from '../../src/modules/respiratory-medicine/oxygen-device-failure';
import { oxygenDeviceFailureCompletionEvidence } from '../../src/modules/respiratory-medicine/oxygen-device-failure-completion';
import { oxygenDeviceFailureInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/oxygen-device-failure-guidance';

type Choices = readonly (readonly [number, OxygenDeviceFailureAction])[];
const create = (region: 'US' | 'GB' = 'US') => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: region });
const choice = (tick: number, action: OxygenDeviceFailureAction): LearnerAction => ({ tick, type: 'oxygen-device-failure-response', payload: { action } });
const findings = (events: readonly EngineEvent[]) => objectiveFindings(SCENARIO, [], 0, 0, [], events);

function run(actions: Choices, until: number, level: GuidanceLevel = 'unassisted', region: 'US' | 'GB' = 'US') {
  const engine = create(region); const hash = createHash('sha256'); const events: EngineEvent[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step(); events.push(...frame.events);
    hash.update(JSON.stringify(frame));
    // Reading the tutor must never move the lesson forward.
    const before = JSON.stringify(frame.equipment.resuscitation.oxygenDeviceFailureAssessment);
    const prompt = oxygenDeviceFailureInlinePrompt(level, { scenarioVersion: SCENARIO.metadata.version,
      patient: frame.equipment.resuscitation.oxygenDeviceFailureAssessment });
    if (level === 'unassisted') expect(prompt).toBeNull();
    expect(JSON.stringify(frame.equipment.resuscitation.oxygenDeviceFailureAssessment)).toBe(before);
  }
  expect(next).toBe(actions.length);
  return { events, hash: hash.digest('hex'), patient: engine.equipment().resuscitation.oxygenDeviceFailureAssessment! };
}

describe('Portable-oxygen-failure transcripts through the real engine and debrief', () => {
  it('binds exact content and observed state without upgrading pending clinical evidence', () => {
    expect(SCENARIO.metadata).toMatchObject({ version: '0.1.1', maturity: 'preview' });
    expect(SCENARIO.metadata.clinicalReview.reviewer).toBe('UNSIGNED');
    expect(FIXTURES.scenarioId).toBe(SCENARIO.metadata.id);
    const audit = auditClinicalScenario(SCENARIO, ENGINE_VERSION, 'respiratory-medicine', 'icu', 'state_transition');
    expect(audit.complete).toBe(false);
    expect(audit.requirements.filter(({ status }) => status === 'missing').map(({ id }) => id))
      .toEqual(['observable-objectives', 'inclusive-runtime-verification', 'report-control-coverage']);
    expect(oxygenDeviceFailureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'respiratory-medicine')).toHaveLength(10);
    expect(oxygenDeviceFailureCompletionEvidence(SCENARIO, ENGINE_VERSION, 'obstetrics')).toEqual([]);
    expect(oxygenDeviceFailureCompletionEvidence(SCENARIO, 'changed', 'respiratory-medicine')).toEqual([]);
    expect(oxygenDeviceFailureCompletionEvidence({ ...SCENARIO, patient: { ...SCENARIO.patient, weightKg: 9 } }, ENGINE_VERSION, 'respiratory-medicine')).toEqual([]);
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
    expect(expert.patient.lastUnsupportedChoice).toBeNull();
    const idle = run(FIXTURES.noAction, 8);
    expect(findings(idle.events).map(({ outcome }) => outcome))
      .toEqual(['not-met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(idle.patient.reconciledAtTick).toBeNull();
  });

  it('stops the trolley rather than letting transport continue', () => {
    const errored = run(FIXTURES.commonError, FIXTURES.commonError.at(-1)![0] + 2);
    // She was correctly recognized. Carrying on was the decision.
    expect(errored.patient.reconciledAtTick).not.toBeNull();
    expect(errored.patient).toMatchObject({
      bridgeAtTick: null, pathAtTick: null, restorationAtTick: null,
      responseAtTick: null, handoffAtTick: null,
      lastUnsupportedChoice: 'continue-transport',
    });
    expect(errored.patient.alternateSourceIntentRecorded).toBe(false);
    expect(findings(errored.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'not-met', 'not-met', 'not-met', 'not-met', 'not-met']);
    expect(JSON.stringify(errored.events)).toContain('Pause transport and restore reliable oxygen delivery');
    expect(JSON.stringify(errored.events)).toContain('Nothing changed.');
  });

  it('lets the same run recover from all four reflexes, and certifies nothing at the end of it', () => {
    const recovered = run(FIXTURES.recovery, FIXTURES.recovery.at(-1)![0] + 2);
    expect(recovered.patient.handoffAtTick).not.toBeNull();
    expect(findings(recovered.events).map(({ outcome }) => outcome))
      .toEqual(['met', 'met', 'met', 'met', 'met', 'met']);
    const transcript = JSON.stringify(recovered.events);
    // Both decision points refused, and every refusal survives the correction.
    expect(transcript).toContain('Pause transport and restore reliable oxygen delivery');
    expect(transcript).toContain('verified support cannot wait for another test');
    expect(transcript).toContain('cannot deliver the intended oxygen by selecting a higher number');
    expect(transcript).toContain('The cannula is already positioned and patent');
    expect(recovered.patient.lastUnsupportedChoice).toBeNull();
    expect(recovered.patient.alternateSourceIntentRecorded).toBe(true);
    expect(recovered.patient.portableCylinderNoFlowAuthored).toBe(true);
    expect(recovered.patient.patientExaminedByLearner).toBe(false);
    expect(recovered.patient.monitorInterpretedByLearner).toBe(false);
    expect(recovered.patient.deviceInspectedByLearner).toBe(false);
    expect(recovered.patient.sourceSelectedByLearner).toBe(false);
    expect(recovered.patient.interfaceSelectedByLearner).toBe(false);
    expect(recovered.patient.flowSelectedByLearner).toBe(false);
    expect(recovered.patient.fio2SelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenTargetSelectedByLearner).toBe(false);
    expect(recovered.patient.oxygenDeliveredByLearner).toBe(false);
    expect(recovered.patient.deviceOperatedByLearner).toBe(false);
    expect(recovered.patient.connectionHandledByLearner).toBe(false);
    expect(recovered.patient.repairPerformedByLearner).toBe(false);
    expect(recovered.patient.treatmentDeliveredByLearner).toBe(false);
    expect(recovered.patient.durableRestorationProven).toBe(false);
    expect(recovered.patient.dispositionDetermined).toBe(false);
    expect(recovered.patient.outcomePredicted).toBe(false);
  });
});
