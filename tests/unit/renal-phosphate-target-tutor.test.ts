/**
 * The example reads the trial before it touches the diet, and never tells anyone what to do.
 *
 * A prompt that said "don't start a binder" or "relax the diet" would convert a lesson about
 * a surrogate into a recommendation, which is what the boundary narrative and the refusals
 * spend their words avoiding. The order matters too: naming the surrogate has to precede the
 * evidence, or the learner is being handed a conclusion rather than a question.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction, RenalPhosphateTargetSnapshot } from '@platform/kernel/protocol';
import { RENAL_PHOSPHATE_TARGET as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/phosphate-target-a-surrogate-that-moved-the-wrong-way';
import { RENAL_PHOSPHATE_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/phosphate-target-fixtures';
import { renalPhosphateTargetInlinePrompt } from '../../src/modules/renal-electrolyte/renal-phosphate-target-tutor';
import { renalPhosphateTargetDemonstrationStep, supportsRenalPhosphateTargetDemonstration,
  RENAL_PHOSPHATE_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-phosphate-target-demonstration';
import { RENAL_PHOSPHATE_RECORDS_TICKS as RECORDS, type RenalPhosphateAction } from '../../src/modules/renal-electrolyte/phosphate-target';

const choice = (tick: number, action: RenalPhosphateAction): LearnerAction =>
  ({ tick, type: 'renal-phosphate-target-response', payload: { action } });

function walk(actions: readonly (readonly [number, RenalPhosphateAction])[], until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const seen: RenalPhosphateTargetSnapshot[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const snapshot = engine.step().equipment.resuscitation.renalPhosphateTarget;
    if (snapshot) seen.push(snapshot);
  }
  return seen;
}

describe('Requirement: the phosphate-target tutor poses a question rather than an answer', () => {
  it('claims its own scenario version', () => {
    expect(supportsRenalPhosphateTargetDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalPhosphateTargetDemonstration({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, version: '0.2.0' } })).toBe(false);
    expect(RENAL_PHOSPHATE_DEMONSTRATION_VERSION).toBe('0.1.0');
  });

  it('says nothing at all on the unassisted setting', () => {
    for (const snapshot of walk([[0, 'review-surrogate']], 20)) {
      expect(renalPhosphateTargetInlinePrompt('unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalPhosphateTarget: snapshot })).toBeNull();
    }
  });

  it('never tells anyone to start, withhold, or loosen anything', () => {
    for (const snapshot of walk([[0, 'review-surrogate'], [1, 'review-trial'], [2, 'review-intake'],
      [3, 'own-decision'], [4, 'call-support'], [5, 'monitor']], 400)) {
      const prompt = renalPhosphateTargetInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalPhosphateTarget: snapshot });
      if (!prompt) continue;
      const text = `${prompt.suggestion} ${prompt.because}`.toLowerCase();
      for (const claim of ['start a binder', 'do not start', 'avoid binders', 'binders are harmful',
        'relax the diet', 'stop restricting', 'he is malnourished', 'his phosphate is safe']) {
        expect(text, `prompt claims "${claim}"`).not.toContain(claim);
      }
    }
  });

  it('does not reveal the retrieved letters before they arrive', () => {
    for (const snapshot of walk([[0, 'review-surrogate'], [1, 'review-trial'], [2, 'review-intake']], 200)) {
      if (snapshot.recordsOpened) continue;
      const prompt = renalPhosphateTargetInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalPhosphateTarget: snapshot });
      if (!prompt) continue;
      expect(prompt.suggestion).not.toContain('2 dietary restrictions documented');
    }
  });

  it('names the surrogate before it reads the evidence, and reads the diet after both', () => {
    const beats: string[] = [];
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    for (let tick = 0; tick <= RECORDS + 300; tick += 1) {
      const snapshot = engine.step().equipment.resuscitation.renalPhosphateTarget!;
      const step = renalPhosphateTargetDemonstrationStep(snapshot);
      if (beats.at(-1) !== step.id) beats.push(step.id);
      if (step.finished) break;
      if (step.action) engine.apply(choice(tick + 1, step.action));
    }
    expect(beats[0]).toBe('surrogate');
    expect(beats.indexOf('trial')).toBeGreaterThan(beats.indexOf('surrogate'));
    expect(beats.indexOf('intake')).toBeGreaterThan(beats.indexOf('trial'));
    expect(beats.indexOf('ownership')).toBeGreaterThan(beats.indexOf('intake'));
    expect(beats).toContain('handoff');
    expect(beats.at(-1)).toBe('finished');
  });

  it('quotes the half of the trial that rarely gets quoted', () => {
    const seen = walk([[0, 'review-surrogate']], 10);
    const step = renalPhosphateTargetDemonstrationStep(seen.at(-1)!);
    expect(step.id).toBe('trial');
    expect(step.narration).toContain('calcification rose against placebo');
    expect(step.narration).toContain('uncertainty in both directions');
  });

  it('stays quiet at the handoff on the coached setting', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(renalPhosphateTargetDemonstrationStep(seen.at(-1)!).finished).toBe(true);
    expect(renalPhosphateTargetInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, renalPhosphateTarget: seen.at(-1)! })).toBeNull();
  });

  it('offers the randomised comparison as its source', () => {
    const [snapshot] = walk([], 2);
    const prompt = renalPhosphateTargetInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, renalPhosphateTarget: snapshot })!;
    expect(prompt.sourceHref).toBe('https://doi.org/10.1681/ASN.2012030223');
  });
});
