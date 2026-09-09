/**
 * The worked example and observed-state tutor for an injury whose severity is not visible yet.
 *
 * The failure this example must not model is waiting for a reason. It is held here to asking
 * for admission before the daughter telephones, and to never saying she will develop a
 * complication, because nothing available in the lesson can establish that.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { QUIET_CHEST_AN_INJURY_WHOSE_SEVERITY_IS_NOT_YET_VISIBLE as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/quiet-chest-an-injury-whose-severity-is-not-yet-visible';
import { QUIET_CHEST_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/quiet-chest-fixtures';
import {
  QUIET_CHEST_DEMONSTRATION_VERSION, quietChestDemonstrationStep, supportsQuietChestDemonstration,
} from '../../src/modules/surgery-trauma/demo/quiet-chest-demonstration';
import { quietChestInlinePrompt } from '../../src/modules/surgery-trauma/quiet-chest-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.quietChest;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = quietChestDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'quiet-chest-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Asks On The Count Alone', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(QUIET_CHEST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsQuietChestDemonstration(SCENARIO)).toBe(true);
    expect(supportsQuietChestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['injury', 'comfort', 'count', 'escalate', 'intent', 'boundaries',
      'hold', 'family', 'reassess', 'handoff']);
  });

  // The failure mode is needing a social reason before acting on a clinical one.
  it('asks for admission before the daughter telephones, not after it', () => {
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('family'));
    expect(narrations[beats.indexOf('escalate')]).toContain('the only argument you have is a count');
  });

  it('starts by putting the count and the age in one sentence', () => {
    expect(beats[0]).toBe('injury');
    expect(narrations[0]).toContain('putting the two facts in the same sentence');
  });

  // Forbid the assertion, not the subject: the example must discuss pneumonia as a risk while
  // refusing to claim this patient will get it.
  it('never asserts that this patient will develop a complication, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['she will develop', 'she has pneumonia', 'will get pneumonia',
      'proves', 'diagnosed with', 'she is going to deteriorate']) {
      expect(joined, `the example asserted "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('the ribs and the birthday are most of what anybody knows');
  });

  it('says that nothing is coming to help the learner hold the position', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('never going to be anything to point at');
    const family = narrations[beats.indexOf('family')]!;
    expect(family).toContain('it was never the observations');
  });

  it('keeps the half of the evidence that undercuts the obvious intervention', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('223 patients between them');
    expect(boundaries).toContain('arguing for somebody to be watching, not for a treatment');
  });

  it('ends with the plan sized to the interval and nothing certified', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('she will be on her own');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(quietChestInlinePrompt('unassisted', { scenarioVersion: '0.1.0', quietChest: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = quietChestDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', quietChest: patientNow };
      guided.push(quietChestInlinePrompt('guided', input)?.id ?? null);
      coached.push(quietChestInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'quiet-chest-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['quiet-chest-handoff', 'quiet-chest-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(quietChestInlinePrompt('guided', { scenarioVersion: '0.1.1', quietChest: snapshot(engine) }))
      .toBeNull();
    expect(quietChestInlinePrompt('guided', { scenarioVersion: '0.1.0', quietChest: patient })).toBeNull();
  });
});
