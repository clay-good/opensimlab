/**
 * The worked example and observed-state tutor for a patient who is both of the
 * two preceding lessons.
 *
 * The reflex both work against is the label: septic shock taught one fluid
 * decision, cardiogenic shock taught the opposite, and the pull here is to
 * decide which one she really is and apply that lesson's answer.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { MIXED_SHOCK as SCENARIO } from '../../src/modules/critical-care/scenarios/mixed-shock';
import { MIXED_SHOCK_FIXTURES as FIXTURES } from '../../src/modules/critical-care/mixed-shock-fixtures';
import {
  MIXED_SHOCK_DEMONSTRATION_VERSION, mixedShockDemonstrationStep,
  supportsMixedShockDemonstration,
} from '../../src/modules/critical-care/demo/mixed-shock-demonstration';
import { mixedShockInlinePrompt } from '../../src/modules/critical-care/tutor/mixed-shock-guidance';
import type { MixedShockAction } from '../../src/modules/critical-care/mixed-shock';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.mixedShockAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: MixedShockAction) => {
  engine.apply({ tick, type: 'mixed-shock-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = mixedShockDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'mixed-shock-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Refuses To Pick A Label', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(MIXED_SHOCK_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsMixedShockDemonstration(SCENARIO)).toBe(true);
    expect(supportsMixedShockDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsMixedShockDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'mixed-shock-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognition', 'hemodynamics', 'support', 'causes', 'reassessment']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.hemodynamicsAtTick!);
    expect(patient.hemodynamicsAtTick).toBeLessThan(patient.supportAtTick!);
    expect(patient.supportAtTick).toBeLessThan(patient.causesAtTick!);
    expect(patient.causesAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('makes the mottled knees and the warm hands the finding', () => {
    const recognition = narrations[beats.indexOf('recognition')]!;
    expect(recognition).toContain('it is not a measurement error — it is the point');
    expect(recognition).toContain('not a patient who can wait for one');
  });

  it('splits the panel into two true halves rather than a vote', () => {
    const hemodynamics = narrations[beats.indexOf('hemodynamics')]!;
    expect(hemodynamics).toContain('Both are true at once, which is what mixed means');
    expect(hemodynamics).toContain('would make one half of her invisible');
    expect(hemodynamics).toContain('suggested ranges rather than diagnostic cutoffs');
    expect(hemodynamics).toContain('already on vasoactive support, which changes what every one of those numbers means');
  });

  it('excludes blind fluid loading and says the septic half does not change that', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('there is no volume problem to solve');
    expect(support).toContain('the septic half of her physiology does not change that');
  });

  it('names the failure the cause step exists to prevent', () => {
    const causes = narrations[beats.indexOf('causes')]!;
    expect(causes).toContain('treat the naming as the answer');
    expect(causes).toContain('let one of the two pathways quietly go unowned');
  });

  it('calls improvement here the easiest thing in the module to over-read', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('the easiest thing in this module to over-read');
    expect(reassessment).toContain('distinguishes none of that');
    expect(narration).toContain('never a contradiction to resolve');
  });

  it('never names an agent, a dose, a target, a fluid volume, or a single label', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['start vasopressin at', 'add dobutamine at', 'aim for a map of 65',
      'give 500 ml', 'this is septic shock', 'this is cardiogenic shock']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds Both Halves', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['mxs-recognition', 'mxs-hemodynamics', 'mxs-support', 'mxs-causes', 'mxs-reassessment']);
  });

  it('stays on the panel when support is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-mixed-shock-discordance');
    advance(engine, 1, 'record-mixed-shock-support');
    expect(snapshot(engine)!.supportAtTick).toBeNull();
    const prompt = mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('mxs-hemodynamics');
    expect(prompt.suggestion).toContain('not as a vote between two diagnoses');
  });

  it('stays on support when cause control is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-mixed-shock-discordance');
    advance(engine, 1, 'classify-mixed-shock-hemodynamics');
    advance(engine, 2, 'address-mixed-shock-causes');
    expect(snapshot(engine)!.causesAtTick).toBeNull();
    expect(mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('mxs-support');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'classify-mixed-shock-hemodynamics');
    expect(snapshot(engine)!.hemodynamicsAtTick).toBeNull();
    expect(mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('mxs-recognition');
  });

  it('never names an agent, a dose, or a single label', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['start vasopressin at', 'add dobutamine at', 'this is septic shock']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(mixedShockInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(mixedShockInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(mixedShockInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(mixedShockInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
