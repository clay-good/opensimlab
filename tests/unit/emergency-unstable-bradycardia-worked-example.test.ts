/**
 * The worked example and observed-state tutor for a number that is only a
 * finding in context.
 *
 * A rate of 38 is not an emergency; a rate of 38 with a pressure of 78/46 and a
 * drowsy patient is. The engine gates the atropine behind the support bundle,
 * because hypoxia causes bradycardia and this patient is at 91% on room air.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNSTABLE_BRADYCARDIA as SCENARIO } from '../../src/modules/emergency-medicine/scenarios/unstable-bradycardia';
import { UNSTABLE_BRADYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/emergency-medicine/unstable-bradycardia-fixtures';
import {
  UNSTABLE_BRADYCARDIA_DEMONSTRATION_VERSION, unstableBradycardiaDemonstrationStep,
  supportsUnstableBradycardiaDemonstration,
} from '../../src/modules/emergency-medicine/demo/unstable-bradycardia-demonstration';
import { unstableBradycardiaInlinePrompt } from '../../src/modules/emergency-medicine/tutor/unstable-bradycardia-guidance';
import type { UnstableBradycardiaAction } from '../../src/modules/emergency-medicine/unstable-bradycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.unstableBradycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: UnstableBradycardiaAction) => {
  engine.apply({ tick, type: 'unstable-bradycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = []; const events: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = unstableBradycardiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration, events };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'unstable-bradycardia-response', payload: { action: step.action } });
    for (const event of engine.step().events) events.push(event.eventId);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Treats The Compromise, Not The Number', () => {
  const { beats, narrations, patient, narration, events } = runDemonstration();
  const everything = `${narrations.join(' ')} ${narration}`;

  it('binds to this exact scenario version and no other', () => {
    expect(UNSTABLE_BRADYCARDIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnstableBradycardiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnstableBradycardiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsUnstableBradycardiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all four recorded steps in the only order the engine accepts', () => {
    expect(beats).toEqual(['review', 'support', 'atropine', 'reassess']);
    expect(patient.reviewedAtTick).toBeLessThan(patient.supportedAtTick!);
    expect(patient.supportedAtTick).toBeLessThan(patient.atropineAtTick!);
    expect(patient.atropineAtTick).toBeLessThan(patient.reassessedAtTick!);
    expect(events.some((eventId) => /refused/.test(eventId))).toBe(false);
  });

  it('says the same number is normal in a sleeping athlete', () => {
    const review = narrations[beats.indexOf('review')]!;
    expect(review).toContain('a sleeping endurance athlete');
    expect(review).toContain('the treatment for the next two minutes is the same either way');
  });

  it('gives a better reason for the support gate than order', () => {
    const support = narrations[beats.indexOf('support')]!;
    expect(support).toContain('this is not the preamble to the drug');
    expect(support).toContain('hypoxia is itself a cause of bradycardia');
    expect(support).toContain('costs preload he cannot spare');
    expect(narration).toContain('the oxygen may have been treating the rhythm rather than accompanying it');
  });

  it('says what the atropine buys and when it fails', () => {
    const atropine = narrations[beats.indexOf('atropine')]!;
    expect(atropine).toContain('a holding measure rather than a cure');
    expect(atropine).toContain('unreliable when the block is below the node');
  });

  it('reads the good panel through mentation and skin, and refuses to stop', () => {
    const reassess = narrations[beats.indexOf('reassess')]!;
    expect(reassess).toContain('the heart rate is only the mechanism');
    expect(reassess).toContain('the thing not to take from a good panel is permission to stop');
  });

  it('never gives the drug first, ventilates him, names a cause, or calls it resolved', () => {
    // Guard the instruction voice, not the nouns: the lesson names atropine and
    // ventilation precisely in order to bound them, so a bare noun match would
    // fail on the lesson's own point.
    const text = everything.toLowerCase();
    for (const forbidden of ['give the atropine first', 'bag him', 'start ventilating him',
      'this is complete heart block', 'the cause is', 'the bradycardia is resolved',
      'he can be discharged']) {
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
      const prompt = unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['brady-review', 'brady-support', 'brady-atropine', 'brady-reassess']);
  });

  it('stays on the support bundle when the drug is reached for first', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-bradycardia-and-compromise');
    advance(engine, 1, 'record-atropine-intent');
    expect(snapshot(engine)!.atropineAtTick).toBeNull();
    const prompt = unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('brady-support');
    expect(prompt.suggestion).toContain('this is not the preamble to the drug');
  });

  it('stays on the reassessment while the engine clock has not moved on', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-bradycardia-and-compromise');
    advance(engine, 1, 'record-bradycardia-support');
    engine.apply({ tick: 2, type: 'unstable-bradycardia-response', payload: { action: 'record-atropine-intent' } });
    engine.apply({ tick: 2, type: 'unstable-bradycardia-response', payload: { action: 'reassess-bradycardia-response' } });
    engine.step();
    expect(snapshot(engine)!.reassessedAtTick).toBeNull();
    expect(unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('brady-reassess');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'record-bradycardia-support');
    expect(snapshot(engine)!.supportedAtTick).toBeNull();
    expect(unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('brady-review');
  });

  it('never ventilates him or names a cause anywhere on the recovery path', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['bag him', 'start ventilating him', 'this is complete heart block']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(unstableBradycardiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(unstableBradycardiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessedAtTick).not.toBeNull();
    expect(unstableBradycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(unstableBradycardiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
