/**
 * The worked example and observed-state tutor for a clock that reads like a
 * closed door.
 *
 * Ten hours ends the conversation in the anterior circulation and does not end
 * it here. The escalation is also not downstream of the thrombolysis question —
 * the two run alongside each other — so both the tutor and the example refuse
 * to let the call wait on a treatment review or on watching which way he goes.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { BASILAR_ARTERY_OCCLUSION_ESCALATION as SCENARIO } from '../../src/modules/neurology/scenarios/basilar-artery-occlusion-escalation';
import { BASILAR_LVO_FIXTURES as FIXTURES } from '../../src/modules/neurology/basilar-artery-occlusion-escalation-fixtures';
import {
  BASILAR_LVO_DEMONSTRATION_VERSION, basilarLvoDemonstrationStep,
  supportsBasilarLvoDemonstration,
} from '../../src/modules/neurology/demo/basilar-artery-occlusion-escalation-demonstration';
import { basilarLvoInlinePrompt } from '../../src/modules/neurology/tutor/basilar-artery-occlusion-escalation-guidance';
import type { BasilarLvoAction } from '../../src/modules/neurology/basilar-artery-occlusion-escalation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyBasilarLvoAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: BasilarLvoAction) => {
  engine.apply({ tick, type: 'basilar-artery-occlusion-escalation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = basilarLvoDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'basilar-artery-occlusion-escalation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before It Waits', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(BASILAR_LVO_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsBasilarLvoDemonstration(SCENARIO)).toBe(true);
    expect(supportsBasilarLvoDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsBasilarLvoDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'imaging', 'boundary', 'activation', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.imagingAtTick!);
    expect(patient.imagingAtTick).toBeLessThan(patient.boundaryAtTick!);
    expect(patient.boundaryAtTick).toBeLessThan(patient.activationAtTick!);
    expect(patient.activationAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads the late clock as a reason to hurry rather than a closed door', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('not as a door that has closed');
    expect(opening).toContain('does not settle it here');
    expect(opening).toContain('filed under something benign');
  });

  it('reads the imaging as selection facts and the negatives as snapshots', () => {
    const imaging = narrations[beats.indexOf('imaging')]!;
    expect(imaging).toContain('selection facts, not a mechanism and not a verdict');
    expect(imaging).toContain('snapshots taken once');
    expect(beats.indexOf('imaging')).toBeLessThan(beats.indexOf('boundary'));
  });

  it('names the boundary as a reason to move rather than a decision about him', () => {
    const boundary = narrations[beats.indexOf('boundary')]!;
    expect(boundary).toContain('converts a set of facts into a reason to move');
    expect(boundary).toContain('rather than a decision about his eligibility');
    expect(patient.eligibilityDeterminedByLearner).toBe(false);
  });

  it('lets nothing hold the call, and keeps the secretions a snapshot', () => {
    const activation = narrations[beats.indexOf('activation')]!;
    expect(activation).toContain('does not wait on the thrombolysis review');
    expect(activation).toContain('cannot be recovered');
    expect(activation).toContain('stops being true without warning');
    expect(patient.qualifiedEndovascularOwnershipActive).toBe(true);
    expect(patient.qualifiedAirwayCapableOwnershipActive).toBe(true);
  });

  it('says unchanged is neither failure nor reassurance', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('Unchanged is not failure and not reassurance');
    expect(handoff).toContain('only as far as this snapshot goes');
    expect(narration).toContain('the vessel still an open question');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.strokeMimicExcluded).toBe(false);
    expect(patient.vesselPatencyProven).toBe(false);
    expect(patient.reperfusionProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableAirwayProtectionProven).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.deteriorationExcluded).toBe(false);
    expect(patient.dischargeReadinessProven).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the vessel has reopened', 'he is outside the window', 'this is vestibular', 'his airway is secure']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('scores nobody and selects no device, drug, airway, or anesthetic anywhere', () => {
    expect(patient.scoreCalculatedByLearner).toBe(false);
    expect(patient.neurologicExamPerformedByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.thrombolysisSelectedByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedByLearner).toBe(false);
    expect(patient.airwayProcedurePerformedByLearner).toBe(false);
    expect(patient.anesthesiaSelectedByLearner).toBe(false);
    expect(patient.thrombectomyDeviceSelectedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give tenecteplase', 'intubate him now', 'use a stent retriever', 'target a pressure of']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Refuses To Let The Call Wait', () => {
  it('opens on the clock as a reason to hurry', () => {
    const engine = create(); engine.step();
    const prompt = basilarLvoInlinePrompt('guided', {
      scenarioVersion: '0.1.0', basilarLvo: snapshot(engine),
    })!;
    expect(prompt.id).toBe('basilar-lvo-trajectory');
    expect(prompt.because).toContain('does not settle it here');
  });

  it('reads the imaging as selection facts, not a verdict', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = basilarLvoInlinePrompt('guided', {
      scenarioVersion: '0.1.0', basilarLvo: snapshot(engine),
    })!;
    expect(prompt.id).toBe('basilar-lvo-imaging');
    expect(prompt.because).toContain('selection facts, not a mechanism and not a verdict');
    expect(prompt.because).toContain('snapshots taken once');
  });

  it('names the boundary as a reason to move', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = basilarLvoInlinePrompt('guided', {
      scenarioVersion: '0.1.0', basilarLvo: snapshot(engine),
    })!;
    expect(prompt.id).toBe('basilar-lvo-boundary');
    expect(prompt.because).toContain('converts a set of facts into a reason to move');
    expect(prompt.because).toContain('stays with the qualified teams');
  });

  it('refuses to let the activation wait on anything', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = basilarLvoInlinePrompt('guided', {
      scenarioVersion: '0.1.0', basilarLvo: snapshot(engine),
    })!;
    expect(prompt.id).toBe('basilar-lvo-activation');
    expect(prompt.because).toContain('does not wait on the thrombolysis review');
    expect(prompt.because).toContain('stops being true without warning');
  });

  it('never determines eligibility, excludes a mimic, or picks a device', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = basilarLvoInlinePrompt('guided', {
        scenarioVersion: '0.1.0', basilarLvo: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the vessel has reopened', 'he is outside the window', 'this is vestibular', 'use a stent retriever']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(basilarLvoInlinePrompt('guided', { scenarioVersion: '0.1.0', basilarLvo: patient })!.id)
      .toBe('basilar-lvo-later');
    expect(basilarLvoInlinePrompt('coached', { scenarioVersion: '0.1.0', basilarLvo: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(basilarLvoInlinePrompt('unassisted', { scenarioVersion: '0.1.0', basilarLvo: patient })).toBeNull();
    expect(basilarLvoInlinePrompt('guided', { scenarioVersion: '0.1.1', basilarLvo: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(basilarLvoInlinePrompt('guided', { scenarioVersion: '0.1.0', basilarLvo: snapshot(engine) })).toBeNull();
  });
});
