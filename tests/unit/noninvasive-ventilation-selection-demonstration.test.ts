/**
 * The worked example and observed-state tutor for a choice between three
 * plausible devices.
 *
 * CPAP and high-flow nasal oxygen are both good tools that are both wrong
 * here. The tutor answers whichever one the learner just reached for; the
 * worked example never reaches for either.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NONINVASIVE_VENTILATION_SELECTION as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/noninvasive-ventilation-selection';
import { NIV_SELECTION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/noninvasive-ventilation-selection-fixtures';
import {
  NIV_SELECTION_DEMONSTRATION_VERSION, noninvasiveVentilationSelectionDemonstrationStep,
  supportsNoninvasiveVentilationSelectionDemonstration,
} from '../../src/modules/respiratory-medicine/demo/noninvasive-ventilation-selection-demonstration';
import { noninvasiveVentilationSelectionInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/noninvasive-ventilation-selection-guidance';
import type { NoninvasiveVentilationSelectionAction } from '../../src/modules/respiratory-medicine/noninvasive-ventilation-selection';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.noninvasiveVentilationSelectionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: NoninvasiveVentilationSelectionAction) => {
  engine.apply({ tick, type: 'noninvasive-ventilation-selection-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = noninvasiveVentilationSelectionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'noninvasive-ventilation-selection-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Chooses From Physiology', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NIV_SELECTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNoninvasiveVentilationSelectionDemonstration(SCENARIO)).toBe(true);
    expect(supportsNoninvasiveVentilationSelectionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsNoninvasiveVentilationSelectionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'suitability', 'selection', 'response', 'guards', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.suitabilityAtTick!);
    expect(patient.suitabilityAtTick).toBeLessThan(patient.selectionAtTick!);
    // Two time gates: the first-hour review and the handoff each need a later tick.
    expect(patient.selectionAtTick).toBeLessThan(patient.responseAtTick!);
    expect(patient.responseAtTick).toBeLessThan(patient.failureGuardsAtTick!);
    expect(patient.failureGuardsAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('never reaches for either wrong support goal', () => {
    expect(patient.lastUnsupportedChoice).toBeNull();
    expect(patient.bilevelNivSelectedByLearner).toBe(true);
  });

  it('asks what an hour of correct treatment has already failed to fix', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('None of that was yours to give, and all of it was right');
    expect(trajectory).toContain('a different question from the one she arrived with');
    expect(patient.standardInitialTherapyAuthored).toBe(true);
    expect(patient.acuteHypercapnicAcidosisAuthored).toBe(true);
  });

  it('refuses to read the suitability report as a checklist', () => {
    const suitability = narrations[beats.indexOf('suitability')]!;
    expect(suitability).toContain('not as permanent exclusions, and not as a checklist to tick');
    expect(patient.patientExaminedByLearner).toBe(false);
  });

  it('says plainly why the two familiar devices are not it', () => {
    const selection = narrations[beats.indexOf('selection')]!;
    expect(selection).toContain('assists her breathing, not just her oxygen');
    expect(selection).toContain('neither provides the ventilatory assistance this pattern needs');
    expect(selection).toContain('none of those are yours to set');
  });

  it('will not let a trial run without a failure guard', () => {
    const guards = narrations[beats.indexOf('guards')]!;
    expect(guards).toContain('just an assumption with a mask on it');
    expect(guards).toContain('survive the part where things go well for an hour');
  });

  it('ends on a trial that is working so far and is not finished', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('why the alternatives were not it');
    expect(narration).toContain('active before anyone put a mask on her');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, sets nothing, and predicts nothing', () => {
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.bloodGasInterpretedByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.oxygenSelectedByLearner).toBe(false);
    expect(patient.interfaceSelectedByLearner).toBe(false);
    expect(patient.pressureSelectedByLearner).toBe(false);
    expect(patient.backupRateSelectedByLearner).toBe(false);
    expect(patient.deviceOperatedByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.drugSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.intubationPerformedByLearner).toBe(false);
    expect(patient.durableNivSuccessProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['set the ipap', 'set the epap', 'start at 12', 'intubate her', 'she will improve', 'the trial will succeed', 'not for intubation']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Answers The Choice That Was Made', () => {
  it('opens on what an hour of correct treatment has not fixed', () => {
    const engine = create(); engine.step();
    const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('niv-trajectory');
    expect(prompt.suggestion).toContain('has already failed to fix');
    expect(prompt.because).toContain('all of it was right');
  });

  it('asks for the support goal once suitability is held', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('niv-selection');
    expect(prompt.suggestion).toContain('not just her oxygen');
  });

  it('answers CPAP alone specifically', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'select-cpap-alone');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('cpap');
    const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('niv-cpap-refused');
    expect(prompt.suggestion).toContain('It does not do the breathing');
    expect(prompt.because).toContain('cardiogenic pulmonary edema');
    expect(prompt.because).toContain('nothing about her changed');
  });

  it('answers high-flow nasal oxygen specifically', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'select-high-flow-nasal-oxygen-alone');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBe('high-flow');
    const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('niv-high-flow-refused');
    expect(prompt.suggestion).toContain('not her ventilation');
    expect(prompt.because).toContain('a saturation that looks better while the acidosis carries on');
  });

  it('stops answering the wrong choice once the right one is made', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'select-cpap-alone');
    advance(engine, 3, 'select-bilevel-noninvasive-ventilation');
    expect(snapshot(engine)!.lastUnsupportedChoice).toBeNull();
    const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })!;
    expect(prompt.id).toBe('niv-response');
  });

  it('never sets a pressure, an interface, or a prognosis', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['set the ipap', 'set the epap', 'intubate her', 'she will improve', 'not for intubation']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(noninvasiveVentilationSelectionInlinePrompt('unassisted', { scenarioVersion: '0.1.0', patient })).toBeNull();
    expect(noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(noninvasiveVentilationSelectionInlinePrompt('guided', { scenarioVersion: '0.1.0', patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(noninvasiveVentilationSelectionInlinePrompt(level, { scenarioVersion: '0.1.0', patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
