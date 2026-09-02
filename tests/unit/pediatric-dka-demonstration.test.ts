/**
 * The worked example and observed-state tutor for a child whose numbers are
 * all improving.
 *
 * The thing to get right is that an absence never becomes an exclusion: she
 * has no headache, no bradycardia and no focal sign now, and the minute-60
 * panel improves on every axis, and none of that retires the risk.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-diabetic-ketoacidosis';
import { PEDIATRIC_DKA_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-dka-fixtures';
import {
  PEDIATRIC_DKA_DEMONSTRATION_VERSION, pediatricDkaDemonstrationStep,
  supportsPediatricDkaDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-dka-demonstration';
import { pediatricDkaInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-dka-guidance';
import type { PediatricDkaAction } from '../../src/modules/pediatrics/pediatric-diabetic-ketoacidosis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricDiabeticKetoacidosisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricDkaAction) => {
  engine.apply({ tick, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricDkaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Retires the Risk', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_DKA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricDkaDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricDkaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricDkaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps, taking the pair care-first', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'care', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.careAtTick!);
    // One valid order of the unordered pair, not the required one.
    expect(patient.careAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('keeps the deep breathing and the abdominal pain inside one story', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('They are one story');
    expect(trajectory).toContain('they are not a second illness');
    expect(patient.fixedBiochemicalPatternAuthored).toBe(true);
    expect(patient.testInterpretedByLearner).toBe(false);
  });

  it('needs three findings, and says what the calm does not mean', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('Three findings make this, not one');
    expect(recognition).toContain('a description of this minute and not an exclusion');
    expect(recognition).toContain('rather than a footnote');
    expect(patient.pediatricDkaAuthored).toBe(true);
    expect(patient.shockAuthored).toBe(false);
    expect(patient.cerebralInjuryAuthored).toBe(false);
    expect(patient.cerebralInjuryRiskActive).toBe(true);
    expect(patient.diagnosisMadeByLearner).toBe(false);
  });

  it('hands the protocol to the people who own it and teaches none of it as the answer', () => {
    const care = narrations[beats.indexOf('care')]!;
    expect(care).toContain('none of them is universal');
    expect(care).toContain('this lab teaches none of them as the answer');
    expect(patient.qualifiedCareOwnershipActive).toBe(true);
    expect(patient.insulinSelectedByLearner).toBe(false);
    expect(patient.fluidRateSelectedByLearner).toBe(false);
  });

  it('says what the repetition is for', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('This is the step the lesson exists for');
    expect(safety).toContain('no single sign excludes it');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
    expect(patient.neurologicExamPerformedByLearner).toBe(false);
  });

  it('treats uniformly improving numbers as the moment to be most careful', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('that is the moment to be most careful');
    expect(later).toContain('The surveillance does not relax because the numbers did');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.biochemicalResolutionProven).toBe(false);
    expect(patient.cerebralInjuryExcluded).toBe(false);
  });

  it('ends with the next observation due rather than with a conclusion', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('stated as an absence rather than an exclusion');
    expect(handoff).toContain('this may be a new diagnosis for the family');
    expect(narration).toContain('nothing about her brain was settled by that');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('calculates nothing, treats nothing, and predicts nothing', () => {
    expect(patient.dehydrationCalculatedByLearner).toBe(false);
    expect(patient.sodiumCalculatedByLearner).toBe(false);
    expect(patient.osmolalityCalculatedByLearner).toBe(false);
    expect(patient.anionGapCalculatedByLearner).toBe(false);
    expect(patient.severityCalculatedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 10 ml/kg', 'start an insulin infusion at', 'give a bicarbonate', 'the corrected sodium is', 'she can go home', 'her dka has resolved', 'cerebral injury is excluded']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Covers Both Halves of the Unordered Pair', () => {
  const V = '0.1.0';
  const atRecognized = () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    return engine;
  };

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pdka-trajectory', 'pdka-recognition', 'pdka-parallel', 'pdka-safety', 'pdka-later', 'pdka-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atRecognized()) })!;
    expect(prompt.id).toBe('pdka-parallel');
    expect(prompt.suggestion).toContain('the watch on her brain');
  });

  it('names the missing protocol owner when the watch went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'review-pediatric-dka-neurologic-and-metabolic-safety');
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.careAtTick).toBeNull();
    const prompt = pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pdka-care');
    expect(prompt.suggestion).toContain('The protocol still has no owner');
    expect(prompt.because).toContain('it delivers nothing');
  });

  it('names the watch when the protocol went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'activate-pediatric-dka-qualified-care-ownership');
    expect(snapshot(engine)!.careAtTick).not.toBeNull();
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    const prompt = pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pdka-safety');
    expect(prompt.because).toContain('what protects her is the repetition');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-dka-and-current-risk');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pdka-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: 'review-pediatric-dka-neurologic-and-metabolic-safety' } });
    engine.apply({ tick: 3, type: 'pediatric-diabetic-ketoacidosis-response', payload: { action: 'review-pediatric-dka-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pdka-later');
  });

  it('never states a dose, a correction, or an exclusion', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['start an insulin infusion at', 'the corrected sodium is', 'she can go home', 'cerebral injury is excluded']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricDkaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricDkaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricDkaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricDkaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
