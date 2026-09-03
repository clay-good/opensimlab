/**
 * The worked example and observed-state tutor for a ventilator setting causing
 * the problem it looks like it is treating.
 *
 * Two reflexes: a peak pressure of 35 that invites turning the tidal volume
 * down when the plateau is 22, and a rate of 28 that looks like it is helping
 * her carbon dioxide while it causes the trapping.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { AUTO_PEEP as SCENARIO } from '../../src/modules/critical-care/scenarios/auto-peep';
import { AUTO_PEEP_FIXTURES as FIXTURES } from '../../src/modules/critical-care/auto-peep-fixtures';
import {
  AUTO_PEEP_DEMONSTRATION_VERSION, autoPeepDemonstrationStep, supportsAutoPeepDemonstration,
} from '../../src/modules/critical-care/demo/auto-peep-demonstration';
import { autoPeepInlinePrompt } from '../../src/modules/critical-care/tutor/auto-peep-guidance';
import type { AutoPeepAction } from '../../src/modules/critical-care/auto-peep';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.autoPeepAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AutoPeepAction) => {
  engine.apply({ tick, type: 'auto-peep-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = autoPeepDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'auto-peep-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Measures Before It Corrects', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(AUTO_PEEP_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAutoPeepDemonstration(SCENARIO)).toBe(true);
    expect(supportsAutoPeepDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAutoPeepDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'auto-peep-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['flow', 'measure', 'classify', 'correct', 'reassess']);
    expect(patient.flowAtTick).toBeLessThan(patient.measurementAtTick!);
    expect(patient.measurementAtTick).toBeLessThan(patient.classificationAtTick!);
    expect(patient.classificationAtTick).toBeLessThan(patient.correctionAtTick!);
    expect(patient.correctionAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('says the peak is not measuring what it appears to', () => {
    const flow = narrations[beats.indexOf('flow')]!;
    expect(flow).toContain('that gap is resistance rather than stiff lungs');
    expect(flow).toContain('for a problem it is not measuring');
    expect(flow).toContain('undo trapped pressure before the ventilator notices she is trying');
  });

  it('insists the hold is only valid in a passive window and holds three PEEPs apart', () => {
    const measure = narrations[beats.indexOf('measure')]!;
    expect(measure).toContain('a patient making efforts gives a reading that means nothing');
    expect(measure).toContain('intrinsic is the difference, which is the part nobody chose');
  });

  it('links the trapped pressure to her blood pressure without making one graphic proof', () => {
    const classify = narrations[beats.indexOf('classify')]!;
    expect(classify).toContain('which is why her blood pressure is what it is');
    expect(classify).toContain('not universal proof of trapping in the next patient');
  });

  it('names the rate as the setting that looks like it is helping', () => {
    const correct = narrations[beats.indexOf('correct')]!;
    expect(correct).toContain('the setting that looks like it is helping her carbon dioxide');
    expect(correct).toContain('no reflex claim about external PEEP');
  });

  it('accepts the hypercapnia as the trade rather than a failure', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('bounded and accepted rather than a failure');
    expect(reassess).toContain('the treatment working, not a side effect of it');
    expect(narration).toContain('that is the trade rather than a setback');
  });

  it('never names a rate, a tidal volume, a PEEP setting, or a bronchodilator dose', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['drop the rate to 14', 'set the tidal volume to 400',
      'set peep to 8', 'give 5 mg of salbutamol', 'switch to pressure control']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Chain', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['apo-flow', 'apo-measure', 'apo-classify', 'apo-correct', 'apo-reassess']);
  });

  it('stays on the hold when a correction is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-auto-peep-patient-and-flow');
    advance(engine, 1, 'record-auto-peep-correction-intent');
    expect(snapshot(engine)!.correctionAtTick).toBeNull();
    const prompt = autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('apo-measure');
    expect(prompt.suggestion).toContain('seeing the flow is not knowing the number');
  });

  it('stays on the classification when a correction is reached for after the hold', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-auto-peep-patient-and-flow');
    advance(engine, 1, 'measure-auto-peep');
    advance(engine, 2, 'record-auto-peep-correction-intent');
    expect(snapshot(engine)!.correctionAtTick).toBeNull();
    expect(autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('apo-classify');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'measure-auto-peep');
    expect(snapshot(engine)!.measurementAtTick).toBeNull();
    expect(autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('apo-flow');
  });

  it('never names a rate, a volume, or a PEEP setting', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['drop the rate to 14', 'set the tidal volume to 400', 'set peep to 8']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(autoPeepInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(autoPeepInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(autoPeepInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(autoPeepInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
