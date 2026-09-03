/**
 * The worked example and observed-state tutor for a patient who would have been
 * sedated.
 *
 * Everything on his screen says he is trying to breathe and being refused.
 * Sedating him removes the evidence rather than the cause.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { VENTILATOR_DYSSYNCHRONY as SCENARIO } from '../../src/modules/critical-care/scenarios/ventilator-dyssynchrony';
import { DYSSYNCHRONY_FIXTURES as FIXTURES } from '../../src/modules/critical-care/dyssynchrony-fixtures';
import {
  DYSSYNCHRONY_DEMONSTRATION_VERSION, dyssynchronyDemonstrationStep, supportsDyssynchronyDemonstration,
} from '../../src/modules/critical-care/demo/dyssynchrony-demonstration';
import { dyssynchronyInlinePrompt } from '../../src/modules/critical-care/tutor/dyssynchrony-guidance';
import type { DyssynchronyAction } from '../../src/modules/critical-care/dyssynchrony';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.ventilatorDyssynchronyAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DyssynchronyAction) => {
  engine.apply({ tick, type: 'ventilator-dyssynchrony-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = dyssynchronyDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'ventilator-dyssynchrony-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does Not Sedate The Evidence Away', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DYSSYNCHRONY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDyssynchronyDemonstration(SCENARIO)).toBe(true);
    expect(supportsDyssynchronyDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDyssynchronyDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'ventilator-dyssynchrony-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['graphics', 'drivers', 'classify', 'correct', 'reassess']);
    expect(patient.graphicsAtTick).toBeLessThan(patient.driversAtTick!);
    expect(patient.driversAtTick).toBeLessThan(patient.classificationAtTick!);
    expect(patient.classificationAtTick).toBeLessThan(patient.correctionAtTick!);
    expect(patient.correctionAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('reads the three findings as one sentence', () => {
    const graphics = narrations[beats.indexOf('graphics')]!;
    expect(graphics).toContain('a patient pulling harder than the set flow');
    expect(graphics).toContain('the breath ends while he is still asking for it');
    expect(graphics).toContain('his demand and the machine\'s delivery do not match');
  });

  it('asks what is making him breathe like this before touching the settings', () => {
    const drivers = narrations[beats.indexOf('drivers')]!;
    expect(drivers).toContain('can be fighting something that has nothing to do with the ventilator');
    expect(drivers).toContain('a chemical reason to want more breath');
    expect(drivers).toContain('looks exactly like a patient who cannot get a breath');
  });

  it('treats the double triggering as a consequence rather than a third finding', () => {
    const classify = narrations[beats.indexOf('classify')]!;
    expect(classify).toContain('the consequence rather than a third finding');
    expect(classify).toContain('the part with a lung-injury cost');
    expect(classify).toContain('is not a rule about irregular breaths in general');
  });

  it('puts analgesia first and refuses the sedation reflex by name', () => {
    const correct = narrations[beats.indexOf('correct')]!;
    expect(correct).toContain('pain is a driver rather than a nuisance');
    expect(correct).toContain('no deep-sedation claim and no paralysis');
    expect(correct).toContain('removes the signal and leaves the mismatch');
  });

  it('reads comfort and mechanics together because either alone misleads', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('while his delivered volume is still stacking has not been helped');
    expect(reassess).toContain('what worked for this man\'s flow demand is his');
    expect(narration).toContain('nobody sedated him to get there');
  });

  it('never sedates, paralyses, names a drug or dose, or selects a setting', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give propofol', 'give a bolus of fentanyl', 'paralyse him',
      'give rocuronium', 'set the flow to 60', 'switch to pressure support']) {
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
      const prompt = dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['vds-graphics', 'vds-drivers', 'vds-classify', 'vds-correct', 'vds-reassess']);
  });

  it('stays on the drivers when a correction is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-dyssynchrony-patient-and-graphics');
    advance(engine, 1, 'record-dyssynchrony-correction-intent');
    expect(snapshot(engine)!.correctionAtTick).toBeNull();
    const prompt = dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('vds-drivers');
    expect(prompt.suggestion).toContain('Before you touch the settings');
  });

  it('stays on the classification when a correction is reached for after the drivers', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-dyssynchrony-patient-and-graphics');
    advance(engine, 1, 'review-dyssynchrony-drivers');
    advance(engine, 2, 'record-dyssynchrony-correction-intent');
    expect(snapshot(engine)!.correctionAtTick).toBeNull();
    expect(dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('vds-classify');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-dyssynchrony-drivers');
    expect(snapshot(engine)!.driversAtTick).toBeNull();
    expect(dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('vds-graphics');
  });

  it('never sedates, paralyses, or names a drug', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give propofol', 'paralyse him', 'give rocuronium']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(dyssynchronyInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(dyssynchronyInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(dyssynchronyInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(dyssynchronyInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
