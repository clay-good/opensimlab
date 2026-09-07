/**
 * The anaesthesia module's first observed-state worked example, driven through
 * the real engine.
 *
 * Every other example in the catalog reads a lesson's assessment sidecar, where
 * a step is a tick that is either null or not. This one reads the patient, so
 * the thing worth asserting is that the beats actually advance on physiology:
 * the flowmeter, the end-tidal fraction, the engine's own preoxygenation
 * counter, the moment he stops breathing, and the airway.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { RAPID_DESATURATION as SCENARIO } from '@anesthesia/scenarios/rapid-desaturation';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { RAPID_DESATURATION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/rapid-desaturation-fixtures';
import {
  RAPID_DESATURATION_DEMONSTRATION_VERSION, rapidDesaturationDemonstrationStep,
  supportsRapidDesaturationDemonstration, type RapidDesaturationProgress,
} from '@anesthesia/demo/rapid-desaturation-demonstration';

const create = () => new AnesthesiaEngine({
  scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US',
});

/** The same assembly the cockpit does, from the same four sources. */
function progress(engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>): RapidDesaturationProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    preoxygenationSeconds: equipment.preoxygenationSeconds,
    respiratoryRateBpm: state.respiratoryRateBpm ?? 0,
    remifentanilPlasma: frame.concentrations.find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    intubated: equipment.airway.intubated,
    ventilating: equipment.ventilator.delivering,
    airwayAttempts: equipment.airway.attempts,
    airwayAttemptInProgress: equipment.airway.attemptInProgress,
  };
}

function runExample(limit = 12_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const saturations: number[] = [];
  let frame = engine.step();
  for (let tick = 1; tick <= limit; tick += 1) {
    const step = rapidDesaturationDemonstrationStep(progress(engine, frame));
    if (step.finished) {
      return { beats, narrations, saturations, closing: step.narration, engine, frame };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    saturations.push((frame.state as Readonly<Record<string, number>>).spo2Percent ?? 100);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Anaesthesia Example Reads The Patient', () => {
  const { beats, narrations, saturations, closing, engine } = runExample();

  it('binds to this exact scenario version and no other', () => {
    expect(RAPID_DESATURATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRapidDesaturationDemonstration(SCENARIO)).toBe(true);
    expect(supportsRapidDesaturationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The lesson this one is the counterfactual for must not run this example.
    expect(supportsRapidDesaturationDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a secured airway', () => {
    // The airway beats are deterministic at this seed and stochastic in
    // principle: the first video attempt does not place the tube and the second
    // does, so the sequence carries a retry. That is the point of asserting the
    // whole list rather than a prefix.
    expect(beats).toEqual([
      'oxygen', 'filling', 'waiting', 'opioid', 'hypnotic', 'apnoea',
      'airway', 'attempt-1', 'airway-again-1', 'attempt-2',
    ]);
    expect(engine.equipment().airway.intubated).toBe(true);
    // Nothing in the example turns the ventilator on: the engine starts
    // delivering when the tube is placed, so a beat that dispatched it would
    // never be reached and its narration would promise an unseen action.
    expect(engine.equipment().ventilator.delivering).toBe(true);
    expect(beats).not.toContain('ventilate');
    expect(engine.equipment().airway.attempts).toBe(2);
  });

  it('can try again, because the airway is not scripted to succeed', () => {
    // An example that could only show a first attempt working would be scripted
    // after all, which is the one thing its own narration says it is not.
    const retry = narrations[beats.indexOf('airway-again-1')]!;
    expect(retry).toContain('did not place the tube');
    expect(retry).toContain('something changes between attempts');
    // And it dispatches nothing while an attempt is consuming simulated time,
    // because a second one during it would be refused.
    const during = narrations[beats.indexOf('attempt-1')]!;
    expect(during).toContain('not being ventilated during it');
  });

  it('waits the three minutes rather than fast-forwarding past them', () => {
    // The two waiting beats are the ones a learner is tempted to skip, so an
    // example that skipped them would teach what this patient exists to punish.
    expect(engine.equipment().preoxygenationSeconds).toBeGreaterThanOrEqual(180);
    for (const id of ['filling', 'waiting', 'apnoea']) {
      const step = rapidDesaturationDemonstrationStep(undefined);
      expect(step.id).toBe('preparing');
      expect(beats).toContain(id);
    }
  });

  it('never lets the saturation fall, which is the whole margin', () => {
    expect(Math.min(...saturations)).toBeGreaterThan(92);
  });

  it('gives the lean-body-mass dose and says it is a choice', () => {
    const hypnotic = narrations[beats.indexOf('hypnotic')]!;
    expect(hypnotic).toContain('Not the 2 mg/kg preset');
    expect(hypnotic).toContain('the model does not tell you it is the right one');
  });

  it('reaches for video first, and says why it was decided before induction', () => {
    const airway = narrations[beats.indexOf('airway')]!;
    expect(airway).toContain('before anything was given');
    expect(airway).toContain('not scripted to succeed');
  });

  it('closes on the margin rather than on a result', () => {
    expect(closing).toContain('That is the entire margin');
    expect(closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...narrations, closing].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'the operation went',
      'no harm came', 'he survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = rapidDesaturationDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
