/**
 * The worked example and observed-state tutor for the interval nobody else can see.
 *
 * Two failures this example must not model: waiting until the knife is asked for, and acting
 * because it knows the side is wrong. It is held here to speaking while nothing has been asked
 * for, and to never resolving the discrepancy in either direction.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { UNSPOKEN_DOUBT_AN_INTERVAL_NOBODY_ELSE_CAN_SEE as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/unspoken-doubt-an-interval-nobody-else-can-see';
import { UNSPOKEN_DOUBT_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/unspoken-doubt-fixtures';
import {
  UNSPOKEN_DOUBT_DEMONSTRATION_VERSION, unspokenDoubtDemonstrationStep, supportsUnspokenDoubtDemonstration,
} from '../../src/modules/surgery-trauma/demo/unspoken-doubt-demonstration';
import { unspokenDoubtInlinePrompt } from '../../src/modules/surgery-trauma/unspoken-doubt-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.unspokenDoubt;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = unspokenDoubtDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'unspoken-doubt-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Speaks Before The Knife Is Asked For', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(UNSPOKEN_DOUBT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsUnspokenDoubtDemonstration(SCENARIO)).toBe(true);
    expect(supportsUnspokenDoubtDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['noticed', 'wrong', 'asymmetry', 'say', 'intent', 'boundaries',
      'hold', 'knife', 'reassess', 'handoff']);
  });

  it('speaks before the knife is asked for, not after it', () => {
    expect(beats.indexOf('say')).toBeLessThan(beats.indexOf('knife'));
    expect(narrations[beats.indexOf('say')]).toContain('while nobody has asked for anything and there is nothing to undo');
  });

  it('states the ways of being wrong before the request, and says why', () => {
    expect(beats.indexOf('wrong')).toBeLessThan(beats.indexOf('say'));
    expect(narrations[beats.indexOf('wrong')]).toContain('do it first');
  });

  // Assertion-voice guards: the narration insists nobody has done anything wrong, so a bare
  // noun guard would match the insistence rather than a violation.
  it('never asserts the side is wrong and never names an error, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['the wrong side', 'they are about to operate on the wrong',
      'somebody has made an error', 'the consultant is wrong', 'proves']) {
      expect(joined, `the example carried "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('it is not a claim that anybody has done anything wrong');
  });

  it('says which clock is running and that nobody else can see it', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('the only one nobody else can see');
    const knife = narrations[beats.indexOf('knife')]!;
    expect(knife).toContain('Nothing changed');
  });

  it('keeps the review that doubts exercises like this one', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('This rehearsal is one of those interventions');
    expect(boundaries).toContain('It is in the list on purpose');
  });

  it('ends by naming what the module was about', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('Nothing here settles whether you were right');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(unspokenDoubtInlinePrompt('unassisted', { scenarioVersion: '0.1.0', unspokenDoubt: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = unspokenDoubtDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', unspokenDoubt: patientNow };
      guided.push(unspokenDoubtInlinePrompt('guided', input)?.id ?? null);
      coached.push(unspokenDoubtInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'unspoken-doubt-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['unspoken-doubt-handoff', 'unspoken-doubt-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(unspokenDoubtInlinePrompt('guided', { scenarioVersion: '0.1.1', unspokenDoubt: snapshot(engine) }))
      .toBeNull();
    expect(unspokenDoubtInlinePrompt('guided', { scenarioVersion: '0.1.0', unspokenDoubt: patient })).toBeNull();
  });
});
