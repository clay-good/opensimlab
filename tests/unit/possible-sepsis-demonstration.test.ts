/**
 * The worked example and observed-state tutor for a clock that runs either way.
 *
 * The guidance is tiered, and the deferral tier is conditional on close
 * monitoring — so an unbounded deferral is a different thing from the one it
 * permits. The example neither treats immediately nor waits: it takes the
 * time-limited course against a recorded ceiling and records the intent inside
 * it, without ever assigning the likelihood tier.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { POSSIBLE_SEPSIS_A_CLOCK_THAT_RUNS_EITHER_WAY as SCENARIO } from '../../src/modules/infectious-disease/scenarios/possible-sepsis-a-clock-that-runs-either-way';
import { POSSIBLE_SEPSIS_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/possible-sepsis-fixtures';
import {
  POSSIBLE_SEPSIS_DEMONSTRATION_VERSION, possibleSepsisDemonstrationStep,
  supportsPossibleSepsisDemonstration,
} from '../../src/modules/infectious-disease/demo/possible-sepsis-demonstration';
import { possibleSepsisInlinePrompt } from '../../src/modules/infectious-disease/possible-sepsis-tutor';
import type { PossibleSepsisAction } from '../../src/modules/infectious-disease/possible-sepsis';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.possibleSepsis;
const advance = (engine: AnesthesiaEngine, tick: number, action: PossibleSepsisAction) => {
  engine.apply({ tick, type: 'possible-sepsis-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = possibleSepsisDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'possible-sepsis-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Neither Waits Nor Treats Immediately', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(POSSIBLE_SEPSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPossibleSepsisDemonstration(SCENARIO)).toBe(true);
    expect(supportsPossibleSepsisDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through the tiered path', () => {
    expect(beats.slice(0, 5)).toEqual(['time-zero', 'uncertainty', 'assessment',
      'boundaries', 'monitor']);
    expect(beats).toContain('intent');
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('records the intent inside the ceiling rather than after it', () => {
    expect(patient.antimicrobialInsideCeiling).toBe(true);
    expect(patient.ceilingPassed).toBe(false);
    expect(patient.immediatePathApplies).toBe(false);
  });

  it('records the clock before anything else', () => {
    expect(patient.timeZeroAtTick).toBe(0);
    expect(narrations[0]).toContain('whether or not anyone writes it down');
  });

  it('never assigns a tier or rules out on one result', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['this is probable sepsis', 'the lactate rules it out', 'the crp excludes']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narration).toContain('No tier was assigned');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.waitAttempted).toBe(false);
    expect(patient.tierAttempted).toBe(false);
    expect(patient.singleTestAttempted).toBe(false);
    expect(patient.deferralAttempted).toBe(false);
  });
});

describe('Requirement: The Tutor Offers A Ceiling, Never A Wait', () => {
  it('opens on the recorded time of first suspicion', () => {
    const engine = create(); engine.step();
    const prompt = possibleSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', possibleSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('possible-sepsis-time-zero');
    expect(prompt.because).toContain('whether or not anyone writes it down');
  });

  it('names the condition the deferral tier rests on', () => {
    const engine = create();
    for (const action of ['record-time-zero', 'record-uncertainty',
      'request-time-limited-assessment'] as const) advance(engine, 0, action);
    const prompt = possibleSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', possibleSepsis: snapshot(engine) })!;
    expect(prompt.id).toBe('possible-sepsis-boundaries');
    expect(prompt.because).toContain('conditional on continuing close monitoring');
  });

  it('never offers waiting or a tier', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = possibleSepsisInlinePrompt('guided', { scenarioVersion: '0.1.0', possibleSepsis: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['wait and review', 'observe and see', 'assign the tier', 'this is probable']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(possibleSepsisInlinePrompt('unassisted', { scenarioVersion: '0.1.0', possibleSepsis: patient })).toBeNull();
    expect(possibleSepsisInlinePrompt('guided', { scenarioVersion: '0.1.1', possibleSepsis: patient })).toBeNull();
  });
});
