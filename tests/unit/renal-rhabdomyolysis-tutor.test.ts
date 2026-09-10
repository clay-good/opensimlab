/**
 * The example puts the bedside before the number, and must keep doing so.
 *
 * A worked example that established the cause or discussed the creatine kinase before examining
 * the limbs would model exactly the reflex this lesson exists to interrupt, and no type check
 * would notice. The prompts are also swept for a prognosis, because a cohort percentage read
 * aloud as a prediction is the other way this lab could go wrong.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction, RenalRhabdomyolysisSnapshot } from '@platform/kernel/protocol';
import { RENAL_RHABDOMYOLYSIS_NUMBER as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/rhabdomyolysis-a-number-that-does-not-carry-the-risk';
import { RENAL_RHABDOMYOLYSIS_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/rhabdomyolysis-fixtures';
import { renalRhabdomyolysisInlinePrompt } from '../../src/modules/renal-electrolyte/renal-rhabdomyolysis-tutor';
import { renalRhabdomyolysisDemonstrationStep, supportsRenalRhabdomyolysisDemonstration,
  RENAL_RHABDOMYOLYSIS_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-rhabdomyolysis-demonstration';
import { RENAL_RHABDOMYOLYSIS_SERIAL_TICKS as SERIAL, type RenalRhabdomyolysisAction } from '../../src/modules/renal-electrolyte/rhabdomyolysis';

const choice = (tick: number, action: RenalRhabdomyolysisAction): LearnerAction =>
  ({ tick, type: 'renal-rhabdomyolysis-response', payload: { action } });

function walk(actions: readonly (readonly [number, RenalRhabdomyolysisAction])[], until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const seen: RenalRhabdomyolysisSnapshot[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const snapshot = engine.step().equipment.resuscitation.renalRhabdomyolysis;
    if (snapshot) seen.push(snapshot);
  }
  return seen;
}

describe('Requirement: the rhabdomyolysis tutor puts the bedside before the number', () => {
  it('claims its own scenario version', () => {
    expect(supportsRenalRhabdomyolysisDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalRhabdomyolysisDemonstration({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, version: '0.2.0' } })).toBe(false);
    expect(RENAL_RHABDOMYOLYSIS_DEMONSTRATION_VERSION).toBe('0.1.0');
  });

  it('says nothing at all on the unassisted setting', () => {
    for (const snapshot of walk([[0, 'examine-compartments']], 20)) {
      expect(renalRhabdomyolysisInlinePrompt('unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalRhabdomyolysis: snapshot })).toBeNull();
    }
  });

  it('examines the limbs first, before the cause and before the number', () => {
    const beats: string[] = [];
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    for (let tick = 0; tick <= SERIAL + 200; tick += 1) {
      const snapshot = engine.step().equipment.resuscitation.renalRhabdomyolysis!;
      const step = renalRhabdomyolysisDemonstrationStep(snapshot);
      if (beats.at(-1) !== step.id) beats.push(step.id);
      if (step.finished) break;
      if (step.action) engine.apply(choice(tick + 1, step.action));
    }
    expect(beats[0]).toBe('compartment');
    expect(beats.indexOf('cause')).toBeGreaterThan(beats.indexOf('compartment'));
    // Fluid is the part with support behind it; it comes before the discussion of the number.
    expect(beats.indexOf('fluids')).toBeGreaterThan(beats.indexOf('cause'));
    expect(beats.indexOf('number')).toBeGreaterThan(beats.indexOf('fluids'));
    expect(beats.indexOf('additions')).toBeGreaterThan(beats.indexOf('number'));
    expect(beats).toContain('handoff');
    expect(beats.at(-1)).toBe('finished');
  });

  it('never turns a cohort percentage into a prediction about him', () => {
    for (const snapshot of walk([[0, 'examine-compartments'], [1, 'review-cause'], [2, 'arrange-fluids'],
      [3, 'review-number'], [4, 'review-additions'], [5, 'call-support'], [6, 'monitor']], 400)) {
      const prompt = renalRhabdomyolysisInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalRhabdomyolysis: snapshot });
      if (!prompt) continue;
      const text = `${prompt.suggestion} ${prompt.because}`.toLowerCase();
      for (const claim of ['his risk is', 'he will need', 'he will not need', 'he is safe',
        'low risk patient', 'will recover']) {
        expect(text, `prompt claims "${claim}"`).not.toContain(claim);
      }
    }
  });

  it('does not reveal the serial result before it is requested', () => {
    for (const snapshot of walk([[0, 'examine-compartments'], [1, 'review-cause'], [2, 'arrange-fluids']], 300)) {
      if (snapshot.serialOpened) continue;
      const prompt = renalRhabdomyolysisInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalRhabdomyolysis: snapshot });
      if (!prompt) continue;
      expect(prompt.suggestion).not.toContain('61,000');
      expect(prompt.suggestion).not.toContain('61000');
    }
  });

  it('stays quiet at the handoff on the coached setting', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(renalRhabdomyolysisDemonstrationStep(seen.at(-1)!).finished).toBe(true);
    expect(renalRhabdomyolysisInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, renalRhabdomyolysis: seen.at(-1)! })).toBeNull();
  });

  it('offers the risk-prediction cohort as its source', () => {
    const [snapshot] = walk([], 2);
    const prompt = renalRhabdomyolysisInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, renalRhabdomyolysis: snapshot })!;
    expect(prompt.sourceHref).toBe('https://doi.org/10.1001/jamainternmed.2013.9774');
  });
});
