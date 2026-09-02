/**
 * The worked example and observed-state tutor for a seizure that stops being
 * visible.
 *
 * Two clocks. The first decides the drug class; the second is the one that
 * gets misread when the movements stop.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_STATUS_EPILEPTICUS as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-status-epilepticus';
import { PEDIATRIC_STATUS_EPILEPTICUS_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-status-epilepticus-fixtures';
import {
  PEDIATRIC_STATUS_EPILEPTICUS_DEMONSTRATION_VERSION, pediatricStatusEpilepticusDemonstrationStep,
  supportsPediatricStatusEpilepticusDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-status-epilepticus-demonstration';
import { pediatricStatusEpilepticusInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-status-epilepticus-guidance';
import type { PediatricStatusEpilepticusAction } from '../../src/modules/pediatrics/pediatric-status-epilepticus';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricStatusEpilepticusAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricStatusEpilepticusAction) => {
  engine.apply({ tick, type: 'pediatric-status-epilepticus-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricStatusEpilepticusDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-status-epilepticus-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Read Stillness As Control', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_STATUS_EPILEPTICUS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricStatusEpilepticusDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricStatusEpilepticusDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPediatricStatusEpilepticusDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps, taking the pair second-line-first', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'secondLine', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.secondLineAtTick!);
    expect(patient.secondLineAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('starts from the clock and says what cannot be measured', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('the clock is what decides the next drug');
    expect(trajectory).toContain('not reliably countable during the movements');
    expect(patient.seizureTimedByLearner).toBe(false);
    expect(patient.glucoseAcquiredByLearner).toBe(false);
  });

  it('names the failure that changes the drug class', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('reaching for a third benzodiazepine');
    expect(recognition).toContain('More of the same is not the next step');
    expect(patient.benzodiazepineSelectedByLearner).toBe(false);
    expect(patient.diagnosisMadeByLearner).toBe(false);
  });

  it('treats the time in status as the variable nobody gets back', () => {
    const secondLine = narrations[beats.indexOf('secondLine')]!;
    expect(secondLine).toContain('do not queue behind each other');
    expect(secondLine).toContain('the variable nobody gets back');
    expect(patient.qualifiedSecondLineOwnershipActive).toBe(true);
    expect(patient.antiseizureDrugSelectedByLearner).toBe(false);
  });

  it('says why the airway is not incidental and sets the refractory line early', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('can depress her breathing');
    expect(safety).toContain('the difference between escalating and noticing late');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
    expect(patient.airwayManeuverPerformedByLearner).toBe(false);
  });

  it('calls stillness the most over-read finding in the lesson', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('the most over-read finding in this lesson');
    expect(later).toContain('still needs watching, not a child who is finished');
    expect(patient.laterReportAuthored).toBe(true);
    expect(patient.electrographicSeizureControlProven).toBe(false);
    expect(patient.durableSeizureControlProven).toBe(false);
  });

  it('hands off the gap explicitly', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('the explicit gap between no visible convulsion and no seizure');
    expect(narration).toContain('still is not the same as well');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
    expect(patient.outcomePredicted).toBe(false);
  });

  it('times nothing, selects nothing, and concludes nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.testAcquiredByLearner).toBe(false);
    expect(patient.drugDeliveredByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give another dose of midazolam', 'give levetiracetam', 'give phenytoin', 'intubate her now', 'the seizure has stopped', 'she has recovered']) {
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
      const prompt = pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['pse-trajectory', 'pse-recognition', 'pse-parallel', 'pse-safety', 'pse-later', 'pse-handoff']);
  });

  it('asks for both when neither has started', () => {
    const prompt = pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(atRecognized()) })!;
    expect(prompt.id).toBe('pse-parallel');
    expect(prompt.suggestion).toContain('do not queue behind each other');
  });

  it('says the review does not stop a seizure when it went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary');
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.secondLineAtTick).toBeNull();
    const prompt = pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pse-second-line');
    expect(prompt.suggestion).toContain('She is still convulsing');
    expect(prompt.because).toContain('it does not stop a seizure');
  });

  it('names the airway when the drug went first', () => {
    const engine = atRecognized();
    advance(engine, 2, 'activate-pediatric-status-epilepticus-qualified-second-line-ownership');
    expect(snapshot(engine)!.secondLineAtTick).not.toBeNull();
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    const prompt = pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('pse-safety');
    expect(prompt.because).toContain('can depress her breathing');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-convulsive-status-after-first-line-care');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pse-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-status-epilepticus-response', payload: { action: 'review-pediatric-status-epilepticus-airway-causes-and-refractory-boundary' } });
    engine.apply({ tick: 3, type: 'pediatric-status-epilepticus-response', payload: { action: 'review-pediatric-status-epilepticus-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('pse-later');
  });

  it('never names an agent, a dose, or a recovery', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give levetiracetam', 'give phenytoin', 'the seizure has stopped', 'she has recovered']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricStatusEpilepticusInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricStatusEpilepticusInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricStatusEpilepticusInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
