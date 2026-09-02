/**
 * The worked example and observed-state tutor for a child two weights are not
 * enough to describe.
 *
 * The thing to get right is that the arithmetic never happens: no percentage,
 * no deficit, no maintenance, no cannula. The structural thing to get right is
 * the unordered pair, which needs a beat for each of the three ways it can be
 * half done.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_DEHYDRATION_WITH_HYPOVOLEMIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-dehydration-with-hypovolemia';
import { PEDIATRIC_DEHYDRATION_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-dehydration-fixtures';
import {
  PEDIATRIC_DEHYDRATION_DEMONSTRATION_VERSION, pediatricDehydrationDemonstrationStep,
  supportsPediatricDehydrationDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-dehydration-demonstration';
import { pediatricDehydrationInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-dehydration-guidance';
import type { PediatricDehydrationAction } from '../../src/modules/pediatrics/pediatric-dehydration-with-hypovolemia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricDehydrationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricDehydrationAction) => {
  engine.apply({ tick, type: 'pediatric-dehydration-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricDehydrationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-dehydration-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Never Does the Arithmetic', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_DEHYDRATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricDehydrationDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricDehydrationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricDehydrationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps, taking the pair rehydration-first', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'rehydration', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.rehydrationAtTick!);
    // One valid order of the unordered pair, not the required one.
    expect(patient.rehydrationAtTick).toBeLessThan(patient.safetyAtTick!);
    // The later report waits for whichever half landed second.
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('refuses to turn two weights into a percentage', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('Resist turning them into a percentage');
    expect(trajectory).toContain('a week-old weight also contains a week of not eating');
    expect(patient.patientWeighedByLearner).toBe(false);
    expect(patient.dehydrationPercentageCalculatedByLearner).toBe(false);
    expect(patient.fluidDeficitCalculatedByLearner).toBe(false);
    expect(patient.maintenanceCalculatedByLearner).toBe(false);
  });

  it('names the compensation without letting the absences become exclusions', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('say plainly that this is not shock');
    expect(recognition).toContain('fixed snapshots rather than permanent exclusions');
    expect(patient.compensatedHypovolemiaAuthored).toBe(true);
    expect(patient.shockAuthored).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
  });

  it('puts the fluid in the mouth and chooses none of it', () => {
    const rehydration = narrations[beats.indexOf('rehydration')]!;
    expect(rehydration).toContain('the mouth is the route this evidence supports');
    expect(rehydration).toContain('small frequent amounts');
    expect(patient.qualifiedRehydrationOwnershipActive).toBe(true);
    expect(patient.fluidSelectedByLearner).toBe(false);
    expect(patient.accessPlacedByLearner).toBe(false);
    expect(patient.feedingPlanSelectedByLearner).toBe(false);
  });

  it('sets a watch for the reason the plan will not work', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('Oral rehydration is the plan, not a guarantee');
    expect(safety).toContain('from a conclusion back into a question');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
    expect(patient.testAcquiredByLearner).toBe(false);
  });

  it('names what improved and then what was never supplied', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('reassess before you reassure');
    expect(later).toContain('Partial improvement is the honest description');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableRecoveryProven).toBe(false);
  });

  it('ends with the losses still running and everyone knowing what would change the plan', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the weight as context rather than a calculation');
    expect(handoff).toContain('what they can realistically sustain at home');
    expect(narration).toContain('nobody calculated a deficit');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dischargeReadinessProven).toBe(false);
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('examines nothing, treats nothing, and predicts nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.electrolyteSelectedByLearner).toBe(false);
    expect(patient.procedurePerformedByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['she is 5% dehydrated', 'give 20 ml/kg', 'start an iv', 'start intravenous fluid', 'she can go home', 'she is rehydrated', 'ml/kg/h of maintenance']) {
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
      const prompt = pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pdh-trajectory', 'pdh-recognition', 'pdh-parallel', 'pdh-safety', 'pdh-later', 'pdh-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atRecognized()) })!;
    expect(prompt.id).toBe('pdh-parallel');
    expect(prompt.suggestion).toContain('the watch for being wrong');
  });

  it('names the missing owner for the fluid when the watch went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'review-pediatric-dehydration-ongoing-losses-and-safety');
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.rehydrationAtTick).toBeNull();
    const prompt = pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pdh-rehydration');
    expect(prompt.suggestion).toContain('Nobody owns the fluid yet');
    expect(prompt.because).toContain('puts nothing into this child');
  });

  it('names the watch when the rehydration went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'activate-pediatric-dehydration-qualified-rehydration-ownership');
    expect(snapshot(engine)!.rehydrationAtTick).not.toBeNull();
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    const prompt = pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pdh-safety');
    expect(prompt.because).toContain('Oral rehydration is the plan, not a guarantee');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-dehydration-with-hypovolemia');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pdh-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-dehydration-response', payload: { action: 'review-pediatric-dehydration-ongoing-losses-and-safety' } });
    engine.apply({ tick: 3, type: 'pediatric-dehydration-response', payload: { action: 'review-pediatric-dehydration-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pdh-later');
  });

  it('never reaches for a cannula, a percentage, or a discharge', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['start intravenous fluid', 'she is 5% dehydrated', 'she can go home', 'she is rehydrated']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricDehydrationInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricDehydrationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricDehydrationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricDehydrationInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
