/**
 * The worked example and observed-state tutor for an antidote that wears off
 * first.
 *
 * The bag comes before the syringe, and the example deliberately does not end
 * at the good panel: twenty-five minutes on, the respiratory numbers have all
 * reversed, because opioid effect can outlast naloxone.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { OPIOID_TOXICITY as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/opioid-toxicity';
import { OPIOID_TOXICITY_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/opioid-toxicity-fixtures';
import {
  OPIOID_TOXICITY_DEMONSTRATION_VERSION, opioidToxicityDemonstrationStep,
  supportsOpioidToxicityDemonstration,
} from '../../src/modules/emergency-medicine/demo/opioid-toxicity-demonstration';
import { opioidToxicityInlinePrompt } from '../../src/modules/emergency-medicine/tutor/opioid-toxicity-guidance';
import type { OpioidToxicityAction } from '../../src/modules/emergency-medicine/opioid-toxicity';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.opioidToxicityAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: OpioidToxicityAction) => {
  engine.apply({ tick, type: 'opioid-toxicity-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = opioidToxicityDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'opioid-toxicity-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Bags Before It Injects, And Does Not Stop At The Good Panel', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(OPIOID_TOXICITY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsOpioidToxicityDemonstration(SCENARIO)).toBe(true);
    expect(supportsOpioidToxicityDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsOpioidToxicityDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'opioid-toxicity-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps with ventilation ahead of the antagonist', () => {
    expect(beats).toEqual(['pattern', 'ventilation', 'naloxone', 'initial', 'recurrence', 'plan']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.ventilationAtTick!);
    expect(patient.ventilationAtTick).toBeLessThan(patient.antagonistAtTick!);
    expect(patient.initialReassessmentAtTick).toBeLessThan(patient.recurrenceReviewedAtTick!);
    expect(patient.recurrenceReviewedAtTick).toBeLessThan(patient.recurrencePlanAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('reads the carbon dioxide as the number that reports breathing', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('which supplemental oxygen can paper over');
    expect(pattern).toContain('a triad is a pattern rather than a proof');
  });

  it('says nothing about naloxone is faster than a bag-mask', () => {
    const ventilation = narrations[beats.indexOf('ventilation')]!;
    expect(ventilation).toContain('This is the treatment; the antidote is the follow-up');
    expect(ventilation).toContain('Nothing about naloxone is faster than a bag-mask');
    expect(narration).toContain('The bag came before the syringe');
  });

  it('aims the antagonist at breathing rather than arousal', () => {
    const naloxone = narrations[beats.indexOf('naloxone')]!;
    expect(naloxone).toContain('Full arousal is not the target');
    expect(naloxone).toContain('a patient who leaves before the opioid has worn off');
  });

  it('names which number the learner is allowed to be pleased about', () => {
    const initial = narrations[beats.indexOf('initial')]!;
    expect(initial).toContain('ventilation adequacy rather than wakefulness');
    expect(initial).toContain('the persistent drowsiness is not a failure of the dose');
  });

  it('carries the recurrence claim, which is why the example continues', () => {
    const recurrence = narrations[beats.indexOf('recurrence')]!;
    expect(recurrence).toContain('This is the point of the lesson');
    expect(recurrence).toContain('the antagonist wears off while the agonist is still bound');
    expect(recurrence).toContain('allowed to walk out of a waiting room');
  });

  it('treats take-home naloxone as care for an overdose nobody will see', () => {
    const plan = narrations[beats.indexOf('plan')]!;
    expect(plan).toContain('a clinical endpoint rather than a fixed number of hours');
    expect(plan).toContain('the one nobody in this department will ever see');
  });

  it('never gives the antagonist first, chases arousal, names a dose, or discharges him', () => {
    // Guard the instruction voice, not the nouns: the lesson names naloxone and
    // arousal precisely in order to bound them, so a bare noun match would fail
    // on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give the naloxone first', 'wake him up fully',
      'give 0.4 mg', 'push 2 mg of naloxone', 'he can be discharged',
      'observe him for four hours', 'the overdose is reversed']) {
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
      const prompt = opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['opi-pattern', 'opi-ventilation', 'opi-naloxone',
      'opi-initial', 'opi-recurrence', 'opi-plan']);
  });

  it('stays on ventilation when the antagonist is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-opioid-toxicity-pattern');
    advance(engine, 1, 'record-opioid-naloxone-intent');
    expect(snapshot(engine)!.antagonistAtTick).toBeNull();
    const prompt = opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('opi-ventilation');
    expect(prompt.suggestion).toContain('the antidote is the follow-up');
  });

  it('stays on the recurrence panel when the plan is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-opioid-toxicity-pattern');
    advance(engine, 1, 'record-opioid-ventilation-support');
    advance(engine, 2, 'record-opioid-naloxone-intent');
    advance(engine, 3, 'reassess-opioid-initial-response');
    advance(engine, 4, 'record-opioid-recurrence-and-safety-plan');
    expect(snapshot(engine)!.recurrencePlanAtTick).toBeNull();
    expect(opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('opi-recurrence');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-opioid-ventilation-support');
    expect(snapshot(engine)!.ventilationAtTick).toBeNull();
    expect(opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('opi-pattern');
  });

  it('never names a dose or chases arousal anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give 0.4 mg', 'wake him up fully', 'observe him for four hours']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the plan', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(opioidToxicityInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(opioidToxicityInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.recurrencePlanAtTick).not.toBeNull();
    expect(opioidToxicityInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(opioidToxicityInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
