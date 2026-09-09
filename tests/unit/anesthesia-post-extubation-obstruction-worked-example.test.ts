/**
 * The anaesthesia module's twenty-eighth observed-state worked example, driven
 * through the real engine.
 *
 * The maneuver here is HELD for a bounded number of seconds rather than latched
 * on, so the beat after it reads the patency — a quantity that only rises once
 * the bundle is complete — and no beat can walk backwards as the hold decays.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { POST_EXTUBATION_OBSTRUCTION as SCENARIO } from '@anesthesia/scenarios/post-extubation-obstruction';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from '@anesthesia/scenarios/laryngospasm-after-airway-stimulation';
import { POST_EXTUBATION_OBSTRUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/post-extubation-obstruction-fixtures';
import {
  POST_EXTUBATION_OBSTRUCTION_DEMONSTRATION_VERSION,
  postExtubationObstructionDemonstrationStep,
  supportsPostExtubationObstructionDemonstration,
  type PostExtubationObstructionProgress,
} from '@anesthesia/demo/post-extubation-obstruction-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, PostExtubationObstructionProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): PostExtubationObstructionProgress => {
    const equipment = engine.equipment();
    return {
      obstructionSeverity: equipment.airway.postExtubationObstructionSeverity ?? 0,
      helpRequestedAtTick: equipment.airway.helpRequestedAtTick ?? null,
      ventilatorDelivering: equipment.ventilator.delivering,
      inspiredOxygenFraction: equipment.ventilator.fio2,
      jawThrustCpapSecondsRemaining: equipment.airway.jawThrustCpapSecondsRemaining ?? 0,
      patencyFraction: equipment.airway.patencyFraction ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = postExtubationObstructionDemonstrationStep(progress());
    if (step.finished) {
      return { beats, narrations, events, snapshots, closing: step.narration, engine, progress, tick };
    }
    if (beats.at(-1) !== step.id) {
      beats.push(step.id); narrations.push(step.narration);
      if (!snapshots.has(step.id)) snapshots.set(step.id, progress());
    }
    if (step.dispatch && !submitted.has(step.id)) {
      submitted.add(step.id);
      engine.apply({ tick, ...step.dispatch });
    }
    frame = engine.step();
    events.push(...frame.events);
  }
  throw new Error(`The example did not finish within ${limit} ticks. Beats: ${beats.join(' → ')}`);
}

describe('Requirement: The Obstruction Example Gives The Bundle Whole', () => {
  const fresh = runExample();
  // A learner who called for help and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(POST_EXTUBATION_OBSTRUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPostExtubationObstructionDemonstration(SCENARIO)).toBe(true);
    expect(supportsPostExtubationObstructionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsPostExtubationObstructionDemonstration(LARYNGOSPASM_AFTER_AIRWAY_STIMULATION)).toBe(false);
  });

  it('waits for the scripted pattern before acting', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.narrations[0]).toContain('acting now records nothing against them');
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('bad-airway-maneuver-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order, and opens the airway', () => {
    expect(fresh.beats).toEqual(['watching', 'recognize', 'deliver', 'maneuver']);
    const recorded = fresh.progress();
    expect(recorded.helpRequestedAtTick).not.toBeNull();
    expect(recorded.ventilatorDelivering).toBe(true);
    expect(recorded.patencyFraction).toBeGreaterThanOrEqual(0.95);
  });

  it('has delivery already running when the maneuver goes on', () => {
    // The conjunction is the lesson: the maneuver goes on TOP of delivery.
    expect(fresh.snapshots.get('maneuver')!.ventilatorDelivering).toBe(true);
    expect(fresh.snapshots.get('maneuver')!.inspiredOxygenFraction).toBeGreaterThanOrEqual(0.95);
    expect(fresh.snapshots.get('deliver')!.jawThrustCpapSecondsRemaining).toBe(0);
    expect(fresh.beats.indexOf('deliver')).toBeLessThan(fresh.beats.indexOf('maneuver'));
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('deliver');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('recognize');
    expect(handover.progress().patencyFraction).toBeGreaterThanOrEqual(0.95);
  });

  it('says the delivery will not open anything on its own', () => {
    const deliver = fresh.narrations[fresh.beats.indexOf('deliver')]!;
    expect(deliver).toContain('this will not open anything');
    expect(deliver).toContain('half of a bundle');
    // And the maneuver beat names which half does which job.
    expect(fresh.narrations[fresh.beats.indexOf('maneuver')]!)
      .toContain('on TOP of the breath delivery rather than instead of it');
  });

  it('sends the learner to the volume rather than the oximeter', () => {
    const recognize = fresh.narrations[fresh.beats.indexOf('recognize')]!;
    expect(recognize).toContain('the saturation will not tell you');
    expect(recognize).toContain('Read the effort and the volume, not the oximeter');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('BETTER than the 97%');
    expect(fresh.closing).toContain('Neither half of this bundle works alone');
    expect(fresh.closing).toContain('the saturation is the wrong instrument for this lesson'.replace('the s', 'The s'));
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the operation went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = postExtubationObstructionDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
