/**
 * The worked example and observed-state tutor for two dangers pointing in
 * opposite directions.
 *
 * The correction works, and the same panel that proves it shows the urine
 * output rising from 35 to 180 mL/h — a water diuresis, meaning the kidneys
 * have taken the correction over and will not stop where anyone intended.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SEVERE_HYPONATREMIA_WITH_SEIZURE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/severe-hyponatremia-with-seizure';
import { SEVERE_HYPONATREMIA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/severe-hyponatremia-with-seizure-fixtures';
import {
  SEVERE_HYPONATREMIA_DEMONSTRATION_VERSION, severeHyponatremiaDemonstrationStep,
  supportsSevereHyponatremiaDemonstration,
} from '../../src/modules/emergency-medicine/demo/severe-hyponatremia-with-seizure-demonstration';
import { severeHyponatremiaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/severe-hyponatremia-with-seizure-guidance';
import type { SevereHyponatremiaAction } from '../../src/modules/emergency-medicine/severe-hyponatremia-with-seizure';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.hyponatremiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SevereHyponatremiaAction) => {
  engine.apply({ tick, type: 'hyponatremia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = severeHyponatremiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'hyponatremia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Turns Around When The Urine Output Does', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(SEVERE_HYPONATREMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSevereHyponatremiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsSevereHyponatremiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSevereHyponatremiaDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'severe-hyponatremia-with-seizure-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['pattern', 'stabilization', 'hypertonic', 'reassess', 'guardrails']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.stabilizedAtTick!);
    expect(patient.stabilizedAtTick).toBeLessThan(patient.hypertonicAtTick!);
    expect(patient.hypertonicAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(patient.reassessedAtTick).toBeLessThan(patient.guardrailsAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('makes symptomatic the load-bearing word and says why osmolality is on the panel', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('a different problem with a different tempo');
    expect(pattern).toContain('genuine hypotonicity rather than a laboratory artefact');
  });

  it('says she may seize again while the treatment is being drawn up', () => {
    const stabilization = narrations[beats.indexOf('stabilization')]!;
    expect(stabilization).toContain('while you are drawing up the treatment for the first');
    expect(stabilization).toContain('how fast, how far, and when to stop');
  });

  it('targets a safe sodium rather than a normal one, and prefers boluses', () => {
    const hypertonic = narrations[beats.indexOf('hypertonic')]!;
    expect(hypertonic).toContain('not a normal sodium but a safe one');
    expect(hypertonic).toContain('a bolus is a dose you have finished giving');
  });

  it('carries the turn: the warning is the urine output, not the sodium', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('That is a water diuresis starting');
    expect(reassess).toContain('The danger has just changed direction');
    expect(reassess).toContain('the number that warned you was not the sodium');
    expect(narration).toContain('the kidneys have taken over the job and will not stop where you would have');
  });

  it('holds the thiazide and names deliberate reversal as a real option', () => {
    const guardrails = narrations[beats.indexOf('guardrails')]!;
    expect(guardrails).toContain('the commonest drug cause of exactly this picture');
    expect(guardrails).toContain('deliberately reverse an overcorrection');
  });

  it('never names a concentration or volume, targets normal, or claims correction', () => {
    // Guard the instruction voice, not the nouns: the lesson names hypertonic
    // saline and the sodium targets precisely in order to bound them, so a bare
    // noun match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give 100 ml of 3%', 'run 3% at', 'start an infusion of 3%',
      'correct her to 135', 'aim for a normal sodium', 'the sodium is corrected',
      'she can go to the ward']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['hyp-pattern', 'hyp-stabilization', 'hyp-hypertonic',
      'hyp-reassess', 'hyp-guardrails']);
  });

  it('stays on stabilization when the saline is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hyponatremia-pattern');
    advance(engine, 1, 'record-hypertonic-saline-intent');
    expect(snapshot(engine)!.hypertonicAtTick).toBeNull();
    const prompt = severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hyp-stabilization');
    expect(prompt.suggestion).toContain('Protect her first');
  });

  it('stays on the first-hour panel when the guardrails are reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hyponatremia-pattern');
    advance(engine, 1, 'record-hyponatremia-stabilization');
    advance(engine, 2, 'record-hypertonic-saline-intent');
    advance(engine, 3, 'record-hyponatremia-guardrails-and-cause-plan');
    expect(snapshot(engine)!.guardrailsAtTick).toBeNull();
    expect(severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hyp-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-hyponatremia-stabilization');
    expect(snapshot(engine)!.stabilizedAtTick).toBeNull();
    expect(severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hyp-pattern');
  });

  it('never names a concentration or targets normal anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give 100 ml of 3%', 'correct her to 135', 'aim for a normal sodium']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the guardrails', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(severeHyponatremiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(severeHyponatremiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.guardrailsAtTick).not.toBeNull();
    expect(severeHyponatremiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(severeHyponatremiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
