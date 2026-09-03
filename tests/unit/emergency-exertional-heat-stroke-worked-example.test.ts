/**
 * The worked example and observed-state tutor for a diagnosis in which cooling
 * is the resuscitation.
 *
 * A collapsed, confused patient triggers a good routine — secure, monitor,
 * cannulate, bloods, scan — and in this one condition every minute that routine
 * owns is a minute at 41 degrees. The engine records the support bundle
 * explicitly as running alongside cooling rather than before it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { EXERTIONAL_HEAT_STROKE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/exertional-heat-stroke';
import { EXERTIONAL_HEAT_STROKE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/exertional-heat-stroke-fixtures';
import {
  EXERTIONAL_HEAT_STROKE_DEMONSTRATION_VERSION, exertionalHeatStrokeDemonstrationStep,
  supportsExertionalHeatStrokeDemonstration,
} from '../../src/modules/emergency-medicine/demo/exertional-heat-stroke-demonstration';
import { exertionalHeatStrokeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/exertional-heat-stroke-guidance';
import type { ExertionalHeatStrokeAction } from '../../src/modules/emergency-medicine/exertional-heat-stroke';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.heatStrokeAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: ExertionalHeatStrokeAction) => {
  engine.apply({ tick, type: 'heat-stroke-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = exertionalHeatStrokeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'heat-stroke-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats Cooling As The Resuscitation', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(EXERTIONAL_HEAT_STROKE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsExertionalHeatStrokeDemonstration(SCENARIO)).toBe(true);
    expect(supportsExertionalHeatStrokeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsExertionalHeatStrokeDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'exertional-heat-stroke-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['pattern', 'support', 'cooling', 'target', 'surveillance']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.coolingAtTick!);
    expect(patient.coolingAtTick).toBeLessThan(patient.targetAtTick!);
    expect(patient.targetAtTick).toBeLessThan(patient.surveillanceAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('makes the measurement site part of the diagnosis', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('can read whole degrees low');
    expect(pattern).toContain('Rectal is the number that counts');
    expect(pattern).toContain('treated in the opposite direction');
  });

  it('says the support bundle runs alongside cooling, not before it', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('This is the step where the lesson lives');
    expect(support).toContain('every minute that routine owns is a minute of brain and gut and muscle at 41 degrees');
    expect(narration).toContain('alongside the cooling rather than in front of it');
  });

  it('says immersion is the method, not merely the better option', () => {
    const cooling = narrations[beats.indexOf('cooling')]!;
    expect(cooling).toContain('not a gentler equivalent');
    expect(cooling).toContain('an ambulance is a much worse place to cool someone than a tub is');
  });

  it('treats stopping as a decision and says why below 39 rather than normal', () => {
    const target = narrations[beats.indexOf('target')]!;
    expect(target).toContain('Stopping is a decision, not an omission');
    expect(target).toContain('chase 37 and you arrive at hypothermia');
  });

  it('gives the reason antipyretics and dantrolene have no part in it', () => {
    const surveillance = narrations[beats.indexOf('surveillance')]!;
    expect(surveillance).toContain('the hypothalamic set point was never raised');
    expect(surveillance).toContain('a different mechanism entirely');
    expect(surveillance).toContain('a patient who is cool and talking can still be heading for');
  });

  it('never gives an antipyretic, cools to normal, delays cooling, or calls it over', () => {
    // Guard the instruction voice, not the nouns: the lesson names both
    // antipyretics and dantrolene in order to exclude them, so a bare noun
    // match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give paracetamol', 'give an antipyretic', 'give dantrolene',
      'cool her to 37', 'transport first, then cool', 'the injury is over',
      'she can be discharged']) {
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
      const prompt = exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['heat-pattern', 'heat-support', 'heat-cooling', 'heat-target', 'heat-surveillance']);
  });

  it('stays on the support bundle when immersion is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-heat-stroke-pattern');
    advance(engine, 1, 'record-cold-water-immersion');
    expect(snapshot(engine)!.coolingAtTick).toBeNull();
    const prompt = exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('heat-support');
    expect(prompt.suggestion).toContain('runs alongside cooling, not before it');
  });

  it('stays on the cooling target when surveillance is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-heat-stroke-pattern');
    advance(engine, 1, 'record-heat-stroke-support');
    advance(engine, 2, 'record-cold-water-immersion');
    advance(engine, 3, 'record-heat-stroke-organ-surveillance');
    expect(snapshot(engine)!.surveillanceAtTick).toBeNull();
    expect(exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('heat-target');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-cold-water-immersion');
    expect(snapshot(engine)!.coolingAtTick).toBeNull();
    expect(exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('heat-pattern');
  });

  it('never offers an antipyretic or dantrolene anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give paracetamol', 'give dantrolene', 'cool her to 37']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after surveillance', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(exertionalHeatStrokeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.surveillanceAtTick).not.toBeNull();
    expect(exertionalHeatStrokeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(exertionalHeatStrokeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
