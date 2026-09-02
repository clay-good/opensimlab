/**
 * The worked example and observed-state tutor for a diagnosis that would be
 * easy and unfair to make.
 *
 * Eight years of opioids and a sleep study showing hypoventilation is a story
 * that writes itself. Exposure is a contributor here, not a proven cause.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { CHRONIC_OPIOID_RELATED_HYPOVENTILATION_REASSESSMENT as SCENARIO } from '../../src/modules/respiratory-medicine/scenarios/chronic-opioid-related-hypoventilation-reassessment';
import { CHRONIC_OPIOID_HYPOVENTILATION_FIXTURES as FIXTURES } from '../../src/modules/respiratory-medicine/chronic-opioid-related-hypoventilation-reassessment-fixtures';
import {
  CHRONIC_OPIOID_HYPOVENTILATION_DEMONSTRATION_VERSION, chronicOpioidHypoventilationDemonstrationStep,
  supportsChronicOpioidHypoventilationDemonstration,
} from '../../src/modules/respiratory-medicine/demo/chronic-opioid-related-hypoventilation-reassessment-demonstration';
import { chronicOpioidHypoventilationInlinePrompt } from '../../src/modules/respiratory-medicine/tutor/chronic-opioid-related-hypoventilation-reassessment-guidance';
import type { ChronicOpioidHypoventilationAction } from '../../src/modules/respiratory-medicine/chronic-opioid-related-hypoventilation-reassessment';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.chronicOpioidHypoventilationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ChronicOpioidHypoventilationAction) => {
  engine.apply({ tick, type: 'chronic-opioid-related-hypoventilation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = chronicOpioidHypoventilationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'chronic-opioid-related-hypoventilation-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses The Obvious Cause', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(CHRONIC_OPIOID_HYPOVENTILATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsChronicOpioidHypoventilationDemonstration(SCENARIO)).toBe(true);
    expect(supportsChronicOpioidHypoventilationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsChronicOpioidHypoventilationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all five recorded steps in the enforced order', () => {
    expect(beats).toEqual(['trajectory', 'evidence', 'alternatives', 'plan', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.evidenceAtTick!);
    expect(patient.evidenceAtTick).toBeLessThan(patient.alternativesAtTick!);
    expect(patient.alternativesAtTick).toBeLessThan(patient.coordinatedPlanAtTick!);
    expect(patient.coordinatedPlanAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('reads this as chronic rather than an overdose', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('not an overdose and it is not an emergency');
    expect(trajectory).toContain('while everyone watched the dose stay the same');
    expect(patient.chronicOpioidExposureAuthored).toBe(true);
    expect(patient.acuteOpioidOverdoseAuthored).toBe(false);
  });

  it('puts the weight on the sleep study rather than the clinic numbers', () => {
    const evidence = narrations[beats.indexOf('evidence')]!;
    expect(evidence).toContain('the eight hours nobody was watching');
    expect(evidence).toContain('a description rather than a diagnosis');
    expect(patient.sleepRelatedHypoventilationPatternAuthored).toBe(true);
  });

  it('keeps the exposure a contributor and names what the negatives miss', () => {
    const alternatives = narrations[beats.indexOf('alternatives')]!;
    expect(alternatives).toContain('a contributor, not a proven cause');
    expect(alternatives).toContain('easy to overlook because it is not the opioid');
    expect(patient.opioidCausalityProven).toBe(false);
  });

  it('names both failure modes and refuses to change her analgesia', () => {
    const plan = narrations[beats.indexOf('plan')]!;
    expect(plan).toContain('do not let this clinic change her analgesia');
    expect(plan).toContain('Both failure modes here are real');
    expect(plan).toContain('in a single visit on the strength of a pattern that has not been attributed');
  });

  it('ends on a pattern described rather than attributed', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the ones that are not the opioid');
    expect(handoff).toContain('the name against each part of it');
    expect(narration).toContain('her analgesia unchanged');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('delivers nothing, selects nothing, and predicts nothing', () => {
    expect(patient.examinationPerformedByLearner).toBe(false);
    expect(patient.bloodGasAcquiredByLearner).toBe(false);
    expect(patient.sleepStudyAcquiredByLearner).toBe(false);
    expect(patient.sleepStudyInterpretedByLearner).toBe(false);
    expect(patient.drugOrDoseSelected).toBe(false);
    expect(patient.taperSelected).toBe(false);
    expect(patient.opioidChangedByLearner).toBe(false);
    expect(patient.naloxoneSelectedByLearner).toBe(false);
    expect(patient.naloxoneDeliveredByLearner).toBe(false);
    expect(patient.oxygenDeliveredByLearner).toBe(false);
    expect(patient.supportDeviceSelectedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    expect(patient.diagnosisDetermined).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the opioid is causing', 'she has opioid-induced', 'this is central sleep apnoea', 'her breathing is safe']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    for (const forbidden of ['taper her', 'halve the dose', 'start cpap', 'give naloxone']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Refuses The Obvious Cause', () => {
  it('opens on eight years against six months', () => {
    const engine = create(); engine.step();
    const prompt = chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) })!;
    expect(prompt.id).toBe('opioid-hypo-trajectory');
    expect(prompt.suggestion).toContain('eight years of stable therapy against six months of new symptoms');
    expect(prompt.because).toContain('while everyone watched the dose stay the same');
  });

  it('goes to the sleep study next', () => {
    const engine = create();
    advance(engine, 0, FIXTURES.expert[0][1]);
    const prompt = chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) })!;
    expect(prompt.id).toBe('opioid-hypo-evidence');
    expect(prompt.suggestion).toContain('what the daytime numbers cannot');
    expect(prompt.because).toContain('the eight hours nobody was watching');
  });

  it('keeps the opioid a contributor rather than the cause', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    const prompt = chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) })!;
    expect(prompt.id).toBe('opioid-hypo-alternatives');
    expect(prompt.suggestion).toContain('Refuse the obvious cause');
    expect(prompt.because).toContain('a contributor, not a proven cause');
  });

  it('refuses to let the clinic change her analgesia', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    const prompt = chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) })!;
    expect(prompt.id).toBe('opioid-hypo-plan');
    expect(prompt.suggestion).toContain('do not let this clinic change her analgesia');
    expect(prompt.because).toContain('Both failure modes here are real');
  });

  it('never proves causality, names a syndrome, or changes a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      for (const forbidden of ['the opioid is causing', 'she has opioid-induced', 'taper her', 'give naloxone']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(chronicOpioidHypoventilationInlinePrompt('unassisted', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: patient })).toBeNull();
    expect(chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.1', chronicOpioidHypoventilation: patient })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(chronicOpioidHypoventilationInlinePrompt('guided', { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(chronicOpioidHypoventilationInlinePrompt(level, { scenarioVersion: '0.1.0', chronicOpioidHypoventilation: snapshot(engine) })).not.toBeNull();
    }
  });
});
