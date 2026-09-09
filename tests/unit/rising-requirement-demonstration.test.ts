/**
 * The worked example and observed-state tutor for a limb whose only moving finding is the
 * requirement.
 *
 * The failure this example must not model is waiting for a better number before calling. It
 * is held here to calling the team before any further measurement is sought, and to never
 * naming the diagnosis, because nothing available in the lesson can establish it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { RISING_REQUIREMENT_A_NUMBER_THAT_UNDER_CALLS as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/rising-requirement-a-number-that-under-calls';
import { RISING_REQUIREMENT_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/rising-requirement-fixtures';
import {
  RISING_REQUIREMENT_DEMONSTRATION_VERSION, risingRequirementDemonstrationStep, supportsRisingRequirementDemonstration,
} from '../../src/modules/surgery-trauma/demo/rising-requirement-demonstration';
import { risingRequirementInlinePrompt } from '../../src/modules/surgery-trauma/rising-requirement-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.risingRequirement;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = risingRequirementDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'rising-requirement-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls Before The Number', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(RISING_REQUIREMENT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRisingRequirementDemonstration(SCENARIO)).toBe(true);
    expect(supportsRisingRequirementDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['clock', 'requirement', 'reading', 'escalate', 'intent', 'boundaries',
      'observe', 'hold', 'reassess', 'handoff']);
  });

  it('calls the team before it seeks any further number', () => {
    // The whole failure mode is clearing a measurement first, so the example must not model it.
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('observe'));
    expect(narrations[beats.indexOf('escalate')]).toContain('before any further measurement');
  });

  it('starts the record with the clock rather than the observations', () => {
    expect(beats[0]).toBe('clock');
    expect(narrations[0]).toContain('Start the record with the clock');
  });

  // Forbid the assertion, not the word: the example has to be able to name the diagnosis it is
  // refusing to claim, and to quote the findings that do not settle it.
  it('never asserts the diagnosis, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['this is compartment syndrome', 'he has compartment syndrome',
      'is a compartment syndrome', 'confirms compartment syndrome', 'excludes compartment syndrome',
      'proves', 'diagnosed with']) {
      expect(joined, `the example asserted "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('one number, taken once, is neither of those');
  });

  it('says the unchanging findings are not reassurance', () => {
    const observe = narrations[beats.indexOf('observe')]!;
    expect(observe).toContain('None of that is reassurance');
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('no monitor carries');
  });

  it('ends with the decision owned by the surgical team', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('what one reading could not settle');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(risingRequirementInlinePrompt('unassisted', { scenarioVersion: '0.1.0', risingRequirement: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = risingRequirementDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', risingRequirement: patientNow };
      guided.push(risingRequirementInlinePrompt('guided', input)?.id ?? null);
      coached.push(risingRequirementInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'rising-requirement-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['rising-requirement-handoff', 'rising-requirement-observe']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(risingRequirementInlinePrompt('guided', { scenarioVersion: '0.1.1', risingRequirement: snapshot(engine) }))
      .toBeNull();
    expect(risingRequirementInlinePrompt('guided', { scenarioVersion: '0.1.0', risingRequirement: patient })).toBeNull();
  });
});
