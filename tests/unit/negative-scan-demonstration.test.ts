/**
 * The worked example and observed-state tutor for a scan that cannot say no.
 *
 * A demonstration is expected to arrive somewhere, and this one must not. If the example
 * ended with a leak confirmed, it would teach exactly the reflex the lesson refuses — so
 * it is held here to finishing with the leak neither confirmed nor excluded, and to never
 * saying which it is along the way.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { NEGATIVE_SCAN_A_SCAN_THAT_CANNOT_SAY_NO as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/negative-scan-a-scan-that-cannot-say-no';
import { NEGATIVE_SCAN_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/negative-scan-fixtures';
import {
  NEGATIVE_SCAN_DEMONSTRATION_VERSION, negativeScanDemonstrationStep, supportsNegativeScanDemonstration,
} from '../../src/modules/surgery-trauma/demo/negative-scan-demonstration';
import { negativeScanInlinePrompt } from '../../src/modules/surgery-trauma/negative-scan-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.negativeScan;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = negativeScanDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'negative-scan-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Ends Without Settling The Leak', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(NEGATIVE_SCAN_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsNegativeScanDemonstration(SCENARIO)).toBe(true);
    expect(supportsNegativeScanDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['course', 'progress', 'limits', 'escalate', 'intent', 'boundaries',
      'observe', 'hold', 'reassess', 'handoff']);
  });

  it('reads the patient against his operation before it reads the scan', () => {
    // The order is the lesson. A learner who opens with the report has already
    // accepted it as the thing to be argued with.
    expect(beats.indexOf('course')).toBeLessThan(beats.indexOf('limits'));
    expect(narrations[0]).toContain('Start with the operation, not the observations');
  });

  // Forbid the assertion, not the word. An earlier version of this guard also banned "no leak"
  // and "rules out", which the example contains only inside "no evidence of a leak is not the
  // same sentence as no leak" and "what the report could not rule out" — the exact sentences
  // doing the teaching. A guard that fires on prose negating a claim is testing the wrong thing.
  it('never asserts whether this is a leak, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['this is a leak', 'he has a leak', 'there is a leak', 'is leaking',
      'confirms a leak', 'confirmed a leak', 'excludes a leak', 'has no leak',
      'is not a leak', 'proves']) {
      expect(joined, `the example asserted "${claim}"`).not.toContain(claim);
    }
    // And the two sentences that carry the teaching are present rather than merely not-absent.
    expect(joined).toContain('is not the same sentence as no leak');
    expect(joined).toContain('could not rule out');
  });

  it('narrates both authored waits as contrasts rather than as clinical waiting', () => {
    const observe = narrations[beats.indexOf('observe')]!;
    const hold = narrations[beats.indexOf('hold')]!;
    expect(observe).toContain('contrast rather than a clinical wait');
    expect(hold).toContain('not reassurance and it is not deterioration');
    // The scenario refuses waiting before escalating, so neither wait may read as one.
    expect(`${observe} ${hold}`).not.toContain('wait for');
  });

  it('ends with the decision owned by the operating team, not by the learner', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('what the report could not rule out');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(negativeScanInlinePrompt('unassisted', { scenarioVersion: '0.1.0', negativeScan: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = negativeScanDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', negativeScan: patientNow };
      guided.push(negativeScanInlinePrompt('guided', input)?.id ?? null);
      coached.push(negativeScanInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'negative-scan-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    // Exactly two, and exactly these: the authored-wait beat and the handoff. Everything the
    // learner would be wrong to skip stays audible on the coached setting.
    expect(withheld.sort()).toEqual(['negative-scan-handoff', 'negative-scan-observe']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(negativeScanInlinePrompt('guided', { scenarioVersion: '0.1.1', negativeScan: snapshot(engine) }))
      .toBeNull();
    expect(negativeScanInlinePrompt('guided', { scenarioVersion: '0.1.0', negativeScan: patient })).toBeNull();
  });
});
