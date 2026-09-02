/**
 * The worked example and observed-state tutor for a rhythm treated as
 * ventricular without being proven so.
 *
 * The reflex it works against is the differential itself: the argument about
 * whether it is ventricular is less useful and less safe than acting as though
 * it is.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { WIDE_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/wide-complex-tachycardia';
import { STABLE_WIDE_TACHYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/cardiology/stable-wide-tachycardia-fixtures';
import {
  STABLE_WIDE_TACHYCARDIA_DEMONSTRATION_VERSION, stableWideTachycardiaDemonstrationStep,
  supportsStableWideTachycardiaDemonstration,
} from '../../src/modules/cardiology/demo/stable-wide-tachycardia-demonstration';
import { stableWideTachycardiaInlinePrompt } from '../../src/modules/cardiology/tutor/stable-wide-tachycardia-guidance';
import type { StableWideTachycardiaAction } from '../../src/modules/cardiology/stable-wide-tachycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.stableWideTachycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: StableWideTachycardiaAction) => {
  engine.apply({ tick, type: 'stable-wide-tachycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = stableWideTachycardiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'stable-wide-tachycardia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats It As Ventricular Without Proving It', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(STABLE_WIDE_TACHYCARDIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsStableWideTachycardiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsStableWideTachycardiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsStableWideTachycardiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all seven recorded steps, one more than there are objectives', () => {
    expect(beats).toEqual(['stability', 'context', 'readiness', 'medication', 'nonresponse', 'cardioversion', 'reassessment']);
    expect(patient.stabilityAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.readinessAtTick!);
    expect(patient.readinessAtTick).toBeLessThan(patient.medicationAtTick!);
    expect(patient.medicationAtTick).toBeLessThan(patient.nonresponseAtTick!);
    expect(patient.nonresponseAtTick).toBeLessThan(patient.cardioversionAtTick!);
    expect(patient.cardioversionAtTick).toBeLessThan(patient.reassessmentAtTick!);
  });

  it('makes the pulse the thing that defines the lesson', () => {
    const stability = narrations[beats.indexOf('stability')]!;
    expect(stability).toContain('separates this lesson from a cardiac arrest algorithm');
    expect(stability).toContain('any instability at any point changes the pathway immediately');
  });

  it('declines to litigate morphology criteria', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('not an argument about morphology criteria');
    expect(context).toContain('safe when wrong in either direction');
    expect(patient.mechanismProven).toBe(false);
  });

  it('says the ordering of readiness is the point rather than housekeeping', () => {
    const readiness = narrations[beats.indexOf('readiness')]!;
    expect(readiness).toContain('that ordering is the point rather than housekeeping');
    expect(readiness).toContain('whether the rescue was already in the room');
  });

  it('notices the check that made the pathway considered', () => {
    const medication = narrations[beats.indexOf('medication')]!;
    expect(medication).toContain('a considered choice rather than a default');
    expect(medication).toContain('No dose is supplied here and none is selected by you');
  });

  it('distinguishes nonresponse from deterioration', () => {
    const nonresponse = narrations[beats.indexOf('nonresponse')]!;
    expect(nonresponse).toContain('the finding that licenses escalation');
    expect(nonresponse).toContain('nonresponse rather than deterioration');
  });

  it('treats the conversation with an awake patient as part of the procedure', () => {
    const cardioversion = narrations[beats.indexOf('cardioversion')]!;
    expect(cardioversion).toContain('the word doing the work is synchronized');
    expect(cardioversion).toContain('part of the procedure rather than a courtesy attached to it');
    expect(patient.learnerTreatmentDelivered).toBe(false);
  });

  it('converts the rhythm without identifying it', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('a rhythm that responded to treatment, not a rhythm that has been identified');
    expect(narration).toContain('the mechanism is still not proven');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never names a dose, an energy, a sedative, or a mechanism', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 17 mg/kg', 'shock at 100 j', 'give midazolam', 'this is vt', 'refer for ablation', 'he needs an icd']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds Readiness And The Observation', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['swt-stability', 'swt-context', 'swt-readiness', 'swt-medication', 'swt-nonresponse', 'swt-cardioversion', 'swt-reassessment']);
  });

  it('stays on readiness when the drug is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'record-wide-complex-procainamide-pathway');
    expect(snapshot(engine)!.medicationAtTick).toBeNull();
    expect(snapshot(engine)!.readinessAtTick).toBeNull();
    const prompt = stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('swt-readiness');
    expect(prompt.suggestion).toContain('Pads on, help present');
  });

  it('stays on the observation when escalation is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 4)) advance(engine, tick, action);
    advance(engine, 4, 'record-wide-complex-cardioversion-intent');
    expect(snapshot(engine)!.cardioversionAtTick).toBeNull();
    expect(snapshot(engine)!.nonresponseAtTick).toBeNull();
    const prompt = stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('swt-nonresponse');
    expect(prompt.suggestion).toContain('This is its own step for a reason');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-wide-complex-context');
    expect(snapshot(engine)!.stabilityAtTick).toBeNull();
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('swt-stability');
  });

  it('never names a dose, an energy, or a mechanism', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give 17 mg/kg', 'shock at 100 j', 'this is vt', 'he needs an icd']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(stableWideTachycardiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(stableWideTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(stableWideTachycardiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
