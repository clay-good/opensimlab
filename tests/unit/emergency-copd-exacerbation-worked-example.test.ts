/**
 * The worked example and observed-state tutor for a patient in whom oxygen has
 * a ceiling — and in whom that ceiling reaches into the nebuliser.
 *
 * The four initial treatments are unordered, so the example only ever passes
 * through the beat for the state where none of them has been recorded. The
 * claim lives there, and the assertions below check it on the joined narration.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { COPD_EXACERBATION as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/copd-exacerbation';
import { COPD_EXACERBATION_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/copd-exacerbation-fixtures';
import {
  COPD_EXACERBATION_DEMONSTRATION_VERSION, copdExacerbationDemonstrationStep,
  supportsCopdExacerbationDemonstration,
} from '../../src/modules/emergency-medicine/demo/copd-exacerbation-demonstration';
import { copdExacerbationInlinePrompt } from '../../src/modules/emergency-medicine/tutor/copd-exacerbation-guidance';
import type { CopdExacerbationAction } from '../../src/modules/emergency-medicine/copd-exacerbation';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.copdExacerbationAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: CopdExacerbationAction) => {
  engine.apply({ tick, type: 'copd-exacerbation-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = copdExacerbationDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'copd-exacerbation-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats The Nebuliser Gas As A Dose', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(COPD_EXACERBATION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsCopdExacerbationDemonstration(SCENARIO)).toBe(true);
    expect(supportsCopdExacerbationDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsCopdExacerbationDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'obstruction'),
    })).toBe(false);
  });

  it('takes all six recorded steps without a refusal', () => {
    expect(beats).toEqual(['severity', 'oxygen', 'bronchodilator', 'corticosteroid', 'antibiotic', 'reassess']);
    expect(patient.severityReviewedAtTick).toBeLessThan(patient.controlledOxygenAtTick!);
    expect(patient.controlledOxygenAtTick).toBeLessThan(patient.bronchodilatorBundleAtTick!);
    expect(patient.corticosteroidIntentAtTick).toBeLessThan(patient.antibioticIntentAtTick!);
    expect(patient.antibioticIntentAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('reads a nearly normal pH beside a raised carbon dioxide as chronic', () => {
    const severity = narrations[beats.indexOf('severity')]!;
    expect(severity).toContain('the kidneys have had time');
    expect(severity).toContain('this is chronic and not an hour old');
  });

  it('carries the load-bearing claim on the path the example actually takes', () => {
    // The lanes are unordered, so the per-lane oxygen beat is never reached
    // here. The claim has to survive on the "none of the four yet" beat.
    expect(beats).not.toContain('copd-oxygen');
    expect(everything).toContain('They are unordered on purpose');
    expect(everything).toContain('a nebuliser driven by wall oxygen is an oxygen delivery device that nobody wrote a target for');
    expect(everything).toContain('The gas carrying the drug is itself a dose');
  });

  it('says what to do if he needs oxygen during the treatment', () => {
    const bronchodilator = narrations[beats.indexOf('bronchodilator')]!;
    expect(bronchodilator).toContain('keeps the bronchodilator decision separate from the oxygen decision');
    expect(bronchodilator).toContain('nasal cannula underneath');
  });

  it('says why five days and why not tapering', () => {
    const corticosteroid = narrations[beats.indexOf('corticosteroid')]!;
    expect(corticosteroid).toContain('Five, not ten and not tapering');
    expect(corticosteroid).toContain('a habit rather than a pharmacological requirement');
  });

  it('names the antibiotic after its indication rather than a drug', () => {
    const antibiotic = narrations[beats.indexOf('antibiotic')]!;
    expect(antibiotic).toContain('Not every exacerbation earns one');
    expect(antibiotic).toContain('treated for something a subset has');
  });

  it('says the number that decides ventilatory support is the pH', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the pH rather than the carbon dioxide');
    expect(reassess).toContain('authored rather than modelled');
    expect(narration).toContain('driven by air rather than by the wall');
  });

  it('never runs the nebuliser on oxygen, opens the flowmeter, names an agent, or calls it fixed', () => {
    // Guard the instruction voice, not the nouns: the lesson argues about wall
    // oxygen and about antibiotics by naming them, so a bare noun match would
    // fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['drive the nebuliser with oxygen', 'run it at 15 l',
      'oxygen wide open', 'start amoxicillin', 'give doxycycline',
      'his gas has normalised', 'he can be discharged']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds The Two Gates And Nothing Else', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['copd-severity', 'copd-initial', 'copd-bronchodilator',
      'copd-corticosteroid', 'copd-antibiotic', 'copd-reassess']);
  });

  it('reaches the per-lane oxygen beat only when a learner treats out of the example order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-severity-and-mimics');
    advance(engine, 1, 'give-air-driven-bronchodilators');
    const prompt = copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('copd-oxygen');
    expect(prompt.because).toContain('a saturation that looks better and a pH that is falling');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-severity-and-mimics');
    advance(engine, 1, 'record-controlled-oxygen');
    advance(engine, 2, 'give-air-driven-bronchodilators');
    advance(engine, 3, 'record-five-day-corticosteroid-intent');
    engine.apply({ tick: 4, type: 'copd-exacerbation-response', payload: { action: 'record-antibiotic-indication' } });
    engine.apply({ tick: 4, type: 'copd-exacerbation-response', payload: { action: 'reassess-and-review-ventilatory-support' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('copd-reassess');
  });

  it('does not move on when a treatment is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-antibiotic-indication');
    expect(snapshot(engine)!.antibioticIntentAtTick).toBeNull();
    expect(copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('copd-severity');
  });

  it('never names an agent or opens the flowmeter anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['drive the nebuliser with oxygen', 'start amoxicillin', 'run it at 15 l']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(copdExacerbationInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(copdExacerbationInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(copdExacerbationInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(copdExacerbationInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
