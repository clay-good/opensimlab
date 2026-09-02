/**
 * The worked example and observed-state tutor for an empty cylinder in a
 * corridor.
 *
 * Note the scenario ships at content version 0.1.1 rather than 0.1.0, so
 * every version guard here is pinned to 0.1.1 deliberately.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OXYGEN_DEVICE_FAILURE as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/oxygen-device-failure';
import { OXYGEN_DEVICE_FAILURE_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/oxygen-device-failure-fixtures';
import {
  OXYGEN_DEVICE_FAILURE_DEMONSTRATION_VERSION, oxygenDeviceFailureDemonstrationStep,
  supportsOxygenDeviceFailureDemonstration,
} from '../../src/modules/respiratory-medicine/demo/oxygen-device-failure-demonstration';
import { oxygenDeviceFailureInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/oxygen-device-failure-guidance';
import type { OxygenDeviceFailureAction } from '../../src/modules/respiratory-medicine/oxygen-device-failure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.oxygenDeviceFailureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: OxygenDeviceFailureAction) => {
  engine.apply({ tick, type: 'oxygen-device-failure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = oxygenDeviceFailureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'oxygen-device-failure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Believes The Patient, Not The Dial', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(OXYGEN_DEVICE_FAILURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(supportsOxygenDeviceFailureDemonstration(SCENARIO)).toBe(true);
    expect(supportsOxygenDeviceFailureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
    expect(supportsOxygenDeviceFailureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['reconcile', 'bridge', 'path', 'restoration', 'response', 'handoff']);
    expect(patient.reconciledAtTick).toBeLessThan(patient.bridgeAtTick!);
    expect(patient.bridgeAtTick).toBeLessThan(patient.pathAtTick!);
    expect(patient.pathAtTick).toBeLessThan(patient.restorationAtTick!);
    // Two time gates: the three-minute review and the handoff each need a later tick.
    expect(patient.restorationAtTick).toBeLessThan(patient.responseAtTick!);
    expect(patient.responseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('takes none of the four reflexes', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.alternateSourceIntentRecorded).toBe(true);
  });

  it('names the trap: an attached interface is not delivered oxygen', () => {
    const reconcile = narrations[beats.indexOf('reconcile')]!;
    expect(reconcile).toContain('are not evidence of delivered oxygen');
    expect(reconcile).toContain('a display proxy, not a dose she is receiving');
    expect(patient.trueHypoxemiaAuthored).toBe(true);
    expect(patient.pulseSignalCoherentAuthored).toBe(true);
  });

  it('bridges before it diagnoses, and does not repair anything', () => {
    const bridge = narrations[beats.indexOf('bridge')]!;
    expect(bridge).toContain('the label on the fault can wait, and she cannot');
    expect(bridge).toContain('Bridging is not repairing');
    expect(patient.repairPerformedByLearner).toBe(false);
    expect(patient.connectionHandledByLearner).toBe(false);
  });

  it('traces the path and finds the cylinder empty', () => {
    const path = narrations[beats.indexOf('path')]!;
    expect(path).toContain('The cylinder is empty.');
    expect(path).toContain('without permanently excluding another cause');
    expect(patient.portableCylinderNoFlowAuthored).toBe(true);
    expect(patient.deviceInspectedByLearner).toBe(false);
  });

  it('puts a backup behind the restoration', () => {
    const restoration = narrations[beats.indexOf('restoration')]!;
    expect(restoration).toContain('independent backup');
    expect(restoration).toContain('an inconvenience rather than a repeat of this');
    expect(patient.sourceSelectedByLearner).toBe(false);
  });

  it('separates a restored number from a recovered patient', () => {
    const response = narrations[beats.indexOf('response')]!;
    expect(response).toContain('A restored number on a device is not a recovered patient');
    expect(patient.durableRestorationProven).toBe(false);
  });

  it('ends by sending the empty cylinder somewhere it will be looked at', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the cylinder that arrived empty');
    expect(narration).toContain('still just as scheduled as it was');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, operates nothing, and predicts nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.monitorInterpretedByLearner).toBe(false);
    expect(patient.interfaceSelectedByLearner).toBe(false);
    expect(patient.flowSelectedByLearner).toBe(false);
    expect(patient.fio2SelectedByLearner).toBe(false);
    expect(patient.oxygenTargetSelectedByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.deviceOperatedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['change the cylinder', 'swap the regulator', 'turn it up', 'she is fine now', 'safe to continue to imaging', 'she will recover']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers All Four Reflexes', () => {
  const V = '0.1.1';
  const atBridge = () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    return engine;
  };
  const atRestoration = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    return engine;
  };

  it('opens on the person and the pleth rather than the equipment', () => {
    const engine = create(); engine.step();
    const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('odf-reconcile');
    expect(prompt.suggestion).toContain('before you believe the equipment');
  });

  it('answers waiting for a blood gas', () => {
    const engine = atBridge();
    advance(engine, 1, 'wait-for-oxygen-device-failure-blood-gas');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('blood-gas');
    const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('odf-blood-gas-refused');
    expect(prompt.because).toContain('Tests are how you resolve doubt, and there is no doubt here');
  });

  it('answers carrying on to the scan', () => {
    const engine = atBridge();
    advance(engine, 1, 'continue-oxygen-device-failure-transport');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('continue-transport');
    const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('odf-transport-refused');
    expect(prompt.suggestion).toContain('Stop the trolley');
    expect(prompt.because).toContain('the least monitored place in the hospital');
  });

  it('answers turning up a depleted source', () => {
    const engine = atRestoration();
    advance(engine, 3, 'increase-depleted-oxygen-source-control');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('increase-source');
    const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('odf-increase-refused');
    expect(prompt.suggestion).toContain('nothing behind the number to turn up');
    expect(prompt.because).toContain('the number and the delivery had come apart');
  });

  it('answers reseating a cannula already reported patent', () => {
    const engine = atRestoration();
    advance(engine, 3, 'reseat-patent-oxygen-interface');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('reseat-cannula');
    const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('odf-reseat-refused');
    expect(prompt.suggestion).toContain('The problem is upstream of it');
    expect(prompt.because).toContain('a check that has already come back normal');
  });

  it('stops answering the wrong choice once the right one is taken', () => {
    const engine = atBridge();
    advance(engine, 1, 'continue-oxygen-device-failure-transport');
    advance(engine, 2, 'activate-oxygen-device-failure-immediate-bridge-and-help');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBeNull();
    expect(oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id).toBe('odf-path');
  });

  it('never repairs, selects a flow, or declares her safe to travel', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(7);
    for (const text of seen) {
      for (const forbidden of ['change the cylinder', 'swap the regulator', 'safe to continue to imaging', 'she will recover']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(oxygenDeviceFailureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    // 0.1.0 is a real version string for other lessons and is wrong for this one.
    expect(oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: '0.1.0', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(oxygenDeviceFailureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(oxygenDeviceFailureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
