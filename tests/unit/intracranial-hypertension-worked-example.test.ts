/**
 * The worked example and observed-state tutor for a number with a famous
 * treatment attached.
 *
 * The lesson is the order. A head turned 10° off neutral is a partly obstructed
 * jugular, and no amount of hypertonic saline opens it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { INTRACRANIAL_HYPERTENSION as SCENARIO } from '../../src/modules/critical-care/scenarios/intracranial-hypertension';
import { INTRACRANIAL_HYPERTENSION_FIXTURES as FIXTURES } from '../../src/modules/critical-care/intracranial-hypertension-fixtures';
import {
  INTRACRANIAL_HYPERTENSION_DEMONSTRATION_VERSION, intracranialHypertensionDemonstrationStep,
  supportsIntracranialHypertensionDemonstration,
} from '../../src/modules/critical-care/demo/intracranial-hypertension-demonstration';
import { intracranialHypertensionInlinePrompt } from '../../src/modules/critical-care/tutor/intracranial-hypertension-guidance';
import type { IntracranialHypertensionAction } from '../../src/modules/critical-care/intracranial-hypertension';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.intracranialHypertensionAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: IntracranialHypertensionAction) => {
  engine.apply({ tick, type: 'intracranial-hypertension-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = intracranialHypertensionDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'intracranial-hypertension-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Does The Free Things First', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(INTRACRANIAL_HYPERTENSION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsIntracranialHypertensionDemonstration(SCENARIO)).toBe(true);
    expect(supportsIntracranialHypertensionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsIntracranialHypertensionDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.target !== 'intracranial-hypertension-boundary'),
    })).toBe(false);
  });

  it('takes all five recorded steps in the only order the engine accepts', () => {
    expect(SCENARIO.metadata.objectives).toHaveLength(5);
    expect(beats).toEqual(['recognize', 'context', 'protect', 'rescue', 'reassess']);
    expect(patient.recognitionAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.protectionAtTick!);
    expect(patient.protectionAtTick).toBeLessThan(patient.rescueAtTick!);
    expect(patient.rescueAtTick).toBeLessThan(patient.reassessmentAtTick!);
    expect(events.some((eventId) => /order-refused/.test(eventId))).toBe(false);
  });

  it('reads the pair rather than the number', () => {
    const recognize = narrations[beats.indexOf('recognize')]!;
    expect(recognize).toContain('the figure the brain actually experiences');
    expect(recognize).toContain('a pattern rather than a transient');
  });

  it('checks the monitor before treating what it says', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('a wrong number is treated exactly as enthusiastically as a right one');
    expect(context).toContain('two of those findings are things you can change without a drug');
  });

  it('names the mechanical problem osmotherapy cannot fix', () => {
    const protect = narrations[beats.indexOf('protect')]!;
    expect(protect).toContain('a partly obstructed drainage route that osmotherapy will not open');
    expect(protect).toContain('without buying brain');
    expect(protect).toContain('a good number out of a worse brain');
  });

  it('states the lean without turning it into a rule', () => {
    const rescue = narrations[beats.indexOf('rescue')]!;
    expect(rescue).toContain('there is a lean, and it is not a rule');
    expect(rescue).toContain('inputs to that decision rather than a green light');
  });

  it('calls fifteen minutes a start rather than a result', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the immediate physiology answering');
    expect(narration).toContain('the order is the point');
  });

  it('never names an agent dose, sets a target, or claims durable control', () => {
    // Guard the instruction voice, not the nouns: beats exist to say control is
    // NOT proven durable, so a bare noun match would fail on the lesson's own point.
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 250 ml of 3%', 'give mannitol 1 g/kg', 'set the etco2 to 30',
      'sit him up to 30', 'control is now durable', 'he will recover']) {
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
      const prompt = intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ich-recognize', 'ich-context', 'ich-protect', 'ich-rescue', 'ich-reassess']);
  });

  it('stays on the context when protection is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-intracranial-hypertension');
    advance(engine, 1, 'activate-first-tier-brain-protection');
    expect(snapshot(engine)!.protectionAtTick).toBeNull();
    const prompt = intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ich-context');
    expect(prompt.suggestion).toContain('ask whether something is causing it');
  });

  it('stays on protection when the osmotherapy is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'recognize-intracranial-hypertension');
    advance(engine, 1, 'review-intracranial-hypertension-context');
    advance(engine, 2, 'activate-individualized-hyperosmolar-rescue');
    expect(snapshot(engine)!.rescueAtTick).toBeNull();
    expect(intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ich-protect');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-intracranial-hypertension-context');
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ich-recognize');
  });

  it('never names a dose or a ventilator target anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['give 250 ml of 3%', 'give mannitol 1 g/kg', 'set the etco2 to 30']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(intracranialHypertensionInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(intracranialHypertensionInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(intracranialHypertensionInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(intracranialHypertensionInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
