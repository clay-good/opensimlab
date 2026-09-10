/**
 * The example does the arithmetic first and never converts it into a verdict.
 *
 * "Inside the reference band" is one careless sentence away from "so it is noise", and the
 * matched value is one sentence away from "so she is stable". Both are swept for. The order is
 * checked too: comparing before requesting matters, because a repeat ordered without knowing
 * why is just another value.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction, RenalProteinuriaRatioSnapshot } from '@platform/kernel/protocol';
import { RENAL_PROTEINURIA_RATIO as SCENARIO } from '../../src/modules/renal-electrolyte/scenarios/proteinuria-a-ratio-that-doubled-and-a-patient-who-did-not';
import { RENAL_PROTEINURIA_FIXTURES as FIXTURES } from '../../src/modules/renal-electrolyte/proteinuria-ratio-fixtures';
import { renalProteinuriaRatioInlinePrompt } from '../../src/modules/renal-electrolyte/renal-proteinuria-ratio-tutor';
import { renalProteinuriaRatioDemonstrationStep, supportsRenalProteinuriaRatioDemonstration,
  RENAL_PROTEINURIA_DEMONSTRATION_VERSION } from '../../src/modules/renal-electrolyte/demo/renal-proteinuria-ratio-demonstration';
import { RENAL_PROTEINURIA_REPEAT_TICKS as REPEAT, type RenalProteinuriaAction } from '../../src/modules/renal-electrolyte/proteinuria-ratio';

const choice = (tick: number, action: RenalProteinuriaAction): LearnerAction =>
  ({ tick, type: 'renal-proteinuria-ratio-response', payload: { action } });

function walk(actions: readonly (readonly [number, RenalProteinuriaAction])[], until: number) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const seen: RenalProteinuriaRatioSnapshot[] = [];
  let next = 0;
  for (let tick = 0; tick <= until; tick += 1) {
    while (actions[next]?.[0] === tick) { engine.apply(choice(tick, actions[next]![1])); next += 1; }
    const snapshot = engine.step().equipment.resuscitation.renalProteinuriaRatio;
    if (snapshot) seen.push(snapshot);
  }
  return seen;
}

describe('Requirement: the proteinuria tutor does arithmetic, not verdicts', () => {
  it('claims its own scenario version', () => {
    expect(supportsRenalProteinuriaRatioDemonstration(SCENARIO)).toBe(true);
    expect(supportsRenalProteinuriaRatioDemonstration({ ...SCENARIO,
      metadata: { ...SCENARIO.metadata, version: '0.2.0' } })).toBe(false);
    expect(RENAL_PROTEINURIA_DEMONSTRATION_VERSION).toBe('0.1.0');
  });

  it('says nothing at all on the unassisted setting', () => {
    for (const snapshot of walk([[0, 'compare-variation']], 20)) {
      expect(renalProteinuriaRatioInlinePrompt('unassisted', {
        scenarioVersion: SCENARIO.metadata.version, renalProteinuriaRatio: snapshot })).toBeNull();
    }
  });

  it('never converts the comparison into a verdict', () => {
    for (const snapshot of walk([[0, 'compare-variation'], [1, 'review-sampling'], [2, 'review-patient'],
      [3, 'request-repeat'], [4, 'own-decision'], [5, 'call-support'], [6, 'monitor']], 400)) {
      const prompt = renalProteinuriaRatioInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalProteinuriaRatio: snapshot });
      if (!prompt) continue;
      const text = `${prompt.suggestion} ${prompt.because}`.toLowerCase();
      for (const claim of ['so it is noise', 'she is stable', 'nothing has changed',
        'this is progression', 'her disease is progressing', 'no change is needed',
        'change her treatment']) {
        expect(text, `prompt claims "${claim}"`).not.toContain(claim);
      }
    }
  });

  it('does not reveal the matched value before it returns', () => {
    for (const snapshot of walk([[0, 'compare-variation'], [1, 'review-sampling'],
      [2, 'review-patient'], [3, 'request-repeat']], 200)) {
      if (snapshot.repeatReturned) continue;
      const prompt = renalProteinuriaRatioInlinePrompt('guided', {
        scenarioVersion: SCENARIO.metadata.version, renalProteinuriaRatio: snapshot });
      if (!prompt) continue;
      expect(prompt.suggestion).not.toContain('189');
    }
  });

  it('compares before it requests, and checks the patient before either', () => {
    const beats: string[] = [];
    const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
    for (let tick = 0; tick <= REPEAT + 300; tick += 1) {
      const snapshot = engine.step().equipment.resuscitation.renalProteinuriaRatio!;
      const step = renalProteinuriaRatioDemonstrationStep(snapshot);
      if (beats.at(-1) !== step.id) beats.push(step.id);
      if (step.finished) break;
      if (step.action) engine.apply(choice(tick + 1, step.action));
    }
    expect(beats[0]).toBe('variation');
    expect(beats.indexOf('sampling')).toBeGreaterThan(beats.indexOf('variation'));
    expect(beats.indexOf('patient')).toBeGreaterThan(beats.indexOf('sampling'));
    // A repeat ordered before you know why you want it is just another value.
    expect(beats.indexOf('repeat')).toBeGreaterThan(beats.indexOf('patient'));
    expect(beats).toContain('handoff');
    expect(beats.at(-1)).toBe('finished');
  });

  it('closes on the point the whole lab exists to make', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] - 1);
    const step = renalProteinuriaRatioDemonstrationStep(seen.at(-1)!);
    expect(step.id).toBe('handoff');
    expect(step.narration).toContain('took one request, at a visit where nobody made it');
  });

  it('stays quiet at the handoff on the coached setting', () => {
    const seen = walk(FIXTURES.expert, FIXTURES.expert.at(-1)![0] + 2);
    expect(renalProteinuriaRatioDemonstrationStep(seen.at(-1)!).finished).toBe(true);
    expect(renalProteinuriaRatioInlinePrompt('coached', {
      scenarioVersion: SCENARIO.metadata.version, renalProteinuriaRatio: seen.at(-1)! })).toBeNull();
  });

  it('offers the variability study as its source', () => {
    const [snapshot] = walk([], 2);
    const prompt = renalProteinuriaRatioInlinePrompt('guided', {
      scenarioVersion: SCENARIO.metadata.version, renalProteinuriaRatio: snapshot })!;
    expect(prompt.sourceHref).toBe('https://doi.org/10.1053/j.ajkd.2018.04.023');
  });
});
