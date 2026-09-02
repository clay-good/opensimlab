/**
 * The worked example and observed-state tutor for the quietest emergency in
 * the module.
 *
 * Nothing here looks like a crisis. She is drowsy but rousable, her pressure is
 * normal, and she is breathing nine times a minute without any appearance of
 * struggling — which is what magnesium does, and why this is missed.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MAGNESIUM_SULFATE_TOXICITY_RECOGNITION as SCENARIO } from '../../src/modules/obstetrics/scenarios/magnesium-sulfate-toxicity-recognition';
import { MAGNESIUM_TOXICITY_FIXTURES as FIXTURES } from '../../src/modules/obstetrics/magnesium-sulfate-toxicity-recognition-fixtures';
import {
  MAGNESIUM_TOXICITY_DEMONSTRATION_VERSION, magnesiumToxicityDemonstrationStep,
  supportsMagnesiumToxicityDemonstration,
} from '../../src/modules/obstetrics/demo/magnesium-sulfate-toxicity-recognition-demonstration';
import { magnesiumToxicityInlinePrompt } from '../../src/modules/obstetrics/tutor/magnesium-sulfate-toxicity-recognition-guidance';
import type { MagnesiumToxicityAction } from '../../src/modules/obstetrics/magnesium-sulfate-toxicity-recognition';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.obstetricsMagnesiumToxicityAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MagnesiumToxicityAction) => {
  engine.apply({ tick, type: 'magnesium-sulfate-toxicity-recognition-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = magnesiumToxicityDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'magnesium-sulfate-toxicity-recognition-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls For An Airway First', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MAGNESIUM_TOXICITY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMagnesiumToxicityDemonstration(SCENARIO)).toBe(true);
    expect(supportsMagnesiumToxicityDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMagnesiumToxicityDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through every recorded step in the enforced order', () => {
    expect(beats).toEqual(['support', 'context', 'uncertainty', 'readiness', 'reassess', 'handoff']);
    expect(patient.supportAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.uncertaintyAtTick!);
    expect(patient.uncertaintyAtTick).toBeLessThan(patient.readinessAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(patient.reassessmentAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('gets airway help in before working anything out, and says why', () => {
    expect(beats[0]).toBe('support');
    const support = narrations[0]!;
    expect(support).toContain('before you work anything out');
    expect(support).toContain('respiratory failure arriving quietly');
    expect(support).toContain('does not look dramatic until it is very late');
  });

  it('reads the exposure and the kidneys as one mechanism', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('cleared almost entirely by the kidneys');
    expect(context).toContain('The dose never changed; her ability to remove it did.');
  });

  it('quotes all three units and treats the level as a document rather than the assessment', () => {
    const uncertainty = narrations[beats.indexOf('uncertainty')]!;
    expect(uncertainty).toContain('11.8 mg/dL is the same as 4.85 mmol/L and 9.7 mEq/L');
    expect(uncertainty).toContain('a documented source of error');
    expect(uncertainty).toContain('describes a moment that has already passed');
    expect(uncertainty).toContain('The reflexes and the breathing are the assessment.');
  });

  it('names stopping the infusion as the beginning rather than the end', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('removes the cause but not the magnesium already in her');
    expect(readiness).toContain('rather than intermittent checks');
    expect(readiness).toContain('the beginning of this rather than the end of it');
  });

  it('ends on a partial response that is not a reversal', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('A partial response is not a reversal');
    expect(handoff).toContain('the seizure prophylaxis question it raises');
    expect(narration).toContain('better and still full of magnesium');
    expect(narration).toContain('This ends the example, not the toxicity.');
  });

  it('proves nothing and excludes nothing', () => {
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.completeReversalProven).toBe(false);
    expect(patient.magnesiumClearanceProven).toBe(false);
    expect(patient.renalRecoveryProven).toBe(false);
    expect(patient.newbornSafetyProven).toBe(false);
    expect(patient.safetyDispositionDetermined).toBe(false);
    expect(patient.maternalOutcomePredicted).toBe(false);
    expect(patient.newbornOutcomePredicted).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    expect(patient.authoredMagnesiumToxicityPattern).toBe(true);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the magnesium has cleared', 'she has recovered', 'this is only magnesium', 'her kidneys are fine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('touches nothing, changes no infusion, and gives no antidote', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.monitoringInterpretedByLearner).toBe(false);
    expect(patient.laboratoryInterpretedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
    expect(patient.infusionChangedByLearner).toBe(false);
    expect(patient.airwayManagedByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.ventilationDeliveredByLearner).toBe(false);
    expect(patient.antidoteSelectedOrDeliveredByLearner).toBe(false);
    expect(patient.drugDoseConcentrationRouteRateTargetSelectedByLearner).toBe(false);
    expect(patient.seizureCarePerformedByLearner).toBe(false);
    expect(patient.newbornAssessedByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give calcium gluconate', 'stop the infusion yourself', 'intubate her', 'restart the magnesium']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Calls For An Airway First', () => {
  it('opens by calling for airway-capable help', () => {
    const engine = create(); engine.step();
    const prompt = magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: snapshot(engine) })!;
    expect(prompt.id).toBe('magnesium-support');
    expect(prompt.suggestion).toContain('before you work anything out');
    expect(prompt.because).toContain('respiratory failure arriving quietly');
  });

  it('couples the exposure to the kidneys once the response is running', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: snapshot(engine) })!;
    expect(prompt.id).toBe('magnesium-context');
    expect(prompt.suggestion).toContain('that is the whole mechanism');
    expect(prompt.because).toContain('The dose never changed; her ability to remove it did.');
  });

  it('quotes the units and keeps the alternatives alive', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: snapshot(engine) })!;
    expect(prompt.id).toBe('magnesium-uncertainty');
    expect(prompt.suggestion).toContain('treat the number as a supporting document');
    expect(prompt.because).toContain('11.8 mg/dL is the same as 4.85 mmol/L and 9.7 mEq/L');
  });

  it('names the source-stop as a beginning', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: snapshot(engine) })!;
    expect(prompt.id).toBe('magnesium-readiness');
    expect(prompt.because).toContain('removes the cause but not the magnesium already in her');
    expect(prompt.because).toContain('the beginning of this rather than the end of it');
  });

  it('never claims clearance, recovery, or a chosen antidote', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['the magnesium has cleared', 'she has recovered', 'give calcium gluconate', 'her kidneys are fine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('withholds only the authored-interval beat when coached', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    const patient = snapshot(engine);
    expect(magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: patient })!.id).toBe('magnesium-reassess');
    expect(magnesiumToxicityInlinePrompt('coached', { scenarioVersion: '0.1.0', magnesiumToxicity: patient })).toBeNull();
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(magnesiumToxicityInlinePrompt('unassisted', { scenarioVersion: '0.1.0', magnesiumToxicity: patient })).toBeNull();
    expect(magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.1', magnesiumToxicity: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(magnesiumToxicityInlinePrompt('guided', { scenarioVersion: '0.1.0', magnesiumToxicity: snapshot(engine) })).toBeNull();
  });
});
