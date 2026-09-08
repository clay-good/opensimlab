/**
 * The anaesthesia module's fifth observed-state worked example, driven through
 * the real engine.
 *
 * What is new here is that the response is a conjunction rather than a list.
 * The engine relieves the modelled closure only while a held maneuver, positive
 * pressure, 95% oxygen and a depth index at or below 60 are all true at once, so
 * the deepening beat exists to satisfy a precondition rather than to add a
 * second treatment beside the first — and the example has to say so.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION as SCENARIO } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { AWARENESS_UNDER_PARALYSIS } from '@anesthesia/scenarios/awareness-under-paralysis';
import { LARYNGOSPASM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/laryngospasm-after-airway-stimulation-fixtures';
import {
  LARYNGOSPASM_DEMONSTRATION_VERSION, laryngospasmDemonstrationStep,
  supportsLaryngospasmDemonstration, type LaryngospasmProgress,
} from '@anesthesia/demo/laryngospasm-demonstration';

/** The same assembly the cockpit does, from the same sources. */
function progress(
  engine: AnesthesiaEngine, frame: ReturnType<AnesthesiaEngine['step']>,
): LaryngospasmProgress {
  const equipment = engine.equipment();
  const state = frame.state as Readonly<Record<string, number>>;
  return {
    inspiredOxygenFraction: equipment.ventilator.fio2,
    ventilatorDelivering: equipment.ventilator.delivering,
    endTidalOxygenFraction: state.endTidalO2Fraction ?? 0,
    patencyFraction: equipment.airway.patencyFraction,
    jawThrustSecondsRemaining: equipment.airway.jawThrustCpapSecondsRemaining,
    depthIndex: state.depthIndex ?? 100,
    spo2Percent: state.spo2Percent ?? 100,
  };
}

function runExample(opening: readonly LearnerAction[] = [], limit = 12_000) {
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
    const step = laryngospasmDemonstrationStep(progress(engine, frame));
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

describe('Requirement: The Closure Example Treats The Response As A Conjunction', () => {
  const fresh = runExample();
  // Handed a case where the oxygen went on far too late — the error path's own
  // opening — and asked to manage the closure from there.
  const handover = runExample(FIXTURES.commonError.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(LARYNGOSPASM_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsLaryngospasmDemonstration(SCENARIO)).toBe(true);
    expect(supportsLaryngospasmDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsLaryngospasmDemonstration(ROUTINE_INDUCTION)).toBe(false);
    expect(supportsLaryngospasmDemonstration(AWARENESS_UNDER_PARALYSIS)).toBe(false);
  });

  it('advances every beat on physiology, in order, to an open airway', () => {
    expect(fresh.beats).toEqual([
      'oxygen', 'filling', 'watching', 'maneuver', 'deepen', 'holding',
    ]);
    expect(fresh.engine.equipment().airway.patencyFraction).toBeGreaterThan(0.95);
    expect(fresh.events.filter((event) => event.eventId.startsWith('bad-'))).toHaveLength(0);
  });

  it('holds the maneuver before it reaches for the syringe', () => {
    expect(fresh.beats.indexOf('maneuver')).toBeLessThan(fresh.beats.indexOf('deepen'));
    // And it says the maneuver is not sufficient alone rather than implying it.
    expect(fresh.narrations[fresh.beats.indexOf('maneuver')]!)
      .toContain('not sufficient on its own');
  });

  it('says the dose is the enabling condition, not an adjunct', () => {
    // The engine relieves the closure only at a depth of 60 or below, so a
    // token dose at exactly the right moment scores the same and opens nothing.
    const deepen = fresh.narrations[fresh.beats.indexOf('deepen')]!;
    expect(deepen).toContain('a token dose given at exactly the right moment');
    expect(deepen).toContain('it is what makes the maneuver work');
  });

  it('keeps the beat where the preparation is already finished', () => {
    // Two beats dispatch nothing, and this is the one that matters: at the
    // moment the stimulus arrives there is nothing left to do about it.
    expect(fresh.beats.indexOf('watching')).toBeLessThan(fresh.beats.indexOf('maneuver'));
    expect(fresh.narrations[fresh.beats.indexOf('watching')]!)
      .toContain('the preparation is already finished');
  });

  it('names what this lesson does not stock rather than implying it is absent', () => {
    const holding = fresh.narrations[fresh.beats.indexOf('holding')]!;
    expect(holding).toContain('no suction, no airway adjunct, no succinylcholine');
    expect(holding).toContain('outside what the model is entitled to show you');
  });

  it('declines the credit its own closing number would take', () => {
    // The saturation it ends on is mostly the three minutes of oxygen rather
    // than the last minute of treatment, and it says which earned what.
    expect(fresh.closing).toContain('does not desaturate over this whole window');
    expect(fresh.closing).toContain('What the maneuver and the dose bought is the airway itself');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('keeps the reserve it built', () => {
    expect(Math.min(...fresh.saturations)).toBeGreaterThan(92);
  });

  it('picks up a case that arrived without a reserve, and still opens the airway', () => {
    expect(handover.beats).not.toContain('filling');
    expect(handover.beats).toContain('maneuver');
    expect(handover.beats).toContain('deepen');
    expect(handover.engine.equipment().airway.patencyFraction).toBeGreaterThan(0.95);
    // And it pays for the missing preparation, which the fresh run does not.
    expect(Math.min(...handover.saturations)).toBeLessThan(92);
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'he recovered', 'he was fine', 'the operation went',
      'no harm came', 'he survived']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = laryngospasmDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
