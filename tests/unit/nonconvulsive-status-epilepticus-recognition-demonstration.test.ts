/**
 * The worked example and observed-state tutor for a seizure with nothing to
 * watch.
 *
 * This is the mirror of the focal-motor lesson: there the movement was visible
 * and waiting for an EEG was the error, and here there is nothing to see, so
 * the error runs the other way. Both the tutor and the example name a suspicion
 * without diagnosing from the bedside, and both treat the urgent recording as
 * the boundary.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NONCONVULSIVE_STATUS_EPILEPTICUS_RECOGNITION as SCENARIO } from '../../src/modules/neurology/scenarios/nonconvulsive-status-epilepticus-recognition';
import { NCSE_FIXTURES as FIXTURES } from '../../src/modules/neurology/nonconvulsive-status-epilepticus-recognition-fixtures';
import {
  NCSE_DEMONSTRATION_VERSION, ncseDemonstrationStep,
  supportsNcseDemonstration,
} from '../../src/modules/neurology/demo/nonconvulsive-status-epilepticus-recognition-demonstration';
import { ncseInlinePrompt } from '../../src/modules/neurology/tutor/nonconvulsive-status-epilepticus-recognition-guidance';
import type { NcseAction } from '../../src/modules/neurology/nonconvulsive-status-epilepticus-recognition';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyNcseAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NcseAction) => {
  engine.apply({ tick, type: 'nonconvulsive-status-epilepticus-recognition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = ncseDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'nonconvulsive-status-epilepticus-recognition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Asks For The Recording', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NCSE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNcseDemonstration(SCENARIO)).toBe(true);
    expect(supportsNcseDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNcseDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'suspicion', 'ownership', 'alternatives', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.suspicionAtTick!);
    expect(patient.suspicionAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.alternativesAtTick!);
    expect(patient.alternativesAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('describes the fluctuation in seconds rather than as confusion', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('Delirium waxes over hours');
    expect(opening).toContain('on a scale of seconds');
  });

  it('names a suspicion and the recording, and refuses both halves', () => {
    const suspicion = narrations[beats.indexOf('suspicion')]!;
    expect(suspicion).toContain('cannot make this diagnosis from the bedside');
    expect(suspicion).toContain('cannot wait to suspect it');
    expect(patient.clinicalOnlyNcseDiagnosisMade).toBe(false);
  });

  it('calls the EEG service rather than requesting a box', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('a staffing question as much as a clinical one');
    expect(ownership).toContain('has not been reliably awake');
    expect(patient.eegPlacedByLearner).toBe(false);
  });

  it('works the alternatives alongside the recording and names how this gets lost', () => {
    const alternatives = narrations[beats.indexOf('alternatives')]!;
    expect(alternatives).toContain('alongside the EEG rather than instead of it');
    expect(alternatives).toContain('becomes a delirium workup');
    expect(patient.qualifiedNeurologyOwnershipActive).toBe(true);
    expect(patient.qualifiedEegOwnershipActive).toBe(true);
    expect(patient.qualifiedAirwayOwnershipActive).toBe(true);
  });

  it('reads the absent motor correlate as the reason it was invisible', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('why this was invisible, not a reason to doubt it');
    expect(handoff).toContain('ACNS electrographic-status definition');
    expect(narration).toContain('looking exactly as she did');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.clinicalOnlyNcseDiagnosisMade).toBe(false);
    expect(patient.causeProven).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableElectrographicControlProven).toBe(false);
    expect(patient.durableNeurologicRecoveryProven).toBe(false);
    expect(patient.durableAirwayProtectionProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is nonconvulsive status', 'she is just delirious', 'the eeg will be normal', 'this is a stroke']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('places no EEG and selects no drug, dose, oxygen, or airway anywhere', () => {
    expect(patient.seizureTimedByLearner).toBe(false);
    expect(patient.eegPlacedByLearner).toBe(false);
    expect(patient.rawEegInterpretedByLearner).toBe(false);
    expect(patient.glucoseAcquiredByLearner).toBe(false);
    expect(patient.sodiumAcquiredByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.airwayDeviceSelectedByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 4 mg of lorazepam', 'load with levetiracetam', 'place the electrodes yourself', 'start a propofol infusion']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Refuses Both Halves', () => {
  it('opens on a fluctuation measured in seconds', () => {
    const engine = create(); engine.step();
    const prompt = ncseInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ncse: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ncse-trajectory');
    expect(prompt.because).toContain('Delirium waxes over hours');
  });

  it('names a suspicion and the test, and neither diagnoses nor waits', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = ncseInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ncse: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ncse-suspicion');
    expect(prompt.suggestion).toContain('needs an urgent EEG');
    expect(prompt.because).toContain('cannot make this diagnosis from the bedside');
    expect(prompt.because).toContain('cannot wait to suspect it');
  });

  it('calls the EEG service rather than ordering a box', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = ncseInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ncse: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ncse-ownership');
    expect(prompt.because).toContain('a staffing question as much as a clinical one');
    expect(prompt.because).toContain('has not been reliably awake');
  });

  it('names how this diagnosis usually gets lost', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = ncseInlinePrompt('guided', {
      scenarioVersion: '0.1.0', ncse: snapshot(engine),
    })!;
    expect(prompt.id).toBe('ncse-alternatives');
    expect(prompt.because).toContain('becomes a delirium workup');
    expect(prompt.because).toContain('at this minute rather than permanently');
  });

  it('never diagnoses from the bedside, excludes a cause, or picks a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = ncseInlinePrompt('guided', {
        scenarioVersion: '0.1.0', ncse: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['this is nonconvulsive status', 'she is just delirious', 'the eeg will be normal', 'give 4 mg of lorazepam']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(ncseInlinePrompt('guided', { scenarioVersion: '0.1.0', ncse: patient })!.id)
      .toBe('ncse-later');
    expect(ncseInlinePrompt('coached', { scenarioVersion: '0.1.0', ncse: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(ncseInlinePrompt('unassisted', { scenarioVersion: '0.1.0', ncse: patient })).toBeNull();
    expect(ncseInlinePrompt('guided', { scenarioVersion: '0.1.1', ncse: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(ncseInlinePrompt('guided', { scenarioVersion: '0.1.0', ncse: snapshot(engine) })).toBeNull();
  });
});
