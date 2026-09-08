/**
 * The anaesthesia module's fourteenth observed-state worked example, driven
 * through the real engine.
 *
 * It is the second to gate a reversal on the crossover of the two rocuronium
 * curves rather than on the post-tetanic count, and the first to carry a beat
 * whose whole job is to show the trap: a reading that will be right in a few
 * minutes and is wrong now.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { QUANTITATIVE_NEUROMUSCULAR_REVERSAL as SCENARIO } from '@anesthesia/scenarios/quantitative-neuromuscular-reversal';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { QUANTITATIVE_REVERSAL_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/quantitative-neuromuscular-reversal-fixtures';
import {
  QUANTITATIVE_REVERSAL_DEMONSTRATION_VERSION, quantitativeReversalDemonstrationStep,
  supportsQuantitativeReversalDemonstration, type QuantitativeReversalProgress,
} from '@anesthesia/demo/quantitative-reversal-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 14_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): QuantitativeReversalProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    const rocuronium = frame.concentrations.find((drug) => drug.drugId === 'rocuronium');
    return {
      trainOfFourCount: state.trainOfFourCount ?? 4,
      trainOfFourRatio: state.trainOfFourRatio ?? 1,
      postTetanicCount: equipment.resuscitation.postTetanicCount ?? 0,
      rocuroniumPlasma: rocuronium?.plasma ?? 0,
      rocuroniumEffectSite: rocuronium?.effectSite ?? 0,
      reversed: equipment.resuscitation.lastNeuromuscularReversal != null,
      depthIndex: state.depthIndex ?? 100,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = quantitativeReversalDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, events, closing: step.narration, engine, progress, tick };
    }
    if (beats.at(-1) !== step.id) { beats.push(step.id); narrations.push(step.narration); }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Reversal Example Gates On The Limb, Not The Count', () => {
  const fresh = runExample();
  // Handed the error path: a wrong-limb attempt the engine already refused.
  const handover = runExample(FIXTURES.commonError);

  it('binds to this exact scenario version and no other', () => {
    expect(QUANTITATIVE_REVERSAL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsQuantitativeReversalDemonstration(SCENARIO)).toBe(true);
    expect(supportsQuantitativeReversalDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The lesson that reverses a block as its last objective, not its only one.
    expect(supportsQuantitativeReversalDemonstration(RAPID_SEQUENCE_INDUCTION)).toBe(false);
    expect(supportsQuantitativeReversalDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat on physiology, in order, to an accepted reversal', () => {
    expect(fresh.beats).toEqual(['baseline', 'deep', 'not-yet', 'deep', 'reverse']);
    expect(fresh.progress().reversed).toBe(true);
    // The example itself is never refused.
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('shows the trap rather than only the correct answer', () => {
    // The `not-yet` beat fires on the ascending limb, dispatches nothing, and
    // names the reading as one that will be right later and is wrong now.
    const notYet = fresh.narrations[fresh.beats.indexOf('not-yet')]!;
    expect(notYet).toContain('will be right in a few minutes and is wrong now');
    expect(notYet).toContain('they have not crossed');
    expect(fresh.beats.indexOf('not-yet')).toBeLessThan(fresh.beats.indexOf('reverse'));
  });

  it('records a baseline first, and says why it is not a formality', () => {
    expect(fresh.beats[0]).toBe('baseline');
    const baseline = fresh.narrations[0]!;
    expect(baseline).toContain('cannot tell a patient who has recovered from one who was never blocked');
  });

  it('gates the reversal on the crossover, not the count', () => {
    const reverse = fresh.narrations[fresh.beats.indexOf('reverse')]!;
    expect(reverse).toContain('come back down past the plasma');
    expect(reverse).toContain('on the monitor rather than on the clock');
  });

  it('has no separate confirmation beat, because one is unreachable', () => {
    // The quantitative ratio reaches 0.9 on the tick after an accepted reversal.
    expect(fresh.beats).not.toContain('confirming');
    expect(fresh.progress().trainOfFourRatio).toBeGreaterThanOrEqual(0.9);
    // What it had to say survives in the closing narration.
    expect(fresh.closing).toContain('not the same claim as the reversal having been accepted');
  });

  it('closes on the number that means two opposite things', () => {
    expect(fresh.closing).toContain('the same number, meaning opposite things');
    expect(fresh.closing).toContain('lags in both directions');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case whose reversal was already refused', () => {
    expect(handover.beats).not.toContain('baseline');
    expect(handover.beats).toContain('reverse');
    expect(handover.progress().reversed).toBe(true);
    // The one refusal in this run is the learner's, from before the handover.
    const refusals = handover.events.filter((event) => event.eventId.startsWith('bad-'));
    expect(refusals).toHaveLength(1);
    expect(refusals[0]!.eventId).toContain('sugammadex');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered fully', 'she was fine',
      'the operation went', 'no harm came', 'she survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = quantitativeReversalDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
