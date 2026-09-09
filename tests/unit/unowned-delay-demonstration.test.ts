/**
 * The worked example and observed-state tutor for a wait that nobody decided.
 *
 * The failure this example must not model is waiting until the delay gets worse. It is held
 * here to ringing the list before the evening is lost, and to never claiming the delay has
 * harmed her, because the randomised evidence this lesson carries would not support it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNOWNED_DELAY_A_WAIT_THAT_NOBODY_DECIDED as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/unowned-delay-a-wait-that-nobody-decided';
import { UNOWNED_DELAY_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/unowned-delay-fixtures';
import {
  UNOWNED_DELAY_DEMONSTRATION_VERSION, unownedDelayDemonstrationStep, supportsUnownedDelayDemonstration,
} from '../../src/modules/surgery-trauma/demo/unowned-delay-demonstration';
import { unownedDelayInlinePrompt } from '../../src/modules/surgery-trauma/unowned-delay-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.unownedDelay;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = unownedDelayDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'unowned-delay-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Names The Wait Before It Worsens', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UNOWNED_DELAY_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnownedDelayDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnownedDelayDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['fracture', 'reasons', 'pending', 'escalate', 'intent', 'boundaries',
      'hold', 'list', 'reassess', 'handoff']);
  });

  // The failure mode is treating the next cancellation as the thing that makes it count.
  it('rings the list before the evening is lost, not after it', () => {
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('list'));
    expect(narrations[beats.indexOf('escalate')]).toContain('ask for a name rather than for sympathy');
  });

  it('starts with the total nobody has written down', () => {
    expect(beats[0]).toBe('fracture');
    expect(narrations[0]).toContain('Start with the total, because nobody has ever written it down');
  });

  // Forbid the assertion, not the subject: the example must discuss delay and mortality as a
  // literature while refusing to claim this delay has hurt this patient.
  it('never asserts that the delay has harmed this patient, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['the delay has harmed', 'she has been harmed', 'will die',
      'proves', 'has already cost her']) {
      expect(joined, `the example asserted "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('a slot and a scan are fixed by two different telephone calls');
  });

  it('says why two days passed with nobody doing anything wrong', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('never been a number on this chart for anybody to react to');
    const list = narrations[beats.indexOf('list')]!;
    expect(list).toContain('Add it to the total rather than to tonight');
  });

  it('keeps the randomised result that undercuts its own urgency', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('found nothing');
    expect(boundaries).toContain('Going faster than prompt is not proven to help');
  });

  it('ends with the wait owned and nothing about the operation settled', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('the person who now holds it');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(unownedDelayInlinePrompt('unassisted', { scenarioVersion: '0.1.0', unownedDelay: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = unownedDelayDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', unownedDelay: patientNow };
      guided.push(unownedDelayInlinePrompt('guided', input)?.id ?? null);
      coached.push(unownedDelayInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'unowned-delay-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['unowned-delay-handoff', 'unowned-delay-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(unownedDelayInlinePrompt('guided', { scenarioVersion: '0.1.1', unownedDelay: snapshot(engine) }))
      .toBeNull();
    expect(unownedDelayInlinePrompt('guided', { scenarioVersion: '0.1.0', unownedDelay: patient })).toBeNull();
  });
});
