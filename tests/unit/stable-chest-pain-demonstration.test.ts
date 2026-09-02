/**
 * The worked example and observed-state tutor for a calm visit.
 *
 * The first cardiology lesson to carry either. Its failure modes are a word,
 * a number and a reflex, and the example has to refuse all three without
 * making the consultation sound urgent.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { STABLE_CHEST_PAIN_EVALUATION as SCENARIO } from '../../src/modules/cardiology/scenarios/stable-chest-pain-evaluation';
import { STABLE_CHEST_PAIN_FIXTURES as FIXTURES } from '../../src/modules/cardiology/stable-chest-pain-fixtures';
import {
  STABLE_CHEST_PAIN_DEMONSTRATION_VERSION, stableChestPainDemonstrationStep,
  supportsStableChestPainDemonstration,
} from '../../src/modules/cardiology/demo/stable-chest-pain-demonstration';
import { stableChestPainInlinePrompt } from '../../src/modules/cardiology/tutor/stable-chest-pain-guidance';
import type { StableChestPainAction } from '../../src/modules/cardiology/stable-chest-pain';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.stableChestPainAssessment;
const advance = (engine: AnesthesiaEngine, tick: number, action: StableChestPainAction) => {
  engine.apply({ tick, type: 'stable-chest-pain-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 5_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = stableChestPainDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'stable-chest-pain-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Estimates Before It Investigates', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(STABLE_CHEST_PAIN_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsStableChestPainDemonstration(SCENARIO)).toBe(true);
    // The scenario is at 0.1.1; the example binds to that rather than to the
    // 0.1.0 every other module happened to be on.
    expect(SCENARIO.metadata.version).toBe('0.1.1');
    expect(supportsStableChestPainDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
    expect(supportsStableChestPainDemonstration({
      ...SCENARIO, timeline: SCENARIO.timeline.slice(0, 1),
    })).toBe(false);
  });

  it('reaches the safety net through all five recorded steps in order', () => {
    expect(beats).toEqual(['stability', 'pattern', 'likelihood', 'testing', 'safetyNet']);
    expect(patient.stabilityAtTick).toBeLessThan(patient.patternAtTick!);
    expect(patient.patternAtTick).toBeLessThan(patient.likelihoodAtTick!);
    expect(patient.likelihoodAtTick).toBeLessThan(patient.testingAtTick!);
    expect(patient.testingAtTick).toBeLessThan(patient.safetyNetAtTick!);
  });

  it('treats stable as a trajectory and states the triggers while the room is calm', () => {
    const stability = narrations[beats.indexOf('stability')]!;
    expect(stability).toContain('a description of a trajectory rather than a judgement about danger');
    expect(stability).toContain('while the room is calm');
  });

  it('refuses the word atypical by name and says why', () => {
    const pattern = narrations[beats.indexOf('pattern')]!;
    expect(pattern).toContain('Do not reach for the word "atypical"');
    expect(pattern).toContain('it performs worse in women');
    expect(pattern).toContain('dropped from contemporary guidance');
  });

  it('keeps the likelihood a band and names the resting ECG trap', () => {
    const likelihood = narrations[beats.indexOf('likelihood')]!;
    expect(likelihood).toContain('routinely over-read as reassurance');
    expect(likelihood).toContain('a band and not a percentage');
    expect(patient.clinicalLikelihood).toBe('not-very-low');
    expect(patient.exactScoreCalculated).toBe(false);
  });

  it('makes the choice shared and local rather than universal', () => {
    const testing = narrations[beats.indexOf('testing')]!;
    expect(testing).toContain('there is no universal right modality here');
    expect(testing).toContain('performed badly nearby is not the best test for him');
    expect(patient.testPerformed).toBe(false);
  });

  it('closes with what keeps working after he leaves the room', () => {
    const safetyNet = narrations[beats.indexOf('safetyNet')]!;
    expect(safetyNet).toContain('keeps working after he leaves the room');
    expect(narration).toContain('nobody called anything atypical');
    expect(narration).toContain('This ends the example, not the evaluation.');
  });

  it('never diagnoses, scores, or orders', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is angina', 'he has coronary disease', 'order a ct coronary angiogram', 'book an exercise ecg', 'his risk is 15%', 'start a statin', 'start aspirin']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });
});

describe('Requirement: The Tutor Enforces The Order Of Reasoning', () => {
  const V = '0.1.1';

  it('walks the beats in order on the expert path', () => {
    const engine = create(); engine.step();
    const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = stableChestPainInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt && seen.at(-1) !== prompt.id) seen.push(prompt.id);
      advance(engine, tick, action);
    }
    expect(seen).toEqual(['scp-stability', 'scp-pattern', 'scp-likelihood', 'scp-testing', 'scp-safety-net']);
  });

  it('stays on the likelihood when a testing pathway is attempted first', () => {
    const engine = create();
    for (const [tick, action] of FIXTURES.expert.slice(0, 2)) advance(engine, tick, action);
    advance(engine, 2, 'record-stable-chest-pain-testing-intent');
    expect(snapshot(engine)!.testingAtTick).toBeNull();
    expect(snapshot(engine)!.likelihoodAtTick).toBeNull();
    const prompt = stableChestPainInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!;
    expect(prompt.id).toBe('scp-likelihood');
    expect(prompt.suggestion).toContain('Estimate before you investigate');
  });

  it('does not move on when a step is refused for order', () => {
    const engine = create(); engine.step();
    advance(engine, 0, 'characterize-stable-chest-pain-pattern');
    expect(snapshot(engine)!.stabilityAtTick).toBeNull();
    expect(snapshot(engine)!.patternAtTick).toBeNull();
    expect(stableChestPainInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })!.id)
      .toBe('scp-stability');
  });

  it('never names a test, a percentage, or a diagnosis', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.recovery) {
      const prompt = stableChestPainInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(6);
    for (const text of seen) {
      for (const forbidden of ['order a ct coronary angiogram', 'his risk is 15%', 'this is angina', 'start a statin']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted, at another content version, and after the safety net', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(stableChestPainInlinePrompt('unassisted', { scenarioVersion: V, patient })).toBeNull();
    expect(stableChestPainInlinePrompt('guided', { scenarioVersion: '0.1.0', patient })).toBeNull();
    expect(stableChestPainInlinePrompt('guided', { scenarioVersion: V, patient: undefined })).toBeNull();
    for (const [tick, action] of FIXTURES.expert) advance(engine, tick, action);
    expect(snapshot(engine)!.safetyNetAtTick).not.toBeNull();
    expect(stableChestPainInlinePrompt('guided', { scenarioVersion: V, patient: snapshot(engine) })).toBeNull();
  });

  it('withholds nothing when coached, because every beat here is load-bearing', () => {
    const engine = create(); engine.step();
    for (const level of ['guided', 'coached'] as const) {
      expect(stableChestPainInlinePrompt(level, { scenarioVersion: V, patient: snapshot(engine) })).not.toBeNull();
    }
  });
});
