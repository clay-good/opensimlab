/**
 * The worked example and observed-state tutor for an hour that gets spent on
 * the wrong things.
 *
 * She is alert, oriented and nonfocal, which is precisely the state in which a
 * lumbar puncture does not wait for routine imaging. Both the tutor and the
 * example get the owners and the precautions moving before the diagnostic
 * question, and put the empiric pathway on a track no test can hold up.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_BACTERIAL_MENINGITIS_FIRST_HOUR as SCENARIO } from '../../src/modules/neurology/scenarios/acute-bacterial-meningitis-first-hour';
import { MENINGITIS_FIXTURES as FIXTURES } from '../../src/modules/neurology/acute-bacterial-meningitis-first-hour-fixtures';
import {
  MENINGITIS_DEMONSTRATION_VERSION, meningitisDemonstrationStep,
  supportsMeningitisDemonstration,
} from '../../src/modules/neurology/demo/acute-bacterial-meningitis-first-hour-demonstration';
import { meningitisInlinePrompt } from '../../src/modules/neurology/tutor/acute-bacterial-meningitis-first-hour-guidance';
import type { MeningitisAction } from '../../src/modules/neurology/acute-bacterial-meningitis-first-hour';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.neurologyMeningitisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MeningitisAction) => {
  engine.apply({ tick, type: 'acute-bacterial-meningitis-first-hour-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = meningitisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-bacterial-meningitis-first-hour-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Runs The Clocks In Parallel', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MENINGITIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMeningitisDemonstration(SCENARIO)).toBe(true);
    expect(supportsMeningitisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMeningitisDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'ownership', 'diagnostics', 'treatment', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.ownershipAtTick!);
    expect(patient.ownershipAtTick).toBeLessThan(patient.diagnosticsAtTick!);
    expect(patient.diagnosticsAtTick).toBeLessThan(patient.treatmentAtTick!);
    expect(patient.treatmentAtTick).toBeLessThan(patient.laterAtTick!);
    expect(patient.laterAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('says how fast this arrived alongside what remains intact', () => {
    const opening = narrations[beats.indexOf('trajectory')]!;
    expect(opening).toContain('how little time there is');
    expect(opening).toContain('simple rather than complicated');
  });

  it('turns this into a service before turning it into a puzzle', () => {
    const ownership = narrations[beats.indexOf('ownership')]!;
    expect(ownership).toContain('the slowest possible version of this hour');
    expect(ownership).toContain('stop being retrofittable');
    expect(beats.indexOf('ownership')).toBeLessThan(beats.indexOf('diagnostics'));
  });

  it('ties the imaging decision to the list she is not on', () => {
    const diagnostics = narrations[beats.indexOf('diagnostics')]!;
    expect(diagnostics).toContain('notice she is not on it');
    expect(diagnostics).toContain('rather than a permanent clearance');
    expect(diagnostics).toContain('are consistent with bacterial meningitis and exclude nothing');
    expect(patient.qualifiedLpWithoutRoutineImagingBoundaryReviewed).toBe(true);
  });

  it('puts the empiric pathway on a track no test can hold up', () => {
    const treatment = narrations[beats.indexOf('treatment')]!;
    expect(treatment).toContain('no test can hold up');
    expect(treatment).toContain('rather than one behind the other');
    expect(patient.qualifiedEarlyEmpiricPathwayActive).toBe(true);
    expect(patient.qualifiedTimeCriticalOwnershipActive).toBe(true);
  });

  it('reads a negative Gram stain as narrowing nothing', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('A negative Gram stain narrows nothing');
    expect(handoff).toContain('the shape the hour was supposed to have');
    expect(narration).toContain('still without an organism named');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.pathogenIdentified).toBe(false);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableNeurologicStabilityProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.prognosisPredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the organism is pneumococcus', 'she needs a ct before the tap', 'the gram stain rules it out', 'the crp confirms it']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('taps nobody and selects no regimen, dose, route, or isolation kit anywhere', () => {
    expect(patient.lumbarPuncturePerformedByLearner).toBe(false);
    expect(patient.csfInterpretedByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.bloodTestAcquiredByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.doseSelectedByLearner).toBe(false);
    expect(patient.routeSelectedByLearner).toBe(false);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.isolationEquipmentSelectedByLearner).toBe(false);
    expect(patient.medicationDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give ceftriaxone 2 g', 'start dexamethasone first', 'do the lumbar puncture yourself', 'order a ct head']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Protects The Hour', () => {
  it('opens on the clock and on what is intact', () => {
    const engine = create(); engine.step();
    const prompt = meningitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', meningitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('meningitis-trajectory');
    expect(prompt.because).toContain('how little time there is');
  });

  it('calls the service before the puzzle', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = meningitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', meningitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('meningitis-ownership');
    expect(prompt.suggestion).toContain('before you turn it into a puzzle');
    expect(prompt.because).toContain('the slowest possible version of this hour');
    expect(prompt.because).toContain('stop being retrofittable');
  });

  it('checks the imaging list and notices she is not on it', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = meningitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', meningitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('meningitis-diagnostics');
    expect(prompt.because).toContain('rather than a permanent clearance');
    expect(prompt.because).toContain('exclude nothing');
  });

  it('refuses to let any test delay the pathway', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = meningitisInlinePrompt('guided', {
      scenarioVersion: '0.1.0', meningitis: snapshot(engine),
    })!;
    expect(prompt.id).toBe('meningitis-treatment');
    expect(prompt.because).toContain('is allowed to delay it');
    expect(prompt.because).toContain('rather than one behind the other');
  });

  it('never names an organism, orders the scan, or picks a regimen', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = meningitisInlinePrompt('guided', {
        scenarioVersion: '0.1.0', meningitis: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the organism is pneumococcus', 'she needs a ct before the tap', 'the gram stain rules it out', 'give ceftriaxone 2 g']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(meningitisInlinePrompt('guided', { scenarioVersion: '0.1.0', meningitis: patient })!.id)
      .toBe('meningitis-later');
    expect(meningitisInlinePrompt('coached', { scenarioVersion: '0.1.0', meningitis: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(meningitisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', meningitis: patient })).toBeNull();
    expect(meningitisInlinePrompt('guided', { scenarioVersion: '0.1.1', meningitis: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(meningitisInlinePrompt('guided', { scenarioVersion: '0.1.0', meningitis: snapshot(engine) })).toBeNull();
  });
});
