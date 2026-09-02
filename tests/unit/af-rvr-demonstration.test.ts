/**
 * The worked example and observed-state tutor for a rate that pulls harder
 * than it should.
 *
 * The stroke lane is the point: slowing her heart does not make it safer, and
 * the uncertain duration is what makes cardioversion a decision rather than a
 * quick fix.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { ATRIAL_FIBRILLATION_WITH_RAPID_RESPONSE as SCENARIO } from '../../src/modules/cardiology/scenarios/atrial-fibrillation-with-rapid-response';
import { AF_RVR_FIXTURES as FIXTURES } from '../../src/modules/cardiology/af-rvr-fixtures';
import {
  AF_RVR_DEMONSTRATION_VERSION, afRvrDemonstrationStep, supportsAfRvrDemonstration,
} from '../../src/modules/cardiology/demo/af-rvr-demonstration';
import { afRvrInlinePrompt } from '../../src/modules/cardiology/tutor/af-rvr-guidance';
import type { AfRvrAction } from '../../src/modules/cardiology/af-rvr';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.afRvrAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: AfRvrAction) => {
  engine.apply({ tick, type: 'af-rvr-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = afRvrDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'af-rvr-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Keeps The Stroke Lane Separate', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(AF_RVR_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsAfRvrDemonstration(SCENARIO)).toBe(true);
    expect(supportsAfRvrDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The guard asserts the opening rhythm-change event.
    expect(supportsAfRvrDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.filter((event) => event.type !== 'rhythm-change'),
    })).toBe(false);
  });

  it('reaches the reassessment through all five steps in order', () => {
    expect(beats).toEqual(['stability', 'context', 'rate', 'stroke', 'reassessment']);
    expect(patient.stabilityAtTick).toBeLessThan(patient.contextAtTick!);
    expect(patient.contextAtTick).toBeLessThan(patient.rateIntentAtTick!);
    expect(patient.rateIntentAtTick).toBeLessThan(patient.strokePreventionAtTick!);
    expect(patient.strokePreventionAtTick).toBeLessThan(patient.reassessmentAtTick!);
  });

  it('treats the absent pre-excitation as load-bearing and defines stable', () => {
    const stability = narrations[beats.indexOf('stability')]!;
    expect(stability).toContain('makes the ordinary rate-control thinking safe here rather than dangerous');
    expect(stability).toContain('Stable does not mean untreated');
    expect(patient.hemodynamicallyStable).toBe(true);
  });

  it('finds the gap between noticing and last knowing', () => {
    const context = narrations[beats.indexOf('context')]!;
    expect(context).toContain('the single most consequential fact in the consultation');
    expect(context).toContain('uncertain rather than six hours');
    expect(patient.durationCertain).toBe(false);
  });

  it('names the trap the number sets', () => {
    const rate = narrations[beats.indexOf('rate')]!;
    expect(rate).toContain('the rate is a symptom of the rhythm');
    expect(rate).toContain('You select no drug and perform no cardioversion');
    expect(patient.treatmentDelivered).toBe(false);
  });

  it('says a slower rate is the same atrium', () => {
    const stroke = narrations[beats.indexOf('stroke')]!;
    expect(stroke).toContain('a more comfortable patient with exactly the same atrium');
    expect(stroke).toContain('not by whether she now feels better');
    expect(patient.exactScoreCalculated).toBe(false);
  });

  it('reads the lower rate as a rate response and nothing more', () => {
    const reassessment = narrations[beats.indexOf('reassessment')]!;
    expect(reassessment).toContain('a rate response is not a resolved rhythm');
    expect(narration).toContain('her atrium is unchanged');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never names an agent, a target, a score, or a cardioversion', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['give metoprolol', 'give diltiazem', 'start apixaban', 'her chads', 'target a rate below', 'cardiovert her']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Enforces Duration Before Rate', () => {
  const V = '0.1.0';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = afRvrInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['af-stability', 'af-context', 'af-rate', 'af-stroke', 'af-reassessment']);
  });

  it('stays on the context when rate intent is attempted first', () => {
    const engine = create();
    advance(engine, 0, 'reconcile-af-rvr-rhythm-and-stability');
    advance(engine, 1, 'record-af-rvr-rate-control-intent');
    expect(snapshot(engine)!.rateIntentAtTick).toBeNull();
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    const prompt = afRvrInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('af-context');
    expect(prompt.suggestion).toContain('find out how long this has been going on');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'review-af-rvr-context-and-triggers');
    expect(snapshot(engine)!.stabilityAtTick).toBeNull();
    expect(snapshot(engine)!.contextAtTick).toBeNull();
    expect(afRvrInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('af-stability');
  });

  it('never names an agent, a score, or a cardioversion', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = afRvrInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['give metoprolol', 'start apixaban', 'her chads', 'cardiovert her']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after reassessment', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(afRvrInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(afRvrInlinePrompt('guided', { scenarioVersion: '0.1.1', patient })).toBeNull();
    expect(afRvrInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.reassessmentAtTick).not.toBeNull();
    expect(afRvrInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(afRvrInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
