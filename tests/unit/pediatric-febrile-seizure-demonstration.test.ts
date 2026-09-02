/**
 * The worked example and observed-state tutor for a well-looking toddler after
 * a frightening event.
 *
 * This is the one lesson in the module whose failure mode runs both ways: a
 * false reassurance, and an unnecessary workup. The example has to refuse both
 * without sounding alarmed.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_FEBRILE_SEIZURE as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-febrile-seizure';
import { PEDIATRIC_FEBRILE_SEIZURE_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-febrile-seizure-fixtures';
import {
  PEDIATRIC_FEBRILE_SEIZURE_DEMONSTRATION_VERSION, pediatricFebrileSeizureDemonstrationStep,
  supportsPediatricFebrileSeizureDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-febrile-seizure-demonstration';
import { pediatricFebrileSeizureInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-febrile-seizure-guidance';
import type { PediatricFebrileSeizureAction } from '../../src/modules/pediatrics/pediatric-febrile-seizure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricFebrileSeizureAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricFebrileSeizureAction) => {
  engine.apply({ tick, type: 'pediatric-febrile-seizure-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricFebrileSeizureDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-febrile-seizure-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Reassures With Boundaries', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_FEBRILE_SEIZURE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricFebrileSeizureDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricFebrileSeizureDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricFebrileSeizureDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps, taking the pair care-first', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'care', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.careAtTick!);
    expect(patient.careAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('notices that the missing routine test is deliberate', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('that absence is deliberate rather than an oversight');
    expect(patient.temperatureAcquiredByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
  });

  it('holds both halves of "simple features to date"', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('what makes an aggressive workup the wrong reflex here');
    expect(recognition).toContain('"to date" is not a formality');
    expect(recognition).toContain('fixed snapshots of this minute');
    expect(patient.classificationMadeByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
  });

  it('names the antipyretic boundary and the prophylaxis boundary', () => {
    const care = narrations[beats.indexOf('care')]!;
    expect(care).toContain('it does not prevent febrile seizures');
    expect(care).toContain('routine prophylactic antiseizure medicine is not modeled here at all');
    expect(patient.qualifiedCareOwnershipActive).toBe(true);
    expect(patient.antipyreticSelectedByLearner).toBe(false);
    expect(patient.anticonvulsantSelectedByLearner).toBe(false);
  });

  it('says why somebody keeps watching rather than deciding', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('the half that reassurance closes too early');
    expect(safety).toContain('can look different at minute forty');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
    expect(patient.lumbarPuncturePerformedByLearner).toBe(false);
  });

  it('calls the improving half-hour reassuring and then bounds it', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('worth saying to the family');
    expect(later).toContain('Reassurance with boundaries is more useful to this family');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.simpleFebrileSeizureFinallyProven).toBe(false);
    expect(patient.cnsInfectionExcluded).toBe(false);
    expect(patient.recurrenceExcluded).toBe(false);
  });

  it('hands off a safety net rather than a verdict', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('what to do if it happens again');
    expect(handoff).toContain('does not mean what people fear it means');
    expect(narration).toContain('nobody in this room has called it simple, benign or over');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('tests nothing, treats nothing, and concludes nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.eegAcquiredByLearner).toBe(false);
    expect(patient.imagingAcquiredByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['do a lumbar puncture', 'give paracetamol', 'give ibuprofen', 'start an antiseizure', 'he can go home', 'this was a simple febrile seizure', 'this is benign']) {
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
      const prompt = pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pfs-trajectory', 'pfs-recognition', 'pfs-parallel', 'pfs-safety', 'pfs-later', 'pfs-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atRecognized()) })!;
    expect(prompt.id).toBe('pfs-parallel');
    expect(prompt.suggestion).toContain('looking after him, and keeping looking');
  });

  it('distinguishes surveillance from care when the red flags went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives');
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.careAtTick).toBeNull();
    const prompt = pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pfs-care');
    expect(prompt.suggestion).toContain('Nobody is looking after him');
    expect(prompt.because).toContain('it is part of it');
  });

  it('names the open dangers when the care went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'activate-pediatric-febrile-seizure-qualified-care-ownership');
    expect(snapshot(engine)!.careAtTick).not.toBeNull();
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    const prompt = pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pfs-safety');
    expect(prompt.suggestion).toContain('keep the dangerous things open');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pfs-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-febrile-seizure-response', payload: { action: 'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives' } });
    engine.apply({ tick: 3, type: 'pediatric-febrile-seizure-response', payload: { action: 'review-pediatric-febrile-seizure-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pfs-later');
  });

  it('never orders a test, prescribes, or declares it benign', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['do a lumbar puncture', 'give paracetamol', 'he can go home', 'this is benign']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricFebrileSeizureInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricFebrileSeizureInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricFebrileSeizureInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
