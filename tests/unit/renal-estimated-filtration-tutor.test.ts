/**
 * A tutor in this lesson is one sentence away from ruining it.
 *
 * Any prompt that named a true filtration rate, called one estimate the right one, or told the
 * learner what dose follows would replace the uncertainty the lab is built to hand over. The
 * prompts are swept for all three, and the example is walked to prove it records the
 * disagreement rather than choosing between the two numbers.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction, RenalEstimatedFiltrationSnapshot } from '@platform/kernel/protocol';
import { RENAL_ESTIMATED_FILTRATION as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/estimated-filtration-a-number-she-was-never-measured-by';
import { RENAL_ESTIMATE_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/estimated-filtration-fixtures';
import { renalEstimatedFiltrationInlinePrompt } from '../../src/modules/renal-electrolyte/renal-estimated-filtration-tutor';
import { renalEstimatedFiltrationDemonstrationStep, supportsRenalEstimatedFiltrationDemonstration,
  RENAL_ESTIMATE_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-estimated-filtration-demonstration';
import { RENAL_ESTIMATE_SECOND_MARKER_TICKS as MARKER, type RenalEstimateAction } from '../../src/modules/renal-electrolyte/estimated-filtration';

const choice = (tick: number, action: RenalEstimateAction): LearnerAction =>
  ({ tick, type: 'renal-estimated-filtration-response', payload: { action } });

function walk(actions: readonly (readonly [number, RenalEstimateAction])[], until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const seen: RenalEstimatedFiltrationSnapshot[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const snapshot = engine.step().equipment.resuscitation.renalEstimatedFiltration;
    if (snapshot) seen.push(snapshot);
  }
  return seen;
}

describe('Requirement: the estimated-filtration tutor hands over uncertainty, not an answer', () => {
  it('claims its own scenario version', () => {
    expect(supportsRenalEstimatedFiltrationDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalEstimatedFiltrationDemonstration({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, version: '0.2.0' } })).toBe(false);
    expect(RENAL_ESTIMATE_DEMONSTRATION_VERSION).toBe('0.1.0');
  });

  it('says nothing at all on the unassisted setting', () => {
    for (const snapshot of walk([[0, 'review-precision']], 20)) {
      expect(renalEstimatedFiltrationInlinePrompt('unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalEstimatedFiltration: snapshot })).toBeNull();
    }
  });

  it('never names a true value, a correct marker, or a dose', () => {
    for (const snapshot of walk([[0, 'review-precision'], [1, 'review-generation'],
      [2, 'request-second-marker'], [3, 'own-medicine-decision'], [4, 'call-support'], [5, 'monitor']], 400)) {
      const prompt = renalEstimatedFiltrationInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalEstimatedFiltration: snapshot });
      if (!prompt) continue;
      const text = `${prompt.suggestion} ${prompt.because}`.toLowerCase();
      // Assertion voice only. An earlier version of this list forbade the bare phrase "her
      // filtration is", which matched the prompt that says her filtration is NOT established --
      // a guard that fires on the denial of the thing it is guarding against is worse than none.
      for (const claim of ['her true', 'the true value is', 'the correct estimate', 'use the cystatin',
        'the right number', 'reduce the dose', 'halve the dose',
        'she has reduced filtration', 'her kidney function is reduced', 'this establishes that her']) {
        expect(text, `prompt claims "${claim}"`).not.toContain(claim);
      }
    }
  });

  it('does not reveal the second estimate before it returns', () => {
    for (const snapshot of walk([[0, 'review-precision'], [1, 'review-generation'], [2, 'request-second-marker']], 200)) {
      if (snapshot.secondMarkerReturned) continue;
      const prompt = renalEstimatedFiltrationInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalEstimatedFiltration: snapshot });
      if (!prompt) continue;
      expect(prompt.suggestion).not.toContain('38');
    }
  });

  it('records the disagreement rather than choosing between the numbers', () => {
    const beats: string[] = [];
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    for (let tick = 0; tick <= MARKER + 300; tick += 1) {
      const snapshot = engine.step().equipment.resuscitation.renalEstimatedFiltration!;
      const step = renalEstimatedFiltrationDemonstrationStep(snapshot);
      if (beats.at(-1) !== step.id) beats.push(step.id);
      if (step.finished) break;
      if (step.action) engine.apply(choice(tick + 1, step.action));
    }
    expect(beats[0]).toBe('precision');
    expect(beats.indexOf('generation')).toBeGreaterThan(beats.indexOf('precision'));
    expect(beats.indexOf('second-marker')).toBeGreaterThan(beats.indexOf('generation'));
    // The decision is owned while the marker is still pending: it does not wait for a number.
    expect(beats.indexOf('ownership')).toBeGreaterThan(beats.indexOf('second-marker'));
    expect(beats).toContain('discordance');
    expect(beats).toContain('handoff');
    expect(beats.at(-1)).toBe('finished');
  });

  it('closes by saying what the next clinician actually needs', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] - 1);
    const step = renalEstimatedFiltrationDemonstrationStep(seen.at(-1)!);
    expect(step.id).toBe('handoff');
    expect(step.narration).toContain('what the next clinician needs is the width');
  });

  it('stays quiet at the handoff on the coached setting', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(renalEstimatedFiltrationDemonstrationStep(seen.at(-1)!).finished).toBe(true);
    expect(renalEstimatedFiltrationInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, renalEstimatedFiltration: seen.at(-1)! })).toBeNull();
  });

  it('offers the validation study as its source', () => {
    const [snapshot] = walk([], 2);
    const prompt = renalEstimatedFiltrationInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, renalEstimatedFiltration: snapshot })!;
    expect(prompt.sourceHref).toBe('https://doi.org/10.1056/NEJMoa2102953');
  });
});
