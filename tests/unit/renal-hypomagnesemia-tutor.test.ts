/**
 * The tutor and the worked example must not leak the thing the lesson withholds.
 *
 * A learner who has not asked for a result should not learn it from a prompt, and the
 * unassisted setting is silent by contract. The demonstration also has to reach its own
 * beats: an ordering mistake here shows up as an example that skips the step it exists to
 * teach, which no type check would catch.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { RenalHypomagnesemiaSnapshot } from '@platform/kernel/protocol';
import type { LearnerAction } from '@platform/kernel/protocol';
import { RENAL_HYPOMAGNESEMIA_REFRACTORY_POTASSIUM as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/hypomagnesemia-refractory-potassium-and-the-normal-number';
import { RENAL_HYPOMAGNESEMIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/hypomagnesemia-fixtures';
import { renalHypomagnesemiaInlinePrompt } from '../../src/modules/renal-electrolyte/renal-hypomagnesemia-tutor';
import { renalHypomagnesemiaDemonstrationStep, supportsRenalHypomagnesemiaDemonstration,
  RENAL_HYPOMAGNESEMIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-hypomagnesemia-demonstration';
import { RENAL_HYPOMAGNESEMIA_REPLETION_TICKS as REPLETION, type RenalHypomagnesemiaAction } from '../../src/modules/renal-electrolyte/hypomagnesemia';

const choice = (tick: number, action: RenalHypomagnesemiaAction): LearnerAction =>
  ({ tick, type: 'renal-hypomagnesemia-response', payload: { action } });

function walk(actions: readonly (readonly [number, RenalHypomagnesemiaAction])[], until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const seen: RenalHypomagnesemiaSnapshot[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const frame = engine.step();
    const snapshot = frame.equipment.resuscitation.renalHypomagnesemia;
    if (snapshot) seen.push(snapshot);
  }
  return seen;
}

describe('Requirement: the hypomagnesemia tutor is silent unless asked and never leaks a result', () => {
  it('claims its own scenario version', () => {
    expect(supportsRenalHypomagnesemiaDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalHypomagnesemiaDemonstration({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, version: '0.2.0' } })).toBe(false);
    expect(RENAL_HYPOMAGNESEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
  });

  it('says nothing at all on the unassisted setting', () => {
    for (const snapshot of walk([[0, 'monitor']], 20)) {
      expect(renalHypomagnesemiaInlinePrompt('unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalHypomagnesemia: snapshot })).toBeNull();
    }
  });

  it('says nothing for a version it was not written for', () => {
    const [snapshot] = walk([], 2);
    expect(renalHypomagnesemiaInlinePrompt('guided', {
      scenarioVersion: '0.2.0', renalHypomagnesemia: snapshot })).toBeNull();
  });

  it('never names a result the learner has not requested', () => {
    for (const snapshot of walk([[0, 'monitor'], [1, 'review-number'], [2, 'replace-magnesium']], 200)) {
      const prompt = renalHypomagnesemiaInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalHypomagnesemia: snapshot });
      if (!prompt) continue;
      const text = `${prompt.suggestion} ${prompt.because}`;
      // The post-repletion values exist in the engine long before anyone asks for them.
      expect(text).not.toContain('0.81');
      expect(text).not.toContain('3.6');
      expect(text).not.toContain('1.14');
      expect(text).not.toContain('462');
    }
  });

  it('walks the example through its own beats, in order, to the handoff', () => {
    const beats: string[] = [];
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    for (let tick = 0; tick <= REPLETION + 200; tick += 1) {
      const snapshot = engine.step().equipment.resuscitation.renalHypomagnesemia!;
      const step = renalHypomagnesemiaDemonstrationStep(snapshot);
      if (beats.at(-1) !== step.id) beats.push(step.id);
      if (step.finished) break;
      if (step.action) engine.apply(choice(tick + 1, step.action));
    }
    expect(beats[0]).toBe('monitor');
    // The number review has to come before repletion: deciding what the value excludes is
    // the step the lesson exists for, and an example that treats first teaches the opposite.
    expect(beats.indexOf('number')).toBeGreaterThan(beats.indexOf('monitor'));
    expect(beats.indexOf('repletion')).toBeGreaterThan(beats.indexOf('number'));
    expect(beats).toContain('stop-exposure');
    expect(beats).toContain('support');
    expect(beats).toContain('context');
    expect(beats).toContain('handoff');
    expect(beats.at(-1)).toBe('finished');
  });

  it('coaches only where there is an action, and stays quiet at the handoff', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    const handoffStep = renalHypomagnesemiaDemonstrationStep(seen.at(-1)!);
    expect(handoffStep.finished).toBe(true);
    expect(renalHypomagnesemiaInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, renalHypomagnesemia: seen.at(-1)! })).toBeNull();
  });

  it('offers a real source and describes what it is not', () => {
    const [snapshot] = walk([], 2);
    const prompt = renalHypomagnesemiaInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, renalHypomagnesemia: snapshot })!;
    expect(prompt.sourceHref).toBe('https://doi.org/10.1681/ASN.2007070792');
    expect(prompt.because).toContain('not predicted physiology');
  });
});
