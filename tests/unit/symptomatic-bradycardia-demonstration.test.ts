/**
 * The worked example and observed-state tutor for a slow rhythm that is not
 * treated because it is slow.
 *
 * The reflex both work against is the number. A rate of 44 decides nothing in
 * this lesson: the symptoms carry the evaluation and the temporal link carries
 * the referral.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { SYMPTOMATIC_SINUS_BRADYCARDIA_REASSESSMENT as SCENARIO } from '../../src/modules/cardiology/scenarios/symptomatic-sinus-bradycardia-reassessment';
import { SYMPTOMATIC_BRADYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/cardiology/symptomatic-bradycardia-fixtures';
import {
  SYMPTOMATIC_BRADYCARDIA_DEMONSTRATION_VERSION, symptomaticBradycardiaDemonstrationStep,
  supportsSymptomaticBradycardiaDemonstration,
} from '../../src/modules/cardiology/demo/symptomatic-bradycardia-demonstration';
import { symptomaticBradycardiaInlinePrompt } from '../../src/modules/cardiology/tutor/symptomatic-bradycardia-guidance';
import type { SymptomaticBradycardiaAction } from '../../src/modules/cardiology/symptomatic-bradycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.symptomaticBradycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: SymptomaticBradycardiaAction) => {
  engine.apply({ tick, type: 'symptomatic-bradycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = symptomaticBradycardiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'symptomatic-bradycardia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Evaluates A Symptom, Not A Rate', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(SYMPTOMATIC_BRADYCARDIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsSymptomaticBradycardiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsSymptomaticBradycardiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsSymptomaticBradycardiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all five recorded steps, one per declared objective', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['stability', 'review', 'correlation', 'pacing', 'handoff']);
    expect(patient.stabilityAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.correlationAtTick!);
    expect(patient.correlationAtTick).toBeLessThan(patient.pacingEvaluationAtTick!);
    expect(patient.pacingEvaluationAtTick).toBeLessThan(patient.handoffAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('separates symptomatic from unstable at the opening beat', () => {
    const stability = narrations[beats.indexOf('stability')]!;
    expect(stability).toContain('Symptomatic and unstable are different words');
    expect(stability).toContain('rather than the emergency bradycardia pathway');
  });

  it('says the middle order is the learner’s rather than choosing one for them', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('the engine does not mind which you take first');
    expect(review).toContain('the order between them is genuinely yours');
  });

  it('reviews the beta blocker without stopping it', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('whether it is still indicated');
    const everything = narrations.join(' ');
    expect(everything).toContain('reviewing an indication is not the same as changing a prescription');
    expect(everything).toContain('nothing here stops her metoprolol');
    expect(everything).toContain('changes a medication');
  });

  it('is precise about how little the correlation establishes', () => {
    const correlation = narrations[beats.indexOf('correlation')]!;
    expect(correlation).toContain('does not make one heart rate or one pause length diagnostic');
    expect(correlation).toContain('does not prove sinus-node dysfunction');
    expect(patient.mechanismProven).toBe(false);
  });

  it('refuses to let a low rate earn a device', () => {
    const pacing = narrations[beats.indexOf('pacing')]!;
    expect(pacing).toContain('not something a rate of 44 earns on its own');
    expect(pacing).toContain('no device, no mode, no lead, no date');
    expect(patient.treatmentDelivered).toBe(false);
  });

  it('closes with a named owner and concrete triggers', () => {
    const handoff = narrations[beats.indexOf('handoff')]!;
    expect(handoff).toContain('so the referral is somebody\'s rather than everybody\'s');
    expect(handoff).toContain('stop being an outpatient question');
    expect(narration).toContain('no cause established and no device decided');
    expect(narration).toContain('The rate of 44 never decided anything.');
  });

  it('never names a threshold, a device, a medication change, or a mechanism', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['pace below 40', 'stop the metoprolol', 'implant a dual-chamber',
      'she has sick sinus syndrome', 'halve the dose', 'give atropine']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Follows Whichever Lane Is Open', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ssb-stability', 'ssb-review', 'ssb-correlation', 'ssb-pacing', 'ssb-handoff']);
  });

  it('names the remaining lane after the record is correlated first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-symptomatic-bradycardia-stability');
    advance(engine, 1, 'correlate-symptomatic-bradycardia-record');
    const prompt = symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ssb-context');
    expect(prompt.suggestion).toContain('without stopping her medication');
  });

  it('holds on the open lane when the referral is attempted with one done', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'reconcile-symptomatic-bradycardia-stability');
    advance(engine, 1, 'correlate-symptomatic-bradycardia-record');
    advance(engine, 2, 'record-symptomatic-bradycardia-pacing-evaluation');
    expect(snapshot(engine)!.pacingEvaluationAtTick).toBeNull();
    expect(symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ssb-context');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-symptomatic-bradycardia-context');
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ssb-stability');
  });

  it('never names a threshold, a device, or a medication change', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['pace below 40', 'stop the metoprolol', 'implant a dual-chamber', 'give atropine']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after handoff', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(symptomaticBradycardiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.handoffAtTick).not.toBeNull();
    expect(symptomaticBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(symptomaticBradycardiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
