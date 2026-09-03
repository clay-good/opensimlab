/**
 * The worked example and observed-state tutor for a treatment that has to wait,
 * and then must not stop.
 *
 * Insulin is the word that follows DKA, and here it is locked behind a
 * potassium of 3.2 mmol/L — because insulin is what moves potassium into cells.
 * The mirror of that sits at the other end: the glucose improves long before
 * the ketoacidosis clears.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DIABETIC_KETOACIDOSIS as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/diabetic-ketoacidosis';
import { DIABETIC_KETOACIDOSIS_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/diabetic-ketoacidosis-fixtures';
import {
  DIABETIC_KETOACIDOSIS_DEMONSTRATION_VERSION, diabeticKetoacidosisDemonstrationStep,
  supportsDiabeticKetoacidosisDemonstration,
} from '../../src/modules/emergency-medicine/demo/diabetic-ketoacidosis-demonstration';
import { diabeticKetoacidosisInlinePrompt } from '../../src/modules/emergency-medicine/tutor/diabetic-ketoacidosis-guidance';
import type { DiabeticKetoacidosisAction } from '../../src/modules/emergency-medicine/diabetic-ketoacidosis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.diabeticKetoacidosisAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: DiabeticKetoacidosisAction) => {
  engine.apply({ tick, type: 'diabetic-ketoacidosis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = diabeticKetoacidosisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'diabetic-ketoacidosis-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Waits For The Potassium And Then Keeps Going', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(DIABETIC_KETOACIDOSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDiabeticKetoacidosisDemonstration(SCENARIO)).toBe(true);
    expect(supportsDiabeticKetoacidosisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsDiabeticKetoacidosisDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'diabetic-ketoacidosis-boundary'),
    })).toBe(false);
  });

  it('takes all six recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['presentation', 'fluids', 'potassium', 'insulin', 'dextrose', 'transition']);
    expect(patient.presentationReviewedAtTick).toBeLessThan(patient.fluidsAtTick!);
    expect(patient.fluidsAtTick).toBeLessThan(patient.potassiumAtTick!);
    expect(patient.potassiumAtTick).toBeLessThan(patient.insulinAtTick!);
    expect(patient.insulinAtTick).toBeLessThan(patient.dextroseAtTick!);
    expect(patient.dextroseAtTick).toBeLessThan(patient.transitionAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('names the three domains and treats the kinked set as a preventable recurrence', () => {
    const presentation = narrations[beats.indexOf('presentation')]!;
    expect(presentation).toContain('rather than a high glucose on its own');
    expect(presentation).toContain('A precipitant you can name is a recurrence you can prevent');
  });

  it('says why volume precedes both drugs', () => {
    const fluids = narrations[beats.indexOf('fluids')]!;
    expect(fluids).toContain('what looks like a glucose problem is a water problem');
    expect(fluids).toContain('everything downstream is a comparison between panels');
  });

  it('says insulin here does not risk hypokalaemia but produces it', () => {
    const potassium = narrations[beats.indexOf('potassium')]!;
    expect(potassium).toContain('this is the lesson');
    expect(potassium).toContain('does not risk hypokalaemia, it produces it');
    expect(potassium).toContain('not always the first thing you may do about the patient');
  });

  it('says why an infusion rather than a bolus', () => {
    const insulin = narrations[beats.indexOf('insulin')]!;
    expect(insulin).toContain('a steady low rate suppressing ketogenesis');
    expect(insulin).toContain('the trade nobody wants in the patient you just corrected');
  });

  it('reads the interval panel as two stories at different speeds', () => {
    const dextrose = narrations[beats.indexOf('dextrose')]!;
    expect(dextrose).toContain('two separate stories that are moving at different speeds');
    expect(dextrose).toContain('the commonest way this goes wrong after the potassium');
    expect(narration).toContain('the frightening number improves first');
  });

  it('says why not the anion gap, why not urine ketones, and why the overlap', () => {
    const transition = narrations[beats.indexOf('transition')]!;
    expect(transition).toContain('hyperchloraemia from all the saline');
    expect(transition).toContain('measure the wrong ketone');
    expect(transition).toContain('the infusion has no reservoir behind it');
  });

  it('never boluses the insulin, names a rate, stops it early, or overclaims resolution', () => {
    // Guard the instruction voice, not the nouns: the lesson argues against a
    // bolus and against stopping insulin by naming both, so a bare noun match
    // would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give a bolus of insulin', 'run it at 0.1 units',
      'stop the insulin now', 'the gap has closed so', 'she is cured',
      'send her home']) {
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
      const prompt = diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['dka-presentation', 'dka-fluids', 'dka-potassium',
      'dka-insulin', 'dka-dextrose', 'dka-transition']);
  });

  it('stays on the potassium when insulin is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-dka-presentation');
    advance(engine, 1, 'record-dka-fluids-and-monitoring');
    advance(engine, 2, 'record-dka-insulin-intent');
    expect(snapshot(engine)!.insulinAtTick).toBeNull();
    const prompt = diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('dka-potassium');
    expect(prompt.suggestion).toContain('Replace it and recheck before insulin');
  });

  it('stays on the dextrose step when the transition is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-dka-presentation');
    advance(engine, 1, 'record-dka-fluids-and-monitoring');
    advance(engine, 2, 'record-dka-potassium-replacement');
    advance(engine, 3, 'record-dka-insulin-intent');
    advance(engine, 4, 'confirm-dka-resolution-and-transition');
    expect(snapshot(engine)!.transitionAtTick).toBeNull();
    expect(diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('dka-dextrose');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-dka-fluids-and-monitoring');
    expect(snapshot(engine)!.fluidsAtTick).toBeNull();
    expect(diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('dka-presentation');
  });

  it('never boluses insulin or names a rate anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give a bolus of insulin', 'run it at 0.1 units', 'stop the insulin now']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the transition', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(diabeticKetoacidosisInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.transitionAtTick).not.toBeNull();
    expect(diabeticKetoacidosisInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(diabeticKetoacidosisInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
