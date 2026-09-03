/**
 * The worked example and observed-state tutor for three treatments that are not
 * a ranked list.
 *
 * One of the three is the word most people have filed under "pulmonary edema",
 * and it is the slowest of the three at what the next few minutes need. Because
 * the lanes are unordered, the example only ever passes through the beat for
 * the state where none of them has been recorded — so that is where the claim
 * lives, and the assertions below check it on the joined narration.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ACUTE_PULMONARY_EDEMA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/acute-pulmonary-edema';
import { ACUTE_PULMONARY_EDEMA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/acute-pulmonary-edema-fixtures';
import {
  ACUTE_PULMONARY_EDEMA_DEMONSTRATION_VERSION, acutePulmonaryEdemaDemonstrationStep,
  supportsAcutePulmonaryEdemaDemonstration,
} from '../../src/modules/emergency-medicine/demo/acute-pulmonary-edema-demonstration';
import { acutePulmonaryEdemaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/acute-pulmonary-edema-guidance';
import type { AcutePulmonaryEdemaAction } from '../../src/modules/emergency-medicine/acute-pulmonary-edema';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.acutePulmonaryEdemaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AcutePulmonaryEdemaAction) => {
  engine.apply({ tick, type: 'acute-pulmonary-edema-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = acutePulmonaryEdemaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'acute-pulmonary-edema-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Shows Three Treatments Without A Rank', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(ACUTE_PULMONARY_EDEMA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAcutePulmonaryEdemaDemonstration(SCENARIO)).toBe(true);
    expect(supportsAcutePulmonaryEdemaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsAcutePulmonaryEdemaDemonstration({ ...SCENARIO, timeline: [] })).toBe(false);
  });

  it('takes the fastest treatment first and the most familiar last', () => {
    expect(beats).toEqual(['pattern', 'support', 'vasodilator', 'diuretic', 'reassess']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.nivAtTick!);
    expect(patient.nivAtTick).toBeLessThan(patient.vasodilatorIntentAtTick!);
    expect(patient.vasodilatorIntentAtTick).toBeLessThan(patient.diureticIntentAtTick!);
    expect(patient.diureticIntentAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('reads the pressure as part of the picture rather than beside it', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('the part that explains the rest');
    expect(pattern).toContain('What it does not rule out is a precipitant');
  });

  it('carries the load-bearing claim on the path the example actually takes', () => {
    // The lanes are unordered, so the per-lane NIV beat is never reached here.
    // The claim has to survive on the "none of the three yet" beat.
    expect(beats).not.toContain('niv');
    expect(everything).toContain('They are unordered on purpose');
    expect(everything).toContain('a redistribution picture rather than a slow accumulation of litres');
    expect(everything).toContain('it is the slowest at the thing the next few minutes need');
    expect(everything).toContain('recording it does not buy you the other two');
  });

  it('names the systolic that makes the vasodilator recordable here', () => {
    const vasodilator = narrations[beats.indexOf('vasodilator')]!;
    expect(vasodilator).toContain('comfortably above 110');
    expect(vasodilator).toContain('the same problem seen from the other end');
  });

  it('is honest about when the diuretic starts to matter', () => {
    const diuretic = narrations[beats.indexOf('diuretic')]!;
    expect(diuretic).toContain('natriuresis takes time to matter');
    expect(diuretic).toContain('the reason a patient looks the same twenty minutes later');
  });

  it('says why the reassessment waits, and that the numbers are authored', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('reading a decision as a result');
    expect(reassess).toContain('authored, not modelled');
    expect(narration).toContain('none of the three waiting on another');
  });

  it('never sets up the interface, names a dose, titrates, or claims it worked', () => {
    // Guard the instruction voice, not the nouns: the lesson names positive
    // pressure, a diuretic and a vasodilator as recorded intents, so a bare
    // noun match would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['set the mask to', 'give 40 mg', 'start the infusion at',
      'titrate the drip to', 'her lungs have cleared', 'the edema has resolved',
      'she can go to the ward']) {
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
      const prompt = acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['ape-pattern', 'ape-initial', 'ape-vasodilator', 'ape-diuretic', 'ape-reassess']);
  });

  it('reaches the per-lane support beat only when a learner treats out of the example order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-pattern-mimics-and-precipitants');
    advance(engine, 1, 'record-loop-diuretic-intent');
    const prompt = acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('ape-niv');
    expect(prompt.because).toContain('the shortest interval between recording it and the patient looking different');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-pattern-mimics-and-precipitants');
    advance(engine, 1, 'record-niv-and-titrated-oxygen');
    advance(engine, 2, 'record-vasodilator-intent');
    engine.apply({ tick: 3, type: 'acute-pulmonary-edema-response', payload: { action: 'record-loop-diuretic-intent' } });
    engine.apply({ tick: 3, type: 'acute-pulmonary-edema-response', payload: { action: 'reassess-breathing-pressure-and-perfusion' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ape-reassess');
  });

  it('does not move on when a treatment is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-vasodilator-intent');
    expect(snapshot(engine)!.vasodilatorIntentAtTick).toBeNull();
    expect(acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('ape-pattern');
  });

  it('never sets up a device or names a dose anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(5);
    for (const text of seen) {
      for (const forbidden of ['set the mask to', 'give 40 mg', 'start the infusion at']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(acutePulmonaryEdemaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(acutePulmonaryEdemaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(acutePulmonaryEdemaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
