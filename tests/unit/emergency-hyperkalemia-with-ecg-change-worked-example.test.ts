/**
 * The worked example and observed-state tutor for a tracing that improves while
 * the chemistry does not.
 *
 * Calcium changes the electrocardiogram without changing the potassium, so the
 * most reassuring event in the next few minutes is also the least informative.
 * The four lanes after the calcium are unordered, so that claim lives in the
 * beat for the state where none of them has been recorded — the assertions
 * below check it on the joined narration.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { HYPERKALEMIA_WITH_ECG_CHANGE as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/hyperkalemia-with-ecg-change';
import { HYPERKALEMIA_WITH_ECG_CHANGE_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/hyperkalemia-with-ecg-change-fixtures';
import {
  HYPERKALEMIA_WITH_ECG_CHANGE_DEMONSTRATION_VERSION, hyperkalemiaWithEcgChangeDemonstrationStep,
  supportsHyperkalemiaWithEcgChangeDemonstration,
} from '../../src/modules/emergency-medicine/demo/hyperkalemia-with-ecg-change-demonstration';
import { hyperkalemiaWithEcgChangeInlinePrompt } from '../../src/modules/emergency-medicine/tutor/hyperkalemia-with-ecg-change-guidance';
import type { HyperkalemiaWithEcgChangeAction } from '../../src/modules/emergency-medicine/hyperkalemia-with-ecg-change';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.hyperkalemiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: HyperkalemiaWithEcgChangeAction) => {
  engine.apply({ tick, type: 'hyperkalemia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = hyperkalemiaWithEcgChangeDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'hyperkalemia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Separates The Tracing From The Chemistry', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(HYPERKALEMIA_WITH_ECG_CHANGE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHyperkalemiaWithEcgChangeDemonstration(SCENARIO)).toBe(true);
    expect(supportsHyperkalemiaWithEcgChangeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHyperkalemiaWithEcgChangeDemonstration({
      ...SCENARIO,
      timeline: SCENARIO.timeline.filter((event) => event.target !== 'hyperkalemia-with-ecg-change-boundary'),
    })).toBe(false);
  });

  it('takes all seven recorded steps without a refusal', () => {
    expect(beats).toEqual(['pattern', 'calcium', 'ecg', 'insulin', 'beta', 'removal', 'reassess']);
    expect(patient.patternReviewedAtTick).toBeLessThan(patient.calciumAtTick!);
    expect(patient.calciumAtTick).toBeLessThan(patient.postCalciumEcgAtTick!);
    expect(patient.removalAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('names trimethoprim as a potassium-sparing diuretic wearing an antibiotic label', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('the order it always fails in');
    expect(pattern).toContain('a potassium-sparing diuretic wearing an antibiotic label');
  });

  it('says calcium removes not one millimole', () => {
    const calcium = narrations[beats.indexOf('calcium')]!;
    expect(calcium).toContain('Not one millimole leaves the body');
    expect(calcium).toContain('a record of a decision rather than a drug going in');
  });

  it('carries the load-bearing pairing on the path the example actually takes', () => {
    // The four lanes are unordered, so the per-lane ECG beat is never reached
    // here. The claim has to survive on the "none of the four yet" beat.
    expect(beats).not.toContain('hyk-ecg');
    expect(everything).toContain('three different jobs and only one of them lowers the total');
    expect(everything).toContain('a loan rather than a payment');
    expect(everything).toContain('the tracing improved and the chemistry did not move at all');
  });

  it('makes the glucose surveillance part of the insulin order', () => {
    const insulin = narrations[beats.indexOf('insulin')]!;
    expect(insulin).toContain('after the team that gave it has moved on');
    expect(insulin).toContain('chronic kidney disease slows insulin clearance');
  });

  it('keeps the beta-agonist an adjunct', () => {
    const beta = narrations[beats.indexOf('beta')]!;
    expect(beta).toContain('only as an adjunct');
    expect(beta).toContain('the version of this that ends badly');
  });

  it('names the two prescriptions that can be stopped in the department', () => {
    const removal = narrations[beats.indexOf('removal')]!;
    expect(removal).toContain('Hold the lisinopril and hold the trimethoprim');
    expect(removal).toContain('treating an episode and preventing the next one');
  });

  it('reads the one-hour fall as potassium sitting inside cells on a promise', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('sitting inside cells on a promise');
    expect(narration).toContain('the QRS came back from 140 ms to 104 ms while the potassium stayed at exactly 7.1');
  });

  it('never claims the potassium fell after calcium, or that the beta-agonist is enough', () => {
    // Guard the instruction voice, not the nouns: the lesson names calcium and
    // the beta-agonist precisely in order to bound them, so a bare noun match
    // would fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['the calcium lowered the potassium', 'the potassium is coming down after calcium',
      'salbutamol alone is enough', 'i can see the peaked t waves', 'give 10 ml of calcium',
      'the hyperkalaemia is treated', 'he can go home']) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Holds Both Gates And Both Clocks', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['hyk-pattern', 'hyk-calcium', 'hyk-lanes', 'hyk-insulin',
      'hyk-beta', 'hyk-removal', 'hyk-reassess']);
  });

  it('reaches the per-lane ECG beat only when a learner takes another lane first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hyperkalemia-pattern');
    advance(engine, 1, 'record-hyperkalemia-calcium-intent');
    advance(engine, 2, 'record-hyperkalemia-insulin-glucose');
    const prompt = hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('hyk-ecg');
    expect(prompt.because).toContain('A tracing that has stopped shouting');
  });

  it('stays on the calcium when a lane is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hyperkalemia-pattern');
    advance(engine, 1, 'record-hyperkalemia-beta-agonist');
    expect(snapshot(engine)!.betaAgonistAtTick).toBeNull();
    expect(hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hyk-calcium');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-hyperkalemia-pattern');
    advance(engine, 1, 'record-hyperkalemia-calcium-intent');
    advance(engine, 2, 'review-hyperkalemia-post-calcium-ecg');
    advance(engine, 3, 'record-hyperkalemia-insulin-glucose');
    advance(engine, 4, 'record-hyperkalemia-beta-agonist');
    engine.apply({ tick: 5, type: 'hyperkalemia-response', payload: { action: 'record-hyperkalemia-removal-and-cause-control' } });
    engine.apply({ tick: 5, type: 'hyperkalemia-response', payload: { action: 'reassess-hyperkalemia' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hyk-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-hyperkalemia-calcium-intent');
    expect(snapshot(engine)!.calciumAtTick).toBeNull();
    expect(hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('hyk-pattern');
  });

  it('never claims a post-calcium potassium fall anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(7);
    for (const text of seen) {
      for (const forbidden of ['the calcium lowered the potassium', 'salbutamol alone is enough', 'give 10 ml of calcium']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(hyperkalemiaWithEcgChangeInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(hyperkalemiaWithEcgChangeInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(hyperkalemiaWithEcgChangeInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
