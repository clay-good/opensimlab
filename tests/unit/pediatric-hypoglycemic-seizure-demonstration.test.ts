/**
 * The worked example and observed-state tutor for a child whose number came
 * back up.
 *
 * The thing to get right is that a corrected glucose is a treated symptom and
 * not an explained seizure. The structural thing is the unordered pair.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-hypoglycemic-seizure';
import { PEDIATRIC_HYPOGLYCEMIC_SEIZURE_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-hypoglycemic-seizure-fixtures';
import {
  PEDIATRIC_HYPOGLYCEMIC_SEIZURE_DEMONSTRATION_VERSION, pediatricHypoglycemicSeizureDemonstrationStep,
  supportsPediatricHypoglycemicSeizureDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-hypoglycemic-seizure-demonstration';
import { pediatricHypoglycemicSeizureInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-hypoglycemic-seizure-guidance';
import type { PediatricHypoglycemicSeizureAction } from '../../src/modules/pediatrics/pediatric-hypoglycemic-seizure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricHypoglycemicSeizureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricHypoglycemicSeizureAction) => {
  engine.apply({ tick, type: 'pediatric-hypoglycemic-seizure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricHypoglycemicSeizureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Explains Nothing By The Number', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_HYPOGLYCEMIC_SEIZURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricHypoglycemicSeizureDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricHypoglycemicSeizureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricHypoglycemicSeizureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps, taking the pair rescue-first', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'rescue', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.rescueAtTick!);
    expect(patient.rescueAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('treats the swallow safety as a fact about the route', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('it is the reason the rescue is not a cup of juice');
    expect(patient.initialGlucoseMgPerDl).toBe(34);
    expect(patient.glucoseAcquiredByLearner).toBe(false);
    expect(patient.glucoseInterpretedByLearner).toBe(false);
  });

  it('holds the urgency and the open cause true at the same time', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('The rescue cannot wait for a cause');
    expect(recognition).toContain('the association is not the cause');
    expect(recognition).toContain('does not usually run out of sugar for no reason');
    expect(patient.hypoglycemiaAuthored).toBe(true);
    expect(patient.diagnosisMadeByLearner).toBe(false);
  });

  it('hands the route and the formulation to the people who own them', () => {
    const rescue = narrations[beats.indexOf('rescue')]!;
    expect(rescue).toContain('the route is theirs to choose');
    expect(rescue).toContain('you select none of it');
    expect(patient.qualifiedRescueOwnershipActive).toBe(true);
    expect(patient.glucoseFormulationSelectedByLearner).toBe(false);
    expect(patient.accessPlacedByLearner).toBe(false);
  });

  it('names ingestion and safeguarding as part of the work', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('This is the half that gets skipped once the number comes up');
    expect(safety).toContain('rather than as an accusation');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
  });

  it('is precise about what a glucose of 86 earned', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('exactly the moment the room relaxes');
    expect(later).toContain('He is better. Nothing is explained.');
    expect(patient.laterGlucoseMgPerDl).toBe(86);
    expect(patient.seizureCauseProven).toBe(false);
    expect(patient.durableEuglycemiaProven).toBe(false);
    expect(patient.neurologicRecoveryProven).toBe(false);
    expect(patient.recurrenceExcluded).toBe(false);
  });

  it('ends with the question still open', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the safeguarding review as part of that work');
    expect(narration).toContain('not one person in this room knows yet why');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('gives nothing, chooses nothing, and predicts nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.drugDeliveredByLearner).toBe(false);
    expect(patient.glucoseDeliveredByLearner).toBe(false);
    expect(patient.airwayManeuverPerformedByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 2 ml/kg', 'give him dextrose', 'give glucagon', 'give him juice', 'he can go home', 'the cause was', 'this was caused by']) {
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
      const prompt = pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['phs-trajectory', 'phs-recognition', 'phs-parallel', 'phs-safety', 'phs-later', 'phs-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atRecognized()) })!;
    expect(prompt.id).toBe('phs-parallel');
    expect(prompt.suggestion).toContain('the sugar, and the question of why');
  });

  it('says the cause work raises nobody’s blood sugar when it went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk');
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.rescueAtTick).toBeNull();
    const prompt = pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('phs-rescue');
    expect(prompt.suggestion).toContain('His glucose is still 34');
    expect(prompt.because).toContain('raises nobody');
  });

  it('names the open question when the rescue went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership');
    expect(snapshot(engine)!.rescueAtTick).not.toBeNull();
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    const prompt = pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('phs-safety');
    expect(prompt.suggestion).toContain('why a well child ran out of sugar');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-hypoglycemic-seizure');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('phs-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: 'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk' } });
    engine.apply({ tick: 3, type: 'pediatric-hypoglycemic-seizure-response', payload: { action: 'review-pediatric-hypoglycemic-seizure-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('phs-later');
  });

  it('never states a dose, a cause, or a discharge', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give him dextrose', 'give glucagon', 'he can go home', 'this was caused by']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricHypoglycemicSeizureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricHypoglycemicSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricHypoglycemicSeizureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
