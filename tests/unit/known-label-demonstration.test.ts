/**
 * The worked example and observed-state tutor for a diagnosis that explains everything.
 *
 * Two failures this example must not model: saying the label is wrong, and recording the
 * informant's account after she has gone. It is held here to taking the history while she is
 * still in the department, and to naming no competing diagnosis.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { KNOWN_LABEL_AN_EXPLANATION_THAT_EXCLUDES_NOTHING as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/known-label-an-explanation-that-excludes-nothing';
import { KNOWN_LABEL_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/known-label-fixtures';
import {
  KNOWN_LABEL_DEMONSTRATION_VERSION, knownLabelDemonstrationStep, supportsKnownLabelDemonstration,
} from '../../src/modules/surgery-trauma/demo/known-label-demonstration';
import { knownLabelInlinePrompt } from '../../src/modules/surgery-trauma/known-label-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.knownLabel;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = knownLabelDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'known-label-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Takes The History While She Is Still There', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(KNOWN_LABEL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsKnownLabelDemonstration(SCENARIO)).toBe(true);
    expect(supportsKnownLabelDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['label', 'carer', 'limits', 'escalate', 'intent', 'boundaries',
      'hold', 'handover', 'reassess', 'handoff']);
  });

  // The account does not keep. Recording it after she leaves is the failure.
  it('records the informant account before the shift change, not after it', () => {
    expect(beats.indexOf('carer')).toBeLessThan(beats.indexOf('handover'));
    expect(narrations[beats.indexOf('carer')]).toContain('while she is still standing here');
  });

  it('starts with the label and is fair to it', () => {
    expect(beats[0]).toBe('label');
    expect(narrations[0]).toContain('be fair to it');
    expect(narrations[0]).toContain('almost certainly still true');
  });

  // Forbid assertion-voice claims rather than bare nouns: the prose repeatedly affirms the
  // label, so a guard on the noun would match the affirmation.
  it('never says the label is wrong and never names a competing diagnosis, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['he is not constipated', 'the label is wrong', 'obstruction',
      'perforation', 'volvulus', 'proves', 'diagnosed with']) {
      expect(joined, `the example carried "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('explaining and excluding are different operations');
  });

  it('says what is about to leave the room and why the account was written down', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('not a test you can repeat later');
    const handover = narrations[beats.indexOf('handover')]!;
    expect(handover).toContain('because you wrote it down while she was here');
  });

  it('keeps the evidence that supports the label it warns about', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('It backs the label');
    expect(boundaries).toContain('Being usually right is how a label stops anybody looking');
  });

  it('ends with the assessment adjusted-for rather than impossible', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('in a way he could take part in');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(knownLabelInlinePrompt('unassisted', { scenarioVersion: '0.1.0', knownLabel: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = knownLabelDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', knownLabel: patientNow };
      guided.push(knownLabelInlinePrompt('guided', input)?.id ?? null);
      coached.push(knownLabelInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'known-label-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['known-label-handoff', 'known-label-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(knownLabelInlinePrompt('guided', { scenarioVersion: '0.1.1', knownLabel: snapshot(engine) }))
      .toBeNull();
    expect(knownLabelInlinePrompt('guided', { scenarioVersion: '0.1.0', knownLabel: patient })).toBeNull();
  });
});
