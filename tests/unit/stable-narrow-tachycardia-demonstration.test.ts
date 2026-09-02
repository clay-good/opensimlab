/**
 * The worked example and observed-state tutor for a ladder taken one rung at
 * a time.
 *
 * The beat that matters most is the one with no objective attached to it: the
 * honest look at whether the maneuver worked.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { REGULAR_NARROW_COMPLEX_TACHYCARDIA as SCENARIO } from '../../src/modules/cardiology/scenarios/regular-narrow-complex-tachycardia';
import { STABLE_NARROW_TACHYCARDIA_FIXTURES as FIXTURES } from '../../src/modules/cardiology/stable-narrow-tachycardia-fixtures';
import {
  STABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION, stableNarrowTachycardiaDemonstrationStep,
  supportsStableNarrowTachycardiaDemonstration,
} from '../../src/modules/cardiology/demo/stable-narrow-tachycardia-demonstration';
import { stableNarrowTachycardiaInlinePrompt } from '../../src/modules/cardiology/tutor/stable-narrow-tachycardia-guidance';
import type { StableNarrowTachycardiaAction } from '../../src/modules/cardiology/stable-narrow-tachycardia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.stableNarrowTachycardiaAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: StableNarrowTachycardiaAction) => {
  engine.apply({ tick, type: 'stable-narrow-tachycardia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = stableNarrowTachycardiaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'stable-narrow-tachycardia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Looks Before It Escalates', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(STABLE_NARROW_TACHYCARDIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsStableNarrowTachycardiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsStableNarrowTachycardiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsStableNarrowTachycardiaDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('takes all six recorded steps, one more than there are objectives', () => {
    expect(beats).toEqual(['stability', 'context', 'vagal', 'vagalResponse', 'adenosine', 'reassessment']);
    expect(patient.stabilityAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.vagalAtTick!);
    expect(patient.vagalAtTick).toBeLessThan(patient.vagalResponseAtTick!);
    expect(patient.vagalResponseAtTick).toBeLessThan(patient.adenosineAtTick!);
    expect(patient.adenosineAtTick).toBeLessThan(patient.reassessmentAtTick!);
  });

  it('names what would collapse the ladder', () => {
    const stability = narrations[beats.indexOf('stability')]!;
    expect(stability).toContain('does not establish one mechanism');
    expect(stability).toContain('becomes immediate synchronized-cardioversion capability');
    expect(patient.hemodynamicallyStable).toBe(true);
  });

  it('treats monitored readiness as the easily implicit part', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('the part that is easy to leave implicit');
    expect(context).toContain('but because what follows it might be');
  });

  it('insists the maneuver is coached rather than mentioned', () => {
    const vagal = narrations[beats.indexOf('vagal')]!;
    expect(vagal).toContain('not asking a patient to bear down and calling it attempted');
    expect(vagal).toContain('the one most often skipped or done badly');
  });

  it('makes the observation its own beat and says why', () => {
    const vagalResponse = narrations[beats.indexOf('vagalResponse')]!;
    expect(vagalResponse).toContain('an attempted maneuver and an observed response are different things');
    expect(vagalResponse).toContain('a drug nobody established they needed');
    expect(vagalResponse).toContain('abandoned after a token attempt');
  });

  it('explains why readiness is not a formality', () => {
    const adenosine = narrations[beats.indexOf('adenosine')]!;
    expect(adenosine).toContain('transient asystolic pause that is expected and alarming');
    expect(adenosine).toContain('diagnostic information you only get once');
    expect(patient.treatmentDelivered).toBe(false);
  });

  it('converts the rhythm without explaining it', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('not a rhythm that has been explained');
    expect(reassessment).toContain('a pattern rather than an event');
    expect(patient.mechanismProven).toBe(false);
    expect(narration).toContain('nobody knows the mechanism');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never names a dose, performs a maneuver, or claims a mechanism', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give 6 mg', 'give 12 mg', 'this is avnrt', 'i performed the valsalva', 'cardiovert her', 'refer for ablation']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Has A Beat For The Unchecked Maneuver', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['snt-stability', 'snt-context', 'snt-vagal', 'snt-vagal-response', 'snt-adenosine', 'snt-reassessment']);
  });

  it('stays on the observation when the drug is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 3)) advance(engine, tick, action);
    advance(engine, 3, 'record-stable-regular-narrow-adenosine-intent');
    expect(snapshot(engine)!.adenosineAtTick).toBeNull();
    expect(snapshot(engine)!.vagalResponseAtTick).toBeNull();
    const prompt = stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('snt-vagal-response');
    expect(prompt.suggestion).toContain('Do not assume either answer');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-stable-regular-narrow-context');
    expect(snapshot(engine)!.stabilityAtTick).toBeNull();
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('snt-stability');
  });

  it('holds the vagal-response time gate', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    engine.apply({ tick: 2, type: 'stable-narrow-tachycardia-response', payload: { action: 'record-stable-regular-narrow-vagal-intent' } });
    engine.apply({ tick: 2, type: 'stable-narrow-tachycardia-response', payload: { action: 'review-stable-regular-narrow-vagal-response' } });
    engine.step();
    expect(snapshot(engine)!.vagalAtTick).not.toBeNull();
    expect(snapshot(engine)!.vagalResponseAtTick).toBeNull();
    expect(stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('snt-vagal-response');
  });

  it('never names a dose or a mechanism', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give 6 mg', 'this is avnrt', 'cardiovert her', 'refer for ablation']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(stableNarrowTachycardiaInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(stableNarrowTachycardiaInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(stableNarrowTachycardiaInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
