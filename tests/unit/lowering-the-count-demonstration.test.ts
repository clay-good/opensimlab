/**
 * The worked example and observed-state tutor for a number that can be moved.
 *
 * Leukostasis is a clinical diagnosis and the count is the part of it a treatment
 * moves fastest, so both refused shortcuts here substitute the number for the
 * patient. The example's own risk is subtler: a tidy write-up that calls for help
 * last, while he deteriorates on the clock.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import { LOWERING_THE_COUNT_A_NUMBER_THAT_CAN_BE_MOVED as SCENARIO } from '../../src/modules/oncology/scenarios/lowering-the-count-a-number-that-can-be-moved';
import { LOWERING_THE_COUNT_FIXTURES as FIXTURES } from '../../src/modules/oncology/lowering-the-count-fixtures';
import { LOWERING_THE_COUNT_DETERIORATION_TICKS as DETERIORATION } from '../../src/modules/oncology/lowering-the-count';
import {
  LOWERING_THE_COUNT_DEMONSTRATION_VERSION, loweringTheCountDemonstrationStep,
  supportsLoweringTheCountDemonstration,
} from '../../src/modules/oncology/demo/lowering-the-count-demonstration';
import { loweringTheCountInlinePrompt } from '../../src/modules/oncology/lowering-the-count-tutor';

const create = () => new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
const snapshot = (engine: AnesthesiaEngine) => engine.equipment().resuscitation.loweringTheCount;

function runDemonstration(limit = 200_000) {
  const engine = create();
  const beats: string[] = [];
  let escalatedAtTick: number | null = null;
  for (let tick = 0; tick <= limit; tick += 1) {
    const step = loweringTheCountDemonstrationStep(snapshot(engine));
    if (step.finished) return { beats, escalatedAtTick, patient: snapshot(engine)! };
    if (beats.at(-1) !== step.id) beats.push(step.id);
    if (step.action) {
      engine.apply({ tick, type: 'lowering-the-count-response', payload: { action: step.action } });
      if (step.action === 'escalate-to-haematology-now' && escalatedAtTick === null) escalatedAtTick = tick;
    }
    engine.step();
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Example Calls For Help Second, Not Last', () => {
  const { beats, escalatedAtTick, patient } = runDemonstration();

  it('binds to this exact scenario version and no other', () => {
    expect(LOWERING_THE_COUNT_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLoweringTheCountDemonstration(SCENARIO)).toBe(true);
    expect(supportsLoweringTheCountDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
  });

  it('escalates immediately after the picture, ahead of the rest of the write-up', () => {
    expect(beats[0]).toBe('picture');
    expect(beats[1]).toBe('escalate');
    for (const later of ['licence', 'intent', 'boundaries']) {
      expect(beats.indexOf('escalate'), later).toBeLessThan(beats.indexOf(later));
    }
  });

  it('has help called well before he deteriorates', () => {
    expect(escalatedAtTick).not.toBeNull();
    expect(escalatedAtTick!).toBeLessThan(DETERIORATION);
    expect(patient.clinicallyWorse).toBe(true);
    expect(patient.ended).toBe('handoff');
  });

  it('takes none of the four shortcuts the scenario refuses', () => {
    expect(patient.countOnlyAttempted).toBe(false);
    expect(patient.apheresisStandDownAttempted).toBe(false);
    expect(patient.waitForMarrowAttempted).toBe(false);
    expect(patient.deliriumAttempted).toBe(false);
  });
});

describe('Requirement: The Patient Moves And The Count Does Not', () => {
  it('deteriorates on the clock while the supplied count is unchanged', () => {
    // The contrast the lesson turns on, asserted against the engine rather than
    // the narration: watching the number here would have shown nothing.
    const engine = create();
    const before = snapshot(engine)!.whiteCellCount;
    for (let tick = 0; tick <= DETERIORATION + 10; tick += 1) engine.step();
    const after = snapshot(engine)!;
    expect(after.clinicallyWorse).toBe(true);
    expect(after.whiteCellCount).toBe(before);
    expect(after.leukostasisIsClinical).toBe(true);
  });
});

describe('Requirement: The Tutor Never Points At The Count', () => {
  it('opens on the clinical picture, then on calling for help', () => {
    const engine = create(); engine.step();
    expect(loweringTheCountInlinePrompt('guided', {
      scenarioVersion: '0.1.0', loweringTheCount: snapshot(engine),
    })?.id).toBe('lowering-the-count-picture');
    engine.apply({ tick: 0, type: 'lowering-the-count-response', payload: { action: 'record-the-clinical-picture-not-the-count' } });
    engine.step();
    const next = loweringTheCountInlinePrompt('guided', {
      scenarioVersion: '0.1.0', loweringTheCount: snapshot(engine),
    })!;
    expect(next.id).toBe('lowering-the-count-escalate');
    // Urgent, so the coached level carries it too.
    expect(loweringTheCountInlinePrompt('coached', {
      scenarioVersion: '0.1.0', loweringTheCount: snapshot(engine),
    })?.id).toBe('lowering-the-count-escalate');
  });

  it('never names a count threshold or a procedure as the thing to do', () => {
    const engine = create();
    const seen: string[] = [];
    for (const action of ['record-the-clinical-picture-not-the-count', 'escalate-to-haematology-now',
      'record-what-the-count-does-and-does-not-license', 'record-bounded-cytoreduction-intent'] as const) {
      const prompt = loweringTheCountInlinePrompt('guided', {
        scenarioVersion: '0.1.0', loweringTheCount: snapshot(engine),
      });
      if (prompt) seen.push(`${prompt.suggestion} ${prompt.because}`.toLowerCase());
      engine.apply({ tick: 0, type: 'lowering-the-count-response', payload: { action } });
      engine.step();
    }
    expect(seen.length).toBeGreaterThan(3);
    for (const text of seen) {
      expect(text, 'no numeric threshold').not.toMatch(/\d+\s*(x\s*10|×\s*10|,000)/);
      for (const forbidden of ['send him for apheresis', 'start apheresis', 'lower the count to']) {
        expect(text, forbidden).not.toContain(forbidden);
      }
    }
  });

  it('is silent when unassisted and bound to the exact content version', () => {
    const engine = create(); engine.step();
    const patient = snapshot(engine);
    expect(loweringTheCountInlinePrompt('unassisted', { scenarioVersion: '0.1.0', loweringTheCount: patient })).toBeNull();
    expect(loweringTheCountInlinePrompt('guided', { scenarioVersion: '0.1.1', loweringTheCount: patient })).toBeNull();
  });
});
