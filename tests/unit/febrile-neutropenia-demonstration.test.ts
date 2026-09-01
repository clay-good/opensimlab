/**
 * The worked example and observed-state tutor for a blinded examination.
 *
 * Every refused shortcut here is a missing signal read as a reassuring one: a
 * modest marker, a risk score, an absent localizing sign, an unraised white
 * count. The unifying answer is mechanism rather than urgency — there are no
 * neutrophils with which to produce any of those signals — and the example ends
 * with no source found, because a source at the end would teach that the
 * decision was right because it turned out to be.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { FEBRILE_NEUTROPENIA_BLIND_EXAMINATION as SCENARIO } from '../../src/modules/infectious-disease/scenarios/febrile-neutropenia-blind-examination';
import { FEBRILE_NEUTROPENIA_FIXTURES as FIXTURES } from '../../src/modules/infectious-disease/febrile-neutropenia-fixtures';
import {
  FEBRILE_NEUTROPENIA_DEMONSTRATION_VERSION, febrileNeutropeniaDemonstrationStep,
  supportsFebrileNeutropeniaDemonstration,
} from '../../src/modules/infectious-disease/demo/febrile-neutropenia-demonstration';
import { febrileNeutropeniaInlinePrompt } from '../../src/modules/infectious-disease/febrile-neutropenia-tutor';
import type { FebrileNeutropeniaAction } from '../../src/modules/infectious-disease/febrile-neutropenia';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.febrileNeutropenia;
const advance = (engine: AnesthesiaEngine, tick: number, action: FebrileNeutropeniaAction) => {
  engine.apply({ tick, type: 'febrile-neutropenia-response', payload: { action } });
  engine.step();
};

function runDemonstration(limit = 400_000) {
  const engine = create();
  const beats: string[] = []; const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = febrileNeutropeniaDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)!, narration: step.narration };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'febrile-neutropenia-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends With No Source', () => {
  const { beats, narrations, patient, narration } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(FEBRILE_NEUTROPENIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsFebrileNeutropeniaDemonstration(SCENARIO)).toBe(true);
    expect(supportsFebrileNeutropeniaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('reaches handoff through every recorded step', () => {
    expect(beats.slice(0, 6)).toEqual(['recognize', 'pathway', 'cultures', 'intent',
      'boundaries', 'monitor']);
    expect(beats.at(-1)).toBe('handoff');
    expect(patient.ended).toBe('handoff');
  });

  it('never produces a source or a positive culture', () => {
    const everything = `${narrations.join(' ')} ${narration}`.toLowerCase();
    for (const forbidden of ['the culture grew', 'the source is', 'a chest infection was found']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
    expect(narration).toContain('No source was found');
  });

  it('answers the reassuring signals with mechanism rather than urgency', () => {
    expect(narrations[0]).toContain('looking well is what this does early');
    expect(narrations[beats.indexOf('boundaries')]).toContain('removes the localizing signs');
    expect(narrations[beats.indexOf('boundaries')]).toContain('system-design safety margin');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.crpReassuranceAttempted).toBe(false);
    expect(patient.scoreDeferralAttempted).toBe(false);
    expect(patient.sourceWaitAttempted).toBe(false);
    expect(patient.leukocytosisExpected).toBe(false);
  });
});

describe('Requirement: The Tutor Names What The Neutropenia Removed', () => {
  it('opens on the count and the fever alone', () => {
    const engine = create(); engine.step();
    const prompt = febrileNeutropeniaInlinePrompt('guided', { scenarioVersion: '0.1.0', febrileNeutropenia: snapshot(engine) })!;
    expect(prompt.id).toBe('febrile-neutropenia-recognize');
    expect(prompt.because).toContain('looking well is what this illness does early');
  });

  it('never selects an agent and never treats the hour as physiology', () => {
    const engine = create(); const seen: string[] = [];
    for (const [tick, action] of FIXTURES.expert) {
      const prompt = febrileNeutropeniaInlinePrompt('guided', { scenarioVersion: '0.1.0', febrileNeutropenia: snapshot(engine) });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      advance(engine, tick, action);
    }
    expect(seen.length).toBeGreaterThan(4);
    for (const text of seen) {
      for (const forbidden of ['piperacillin', 'mg/kg', 'wait for the source', 'the crp is reassuring']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and at another content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(febrileNeutropeniaInlinePrompt('unassisted', { scenarioVersion: '0.1.0', febrileNeutropenia: patient })).toBeNull();
    expect(febrileNeutropeniaInlinePrompt('guided', { scenarioVersion: '0.1.1', febrileNeutropenia: patient })).toBeNull();
  });
});
