/**
 * The anaesthesia module's third observed-state worked example, driven through
 * the real engine.
 *
 * Its hardest gate is a direction rather than a level. The engine refuses a
 * reversal unless the block is receding, and the post-tetanic count cannot
 * establish that on its own — it reads 3 while the block is deepening and 1
 * again while it wears off. What separates the limbs is the pair of rocuronium
 * curves, and the thing worth asserting is that the example gates on their
 * crossover and is never refused.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { RAPID_SEQUENCE_INDUCTION as SCENARIO } from '@anesthesia/scenarios/rapid-sequence-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { RAPID_SEQUENCE_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/rapid-sequence-induction-fixtures';
import {
  RAPID_SEQUENCE_INDUCTION_DEMONSTRATION_VERSION, rapidSequenceInductionDemonstrationStep,
  supportsRapidSequenceInductionDemonstration, type RapidSequenceInductionProgress,
} from '@anesthesia/demo/rapid-sequence-induction-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): RapidSequenceInductionProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  const rocuronium = frame.concentrations.find((drug) => drug.drugId === 'rocuronium');
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    depthIndex: state.depthIndex ?? 100,
    trainOfFourCount: state.trainOfFourCount ?? 4,
    trainOfFourRatio: state.trainOfFourRatio ?? 1,
    postTetanicCount: equipment.resuscitation.postTetanicCount ?? 0,
    remifentanilPlasma: frame.concentrations.find((drug) => drug.drugId === 'remifentanil')?.plasma ?? 0,
    propofolPlasma: frame.concentrations.find((drug) => drug.drugId === 'propofol')?.plasma ?? 0,
    rocuroniumPlasma: rocuronium?.plasma ?? 0,
    rocuroniumEffectSite: rocuronium?.effectSite ?? 0,
    intubated: equipment.airway.intubated,
    reversed: equipment.resuscitation.lastNeuromuscularReversal != null,
    airwayAttempts: equipment.airway.attempts,
    airwayAttemptInProgress: equipment.airway.attemptInProgress,
  };
}

function runExample(opening: readonly LearnerAction[] = [], limit = 14_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const saturations: number[] = [];
  const events = [];
  let handed = 0;
  let frame = engine.step();
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = rapidSequenceInductionDemonstrationStep(progress(engine, frame));
    if (step.finished) {
      return { beats, narrations, saturations, events, closing: step.narration, engine, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
    saturations.push((frame.state as Readonly<Record<string, number>>).spo2Percent ?? 100);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Block Example Reads The Direction, Not The Level', () => {
  const fresh = runExample();
  // The error path's opening: no reserve, rocuronium before propofol, a late
  // airway, handed over with the patient paralysed and nothing reversed.
  const handover = runExample(FIXTURES.commonError);

  it('binds to this exact scenario version and no other', () => {
    expect(RAPID_SEQUENCE_INDUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsRapidSequenceInductionDemonstration(SCENARIO)).toBe(true);
    expect(supportsRapidSequenceInductionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.2.1' },
    })).toBe(false);
    // None of the three anaesthesia lessons before it runs this.
    expect(supportsRapidSequenceInductionDemonstration(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsRapidSequenceInductionDemonstration(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to a reversed block', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'filling', 'opioid', 'hypnotic', 'relaxant', 'onset', 'airway',
      'attempt-1', 'waiting-block', 'top-up', 'waiting-block', 'reverse',
    ]);
    expect(fresh.engine.equipment().airway.intubated).toBe(true);
    expect(fresh.engine.equipment().resuscitation.lastNeuromuscularReversal).not.toBeNull();
  });

  it('is never refused, because it gates on the limb rather than the count', () => {
    // This is the assertion the example exists for. A beat gated on the
    // post-tetanic count alone fires while the block is still deepening and is
    // rejected; gating on the crossover of the two rocuronium curves is what
    // makes every dispatch here acceptable to the engine.
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
    const reverse = fresh.narrations[fresh.beats.indexOf('reverse')]!;
    expect(reverse).toContain('the two curves have crossed');
    expect(reverse).toContain('it read the same on the way in');
  });

  it('waits for the count rather than for a number of minutes', () => {
    // Two beats dispatch nothing at all, and both are the ones a learner is
    // tempted to skip: the onset of the block, and its recession.
    expect(fresh.beats.indexOf('onset')).toBeLessThan(fresh.beats.indexOf('airway'));
    expect(fresh.narrations[fresh.beats.indexOf('onset')]!).toContain('Watch the count go to zero');
    expect(fresh.narrations[fresh.beats.indexOf('waiting-block')]!)
      .toContain('a fixed number of minutes is what people use when there is no monitor');
  });

  it('gives the hypnotic before the relaxant, and says why that is the lesson', () => {
    expect(fresh.beats.indexOf('hypnotic')).toBeLessThan(fresh.beats.indexOf('relaxant'));
    const hypnotic = fresh.narrations[fresh.beats.indexOf('hypnotic')]!;
    expect(hypnotic).toContain('the single error this lesson is built around');
    const relaxant = fresh.narrations[fresh.beats.indexOf('relaxant')]!;
    expect(relaxant).toContain('only now, because she is asleep');
  });

  it('names the peripheral monitor as a proxy rather than a promise', () => {
    const airway = fresh.narrations[fresh.beats.indexOf('airway')]!;
    expect(airway).toContain('does not guarantee the larynx');
    expect(airway).toContain('not a promise');
  });

  it('treats the depth index as the beat with the most at stake', () => {
    const topUp = fresh.narrations[fresh.beats.indexOf('top-up')]!;
    expect(topUp).toContain('cannot tell you she is awake');
    // And it states the monitor's own limit rather than borrowing its authority.
    expect(topUp).toContain('does not prove awareness or exclude it');
  });

  it('closes on the ratio rather than on the syringe', () => {
    expect(fresh.closing).toContain('the reversal being accepted is not the same claim');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
    expect(fresh.engine.equipment().airway.intubated).toBe(true);
  });

  it('keeps the reserve it built', () => {
    expect(Math.min(...fresh.saturations)).toBeGreaterThan(92);
  });

  it('picks up a case someone else began, including one it would not have begun', () => {
    // Handed the hurried induction, it starts after the airway rather than at
    // the beginning, and still reaches an accepted reversal — because it reads
    // the patient rather than a list of its own dispatches.
    expect(handover.beats).not.toContain('oxygen');
    expect(handover.beats).not.toContain('relaxant');
    expect(handover.beats).toContain('reverse');
    expect(handover.engine.equipment().resuscitation.lastNeuromuscularReversal).not.toBeNull();
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the operation went',
      'no harm came', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = rapidSequenceInductionDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
