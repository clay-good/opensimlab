/**
 * The worked example and observed-state tutor for a rhythm that converts and
 * settles nothing.
 *
 * Two things to get right: a normal blood pressure is not adequate perfusion,
 * and sinus rhythm is where the cardiology question starts.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { PEDIATRIC_SUPRAVENTRICULAR_TACHYCARDIA as SCENARIO } from '../../src/modules/pediatrics/scenarios/pediatric-supraventricular-tachycardia';
import { PEDIATRIC_SVT_FIXTURES as FIXTURES } from '../../src/modules/pediatrics/pediatric-svt-fixtures';
import {
  PEDIATRIC_SVT_DEMONSTRATION_VERSION, pediatricSvtDemonstrationStep,
  supportsPediatricSvtDemonstration,
} from '../../src/modules/pediatrics/demo/pediatric-svt-demonstration';
import { pediatricSvtInlinePrompt } from '../../src/modules/pediatrics/tutor/pediatric-svt-guidance';
import type { PediatricSvtAction } from '../../src/modules/pediatrics/pediatric-supraventricular-tachycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.pediatricSupraventricularTachycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: PediatricSvtAction) => {
  engine.apply({ tick, type: 'pediatric-supraventricular-tachycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = pediatricSvtDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'pediatric-supraventricular-tachycardia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats Conversion As A Checkpoint', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_SVT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricSvtDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricSvtDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The guard asserts the opening rhythm-change event rather than assuming
    // an all-narrative timeline, so dropping it must fail closed.
    expect(supportsPediatricSvtDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('reaches handoff through all six recorded steps in the one available order', () => {
    expect(beats).toEqual(['trajectory', 'recognition', 'care', 'safety', 'later', 'handoff']);
    expect(patient.trajectoryAtTick).toBeLessThan(patient.recognitionAtTick!);
    expect(patient.recognitionAtTick).toBeLessThan(patient.careAtTick!);
    // The strict line: the review cannot precede rhythm-care ownership.
    expect(patient.careAtTick).toBeLessThan(patient.safetyAtTick!);
    expect(patient.safetyAtTick).toBeLessThan(patient.laterResponseAtTick!);
    expect(patient.laterResponseAtTick).toBeLessThan(patient.handoffAtTick!);
  });

  it('separates a fixed rate from a sinus tachycardia that would have a reason', () => {
    const trajectory = narrations[beats.indexOf('trajectory')]!;
    expect(trajectory).toContain('would vary and would have a reason');
    expect(trajectory).toContain('a load his ventricle has been carrying the whole time');
    expect(patient.abruptRegularNarrowTachycardiaAuthored).toBe(true);
    expect(patient.ecgInterpretedByLearner).toBe(false);
  });

  it('says a normal blood pressure is not adequate perfusion', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('not the same as adequate perfusion');
    expect(recognition).toContain('right up until they stop');
    expect(patient.perfusionCompromiseAuthored).toBe(true);
    expect(patient.mechanismAssignedByLearner).toBe(false);
  });

  it('hands the whole ladder to the qualified team', () => {
    const care = narrations[beats.indexOf('care')]!;
    expect(care).toContain('You perform no maneuver and choose no modality');
    expect(care).toContain('not a thing to think about for another ten');
    expect(patient.qualifiedRhythmCareOwnershipActive).toBe(true);
    expect(patient.maneuverPerformedByLearner).toBe(false);
    expect(patient.cardioversionPerformedByLearner).toBe(false);
  });

  it('names pre-excitation as unexcluded and therefore load-bearing', () => {
    const safety = narrations[beats.indexOf('safety')]!;
    expect(safety).toContain('Pre-excitation matters here because it changes what is safe');
    expect(safety).toContain('whose reassessment interval should be shortest');
    expect(patient.qualifiedSafetyReviewActive).toBe(true);
  });

  it('refuses to credit the conversion to anybody in the room', () => {
    const later = narrations[beats.indexOf('later')]!;
    expect(later).toContain('you delivered none');
    expect(later).toContain('where the cardiology question starts, not where it stops');
    expect(patient.laterSinusRhythmAuthored).toBe(true);
    expect(patient.treatmentEffectProven).toBe(false);
    expect(patient.durableConversionProven).toBe(false);
  });

  it('ends with the mechanism, the cause and the recurrence all open', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('no mechanism was ever assigned');
    expect(narration).toContain('nobody here knows the mechanism, the cause, or whether it comes back tonight');
    expect(narration).toContain('This ends the example, not the evaluation.');
    expect(patient.dispositionDetermined).toBe(false);
  });

  it('performs nothing, selects nothing, and concludes nothing', () => {
    expect(patient.patientExaminedByLearner).toBe(false);
    expect(patient.accessPlacedByLearner).toBe(false);
    expect(patient.drugDeliveredByLearner).toBe(false);
    expect(patient.treatmentDeliveredByLearner).toBe(false);
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give adenosine', 'try ice to the face', 'shock him at', 'give 0.1 mg/kg', 'he can go home', 'this was avnrt', 'the svt is cured']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Enforces The Order It Argues For', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['psvt-trajectory', 'psvt-recognition', 'psvt-care', 'psvt-safety', 'psvt-later', 'psvt-handoff']);
  });

  it('stays on the ownership when the review is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary');
    expect(snapshot(engine)!.safetyAtTick).toBeNull();
    expect(snapshot(engine)!.careAtTick).toBeNull();
    const prompt = pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('psvt-care');
    expect(prompt.suggestion).toContain('before you review anything else');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-pediatric-svt-with-perfusion-compromise');
    expect(snapshot(engine)!.trajectoryAtTick).toBeNull();
    expect(snapshot(engine)!.recognitionAtTick).toBeNull();
    expect(pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psvt-trajectory');
  });

  it('does not move on when the later report is refused for time', () => {
    // The gate reads the engine's clock, not the tick on the action, so the
    // refusal only happens when both are dispatched before the next step.
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    engine.apply({ tick: 3, type: 'pediatric-supraventricular-tachycardia-response', payload: { action: 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary' } });
    engine.apply({ tick: 3, type: 'pediatric-supraventricular-tachycardia-response', payload: { action: 'review-pediatric-svt-later-response' } });
    engine.step();
    expect(snapshot(engine)!.safetyAtTick).not.toBeNull();
    expect(snapshot(engine)!.laterResponseAtTick).toBeNull();
    expect(pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('psvt-later');
  });

  it('never names a drug, an energy, or a cure', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(8);
    for (const text of seen) {
      for (const forbidden of ['give adenosine', 'shock him at', 'he can go home', 'the svt is cured']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(pediatricSvtInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(pediatricSvtInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(pediatricSvtInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(pediatricSvtInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
