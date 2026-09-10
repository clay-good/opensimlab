/**
 * The worked example and observed-state tutor for a step attached to somebody's arrival.
 *
 * Three failures this example must not model: acting only once the review slips, naming an
 * agent or a dose, and blaming the registrar in theatre. It is held here to calling while the
 * plan still looks fine, and to describing the attachment rather than a person.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { DEFERRED_STEP_A_DECISION_ATTACHED_TO_A_PERSON as SCENARIO } from '../../src/modules/surgery-trauma/scenarios/deferred-step-a-decision-attached-to-a-person';
import { DEFERRED_STEP_FIXTURES as FIXTURES } from '../../src/modules/surgery-trauma/deferred-step-fixtures';
import {
  DEFERRED_STEP_DEMONSTRATION_VERSION, deferredStepDemonstrationStep, supportsDeferredStepDemonstration,
} from '../../src/modules/surgery-trauma/demo/deferred-step-demonstration';
import { deferredStepInlinePrompt } from '../../src/modules/surgery-trauma/deferred-step-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.deferredStep;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  const narrations: string[] = [];
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = deferredStepDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, narrations, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.action) engine.apply({ tick, type: 'deferred-step-response', payload: { action: step.action } });
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls While The Plan Still Looks Fine', () => {
  const { beats, narrations, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(DEFERRED_STEP_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsDeferredStepDemonstration(SCENARIO)).toBe(true);
    expect(supportsDeferredStepDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('runs to a handoff through the real engine, in the taught order', () => {
    expect(patient.ended).toBe('handoff');
    expect(beats).toEqual(['injury', 'pending', 'attachment', 'escalate', 'intent', 'boundaries',
      'hold', 'slip', 'reassess', 'handoff']);
  });

  // The deferral was already the problem before the review moved.
  it('calls before the review slips, not after it', () => {
    expect(beats.indexOf('escalate')).toBeLessThan(beats.indexOf('slip'));
    expect(narrations[beats.indexOf('escalate')]).toContain('while the plan still looks fine and nothing has gone wrong with it');
  });

  it('starts with the clock the thresholds are measured from', () => {
    expect(beats[0]).toBe('injury');
    expect(narrations[0]).toContain('Start with the right clock');
    expect(narrations[0]).toContain('nineteen minutes that do not exist');
  });

  // Forbid the assertion, not the subject: the example discusses infection as an outcome the
  // interval is spent against, while refusing to say this patient will get one.
  it('names no agent or dose, predicts no infection, and blames nobody, in any beat', () => {
    const joined = narrations.join(' ').toLowerCase();
    for (const claim of ['co-amoxiclav', 'cefazolin', 'gentamicin', 'mg/kg', 'grams',
      'she will become infected', 'will get infected', 'the registrar should have', 'proves']) {
      expect(joined, `the example carried "${claim}"`).not.toContain(claim);
    }
    expect(joined).toContain('nobody who wrote that sentence did anything wrong');
  });

  it('says the monitor is on nobody’s side and names what actually travelled', () => {
    const hold = narrations[beats.indexOf('hold')]!;
    expect(hold).toContain('on nobody’s side');
    const slip = narrations[beats.indexOf('slip')]!;
    expect(slip).toContain('The step moved, because it was attached to a person');
  });

  it('keeps both thresholds and the clock they are measured from', () => {
    const boundaries = narrations[beats.indexOf('boundaries')]!;
    expect(boundaries).toContain('Different thresholds, different clocks');
    expect(boundaries).toContain('You do not have a stopwatch');
  });

  it('ends with the step no longer waiting on an arrival', () => {
    expect(patient.teamObserved).toBe(true);
    expect(narrations.at(-1)).toContain('no longer waiting on anybody’s arrival');
  });

  it('says nothing at all on the unassisted setting', () => {
    const engine = create();
    engine.step();
    expect(deferredStepInlinePrompt('unassisted', { scenarioVersion: '0.1.0', deferredStep: snapshot(engine) }))
      .toBeNull();
  });

  it('withholds exactly the two non-urgent beats when coached', () => {
    const engine = create();
    const guided: (string | null)[] = []; const coached: (string | null)[] = [];
    for (let tick = 0; tick <= 200_000; tick += 1) {
      const patientNow = snapshot(engine);
      const step = deferredStepDemonstrationStep(patientNow);
      if (step.finished) break;
      const input = { scenarioVersion: '0.1.0', deferredStep: patientNow };
      guided.push(deferredStepInlinePrompt('guided', input)?.id ?? null);
      coached.push(deferredStepInlinePrompt('coached', input)?.id ?? null);
      if (step.action) engine.apply({ tick, type: 'deferred-step-response', payload: { action: step.action } });
      engine.step();
    }
    const withheld = [...new Set(guided.filter((id, index) => id !== null && coached[index] === null))];
    expect(withheld.sort()).toEqual(['deferred-step-handoff', 'deferred-step-hold']);
    expect(new Set(guided.filter((id): id is string => id !== null)).size).toBeGreaterThan(5);
  });

  it('is silent on a version it was not written for, and after the run ends', () => {
    const engine = create();
    engine.step();
    expect(deferredStepInlinePrompt('guided', { scenarioVersion: '0.1.1', deferredStep: snapshot(engine) }))
      .toBeNull();
    expect(deferredStepInlinePrompt('guided', { scenarioVersion: '0.1.0', deferredStep: patient })).toBeNull();
  });
});
