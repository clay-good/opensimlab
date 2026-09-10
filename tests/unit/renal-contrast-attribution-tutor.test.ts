/**
 * The example must not name a cause, and must not show the chart before it is retrieved.
 *
 * This lesson's whole risk is that a tutor which sounds confident replaces one attribution
 * with another. So the prompts are checked for the words that would do it, and the worked
 * example is walked beat by beat to prove it withdraws the exposures before it reasons about
 * the evidence -- the one step that changes anything comes before the one that explains it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction, RenalContrastAttributionSnapshot } from '@platform/kernel/protocol';
import { RENAL_CONTRAST_ATTRIBUTION_LABEL as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/contrast-attribution-a-label-that-stopped-the-search';
import { RENAL_CONTRAST_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/contrast-attribution-fixtures';
import { renalContrastAttributionInlinePrompt } from '../../src/modules/renal-electrolyte/renal-contrast-attribution-tutor';
import { renalContrastAttributionDemonstrationStep, supportsRenalContrastAttributionDemonstration,
  RENAL_CONTRAST_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-contrast-attribution-demonstration';
import { RENAL_CONTRAST_RECORD_TICKS as RECORD, type RenalContrastAction } from '../../src/modules/renal-electrolyte/contrast-attribution';

const choice = (tick: number, action: RenalContrastAction): LearnerAction =>
  ({ tick, type: 'renal-contrast-attribution-response', payload: { action } });

function walk(actions: readonly (readonly [number, RenalContrastAction])[], until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const seen: RenalContrastAttributionSnapshot[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const snapshot = engine.step().equipment.resuscitation.renalContrastAttribution;
    if (snapshot) seen.push(snapshot);
  }
  return seen;
}

describe('Requirement: the contrast-attribution tutor removes a label without supplying a cause', () => {
  it('claims its own scenario version', () => {
    expect(supportsRenalContrastAttributionDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalContrastAttributionDemonstration({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, version: '0.2.0' } })).toBe(false);
    expect(RENAL_CONTRAST_DEMONSTRATION_VERSION).toBe('0.1.0');
  });

  it('says nothing at all on the unassisted setting', () => {
    for (const snapshot of walk([[0, 'review-label']], 20)) {
      expect(renalContrastAttributionInlinePrompt('unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalContrastAttribution: snapshot })).toBeNull();
    }
  });

  it('never asserts a cause, in any prompt, at any point', () => {
    for (const snapshot of walk([[0, 'review-label'], [1, 'review-alternatives'],
      [2, 'withdraw-exposures'], [3, 'review-evidence'], [4, 'call-support'], [5, 'monitor']], 400)) {
      const prompt = renalContrastAttributionInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalContrastAttribution: snapshot });
      if (!prompt) continue;
      const text = `${prompt.suggestion} ${prompt.because}`.toLowerCase();
      for (const claim of ['caused by', 'the cause is', 'this is sepsis', 'due to hypotension',
        'due to the nsaid', 'contrast did not', 'contrast never']) {
        expect(text, `prompt asserts "${claim}"`).not.toContain(claim);
      }
    }
  });

  it('does not reveal the unopened chart before it is retrieved', () => {
    for (const snapshot of walk([[0, 'review-label'], [1, 'review-alternatives']], 200)) {
      if (snapshot.recordOpened) continue;
      const prompt = renalContrastAttributionInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalContrastAttribution: snapshot });
      if (!prompt) continue;
      expect(`${prompt.suggestion}`).not.toContain('78');
      expect(`${prompt.suggestion}`).not.toContain('four episodes');
    }
  });

  it('withdraws the exposures before it explains the evidence', () => {
    const beats: string[] = [];
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    for (let tick = 0; tick <= RECORD + 200; tick += 1) {
      const snapshot = engine.step().equipment.resuscitation.renalContrastAttribution!;
      const step = renalContrastAttributionDemonstrationStep(snapshot);
      if (beats.at(-1) !== step.id) beats.push(step.id);
      if (step.finished) break;
      if (step.action) engine.apply(choice(tick + 1, step.action));
    }
    expect(beats[0]).toBe('label');
    expect(beats.indexOf('alternatives')).toBeGreaterThan(beats.indexOf('label'));
    // The one thing still happening that can be changed comes before the reasoning about it.
    expect(beats.indexOf('withdraw')).toBeGreaterThan(beats.indexOf('alternatives'));
    expect(beats.indexOf('evidence')).toBeGreaterThan(beats.indexOf('withdraw'));
    expect(beats).toContain('handoff');
    expect(beats.at(-1)).toBe('finished');
  });

  it('stays quiet at the handoff on the coached setting', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(renalContrastAttributionDemonstrationStep(seen.at(-1)!).finished).toBe(true);
    expect(renalContrastAttributionInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, renalContrastAttribution: seen.at(-1)! })).toBeNull();
  });

  it('offers the consensus statement as its source', () => {
    const [snapshot] = walk([], 2);
    const prompt = renalContrastAttributionInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, renalContrastAttribution: snapshot })!;
    expect(prompt.sourceHref).toBe('https://doi.org/10.1148/radiol.2019192094');
  });
});
