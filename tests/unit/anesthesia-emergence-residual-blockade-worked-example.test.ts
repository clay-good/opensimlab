/**
 * The anaesthesia module's fifteenth observed-state worked example, driven
 * through the real engine — and the FIRST with an assessment sidecar to read.
 *
 * Every earlier anaesthesia example had to gate on physiology, because these
 * lessons carry no recorded steps and the patient is the state. This lesson does
 * carry them, so the beats read ticks that are either null or not. That makes
 * the ordering trivial and the lesson hard, which is the right way round.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { EMERGENCE_WITH_RESIDUAL_BLOCKADE as SCENARIO } from '@anesthesia/scenarios/emergence-with-residual-blockade';
import { QUANTITATIVE_NEUROMUSCULAR_REVERSAL } from '@anesthesia/scenarios/quantitative-neuromuscular-reversal';
import { RAPID_SEQUENCE_INDUCTION } from '@anesthesia/scenarios/rapid-sequence-induction';
import { EMERGENCE_RESIDUAL_BLOCKADE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/emergence-with-residual-blockade-fixtures';
import {
  EMERGENCE_RESIDUAL_BLOCKADE_DEMONSTRATION_VERSION, emergenceResidualBlockadeDemonstrationStep,
  supportsEmergenceResidualBlockadeDemonstration, type EmergenceResidualBlockadeProgress,
} from '@anesthesia/demo/emergence-residual-blockade-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sidecar. */
  const progress = (): EmergenceResidualBlockadeProgress => {
    const assessment = engine.equipment().resuscitation.emergenceResidualBlockAssessment;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      monitorReviewedAtTick: assessment?.monitorReviewedAtTick ?? null,
      classification: assessment?.classification ?? null,
      plan: assessment?.plan ?? null,
      trainOfFourCount: state.trainOfFourCount ?? 4,
      trainOfFourRatio: state.trainOfFourRatio ?? 1,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = emergenceResidualBlockadeDemonstrationStep(progress());
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

describe('Requirement: The Emergence Example Reads A Sidecar, Not A Patient', () => {
  const fresh = runExample();
  // Handed a case where someone has already reviewed the monitor.
  const handover = runExample(FIXTURES.commonError.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(EMERGENCE_RESIDUAL_BLOCKADE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsEmergenceResidualBlockadeDemonstration(SCENARIO)).toBe(true);
    expect(supportsEmergenceResidualBlockadeDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The other two lessons in the block thread.
    expect(supportsEmergenceResidualBlockadeDemonstration(QUANTITATIVE_NEUROMUSCULAR_REVERSAL)).toBe(false);
    expect(supportsEmergenceResidualBlockadeDemonstration(RAPID_SEQUENCE_INDUCTION)).toBe(false);
  });

  it('advances every beat on recorded steps, in order, to a plan', () => {
    expect(fresh.beats).toEqual(['review', 'classify', 'defer']);
    expect(fresh.progress().classification).toBe('residual');
    expect(fresh.progress().plan).toBe('defer-extubation-and-support');
    // Nothing the example does is refused by the order gate.
    expect(fresh.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('reviews before classifying, and says the order is the lesson', () => {
    const review = fresh.narrations[0]!;
    expect(review).toContain('will not let you classify or plan before you do');
    expect(review).toContain('cannot distinguish a patient at 0.4 from one at 1.0');
  });

  it('names the hard part: believing an instrument over an examination', () => {
    const classify = fresh.narrations[fresh.beats.indexOf('classify')]!;
    expect(classify).toContain('everything except the number looks fine');
    expect(classify).toContain('believing an instrument over an examination');
  });

  it('treats the plan as following from the reading', () => {
    const defer = fresh.narrations[fresh.beats.indexOf('defer')]!;
    expect(defer).toContain('follows from the classification');
    expect(defer).toContain('this choice now makes itself');
  });

  it('declines the inference the last objective exists to prevent', () => {
    // A ratio at or above 0.9 would be necessary and not sufficient.
    expect(fresh.closing).toContain('necessary for extubation and would not have been sufficient');
    expect(fresh.closing).toContain('cannot clear the other four');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('picks up a case whose monitor someone else reviewed', () => {
    expect(handover.beats[0]).toBe('classify');
    expect(handover.beats).not.toContain('review');
    expect(handover.progress().plan).toBe('defer-extubation-and-support');
    expect(handover.events.filter((event) => event.eventId.includes('refused'))).toHaveLength(0);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'the operation went',
      'no harm came', 'he survived', 'was extubated safely']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = emergenceResidualBlockadeDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
