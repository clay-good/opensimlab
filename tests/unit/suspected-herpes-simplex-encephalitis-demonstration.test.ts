/**
 * The worked example and observed-state tutor for a diagnosis you treat before
 * you have it.
 *
 * An early CSF HSV PCR comes back negative in a man whose MRI and EEG both
 * point squarely at it. That negative is exactly why the antiviral could not
 * have waited, so both the tutor and the example start the pathway ahead of
 * every test and end on repeat testing rather than reassurance.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SUSPECTED_HERPES_SIMPLEX_ENCEPHALITIS as SCENARIO } from '../../src/modules/neurology/scenarios/suspected-herpes-simplex-encephalitis';
import { ENCEPHALITIS_FIXTURES as FIXTURES } from '../../src/modules/neurology/suspected-herpes-simplex-encephalitis-fixtures';
import {
  ENCEPHALITIS_DEMONSTRATION_VERSION, encephalitisDemonstrationStep,
  supportsEncephalitisDemonstration,
} from '../../src/modules/neurology/demo/suspected-herpes-simplex-encephalitis-demonstration';
import { encephalitisInlinePrompt } from '../../src/modules/neurology/tutor/suspected-herpes-simplex-encephalitis-guidance';
import type { EncephalitisAction } from '../../src/modules/neurology/suspected-herpes-simplex-encephalitis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyEncephalitisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: EncephalitisAction) => {
  engine.apply({ tick, type: 'suspected-herpes-simplex-encephalitis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = encephalitisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'suspected-herpes-simplex-encephalitis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats Before It Looks', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(ENCEPHALITIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEncephalitisDemonstration(SCENARIO)).toBe(true);
    expect(supportsEncephalitisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsEncephalitisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'ownership', 'treatment', 'diagnostics', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.treatmentAtTick!);
    expect(patient.treatmentAtTick).toBeLessThan(patient.diagnosticsAtTick!);
    expect(patient.diagnosticsAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('puts the fever, the new mind and the seizure in one syndrome', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('is an encephalitic syndrome');
    expect(opening).toContain('together they are this one');
  });

  it('brings airway and seizure ownership in on a seizure that already happened', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('one focal seizure that stopped without treatment');
    expect(ownership).toContain('rather than when something changes');
    expect(beats.indexOf('ownership')).toBeLessThan(beats.indexOf('treatment'));
  });

  it('starts the antiviral ahead of every test, and says why', () => {
    const treatment = narrations[beats.indexOf('treatment')]!;
    expect(treatment).toContain('ahead of the MRI, the EEG, the CSF and the PCR');
    expect(treatment).toContain('normal, pending or negative in someone who has this');
    expect(treatment).toContain('does not queue behind a result');
    expect(beats.indexOf('treatment')).toBeLessThan(beats.indexOf('diagnostics'));
    expect(patient.qualifiedEarlyAntiviralPathwayActive).toBe(true);
  });

  it('holds the CSF loosely and keeps nonconvulsive seizure live', () => {
    const diagnostics = narrations[beats.indexOf('diagnostics')]!;
    expect(diagnostics).toContain('central inflammation, not a pathogen');
    expect(diagnostics).toContain('would look like the drowsiness');
    expect(patient.qualifiedDiagnosticsReviewed).toBe(true);
    expect(patient.qualifiedOwnershipActive).toBe(true);
  });

  it('reads the early negative PCR as excluding nothing', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('An early negative does not exclude this');
    expect(handoff).toContain('eighteen hours after the neurobehavioral symptoms began');
    expect(narration).toContain('a negative test that settles nothing');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.pathogenIdentified).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableNeurologicStabilityProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.earlyNegativeHsvPcrAuthored).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the pcr rules out hsv', 'this is not herpes', 'stop the antiviral', 'the mri confirms hsv']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('interprets nothing and selects no regimen or dose anywhere', () => {
    expect(patient.csfAcquiredByLearner).toBe(false);
    expect(patient.imagingInterpretedByLearner).toBe(false);
    expect(patient.eegInterpretedByLearner).toBe(false);
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.patientHistoryTakenByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give aciclovir 10 mg/kg', 'read the mri yourself', 'load with levetiracetam', 'order the repeat pcr yourself']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Puts Treatment In Front', () => {
  it('opens by naming the syndrome from three parts', () => {
    const engine = create(); engine.step();
    const prompt = encephalitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', encephalitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('encephalitis-trajectory');
    expect(prompt.because).toContain('is an encephalitic syndrome');
  });

  it('brings seizure and airway ownership in from the start', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = encephalitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', encephalitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('encephalitis-ownership');
    expect(prompt.suggestion).toContain('airway-capable owners in immediately');
    expect(prompt.because).toContain('one focal seizure that stopped without treatment');
    expect(prompt.because).toContain('rather than when something changes');
  });

  it('starts the antiviral ahead of every test', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = encephalitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', encephalitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('encephalitis-treatment');
    expect(prompt.because).toContain('normal, pending or negative in someone who has this');
    expect(prompt.because).toContain('does not queue behind a result');
  });

  it('holds the CSF loosely and keeps nonconvulsive seizure live', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = encephalitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', encephalitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('encephalitis-diagnostics');
    expect(prompt.because).toContain('central inflammation, not a pathogen');
    expect(prompt.because).toContain('would look like the drowsiness');
  });

  it('never lets the PCR exclude it, names a pathogen, or picks a regimen', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = encephalitisInlinePrompt('guided', {
        scenarioVersion: '0.1.0', encephalitis: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the pcr rules out hsv', 'this is not herpes', 'stop the antiviral', 'give aciclovir 10 mg/kg']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(encephalitisInlinePrompt('guided', { scenarioVersion: '0.1.0', encephalitis: patient })!.id)
      .toBe('encephalitis-later');
    expect(encephalitisInlinePrompt('coached', { scenarioVersion: '0.1.0', encephalitis: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(encephalitisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', encephalitis: patient })).toBeNull();
    expect(encephalitisInlinePrompt('guided', { scenarioVersion: '0.1.1', encephalitis: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(encephalitisInlinePrompt('guided', { scenarioVersion: '0.1.0', encephalitis: snapshot(engine) })).toBeNull();
  });
});
