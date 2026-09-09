/**
 * The anaesthesia module's thirty-fourth observed-state worked example, driven
 * through the real engine.
 *
 * It carries the module's longest hold: a no-dispatch waiting beat spanning
 * thirty simulated minutes after the insulin intent, because the repeat check is
 * refused until the interval has elapsed.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PERIOPERATIVE_HYPERGLYCEMIA as SCENARIO } from '@anesthesia/scenarios/perioperative-hyperglycemia';
import { HYPOTHERMIA_AND_REWARMING } from '@anesthesia/scenarios/hypothermia-and-rewarming';
import { PERIOPERATIVE_HYPERGLYCEMIA_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/perioperative-hyperglycemia-fixtures';
import {
  PERIOPERATIVE_HYPERGLYCEMIA_DEMONSTRATION_VERSION,
  perioperativeHyperglycemiaDemonstrationStep,
  supportsPerioperativeHyperglycemiaDemonstration,
  type PerioperativeHyperglycemiaProgress,
} from '@anesthesia/demo/perioperative-hyperglycemia-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 20_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, PerioperativeHyperglycemiaProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same source. */
  const progress = (): PerioperativeHyperglycemiaProgress =>
    engine.equipment().resuscitation.glycemicResponse as PerioperativeHyperglycemiaProgress;
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = perioperativeHyperglycemiaDemonstrationStep(progress());
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

describe('Requirement: The Glycemic Example Waits The Interval Out', () => {
  const fresh = runExample();
  // A learner who confirmed the glucose and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(PERIOPERATIVE_HYPERGLYCEMIA_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPerioperativeHyperglycemiaDemonstration(SCENARIO)).toBe(true);
    // This lesson lives at 0.1.1, so the look-alike check uses a different one.
    expect(supportsPerioperativeHyperglycemiaDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.0' },
    })).toBe(false);
    expect(supportsPerioperativeHyperglycemiaDemonstration(HYPOTHERMIA_AND_REWARMING)).toBe(false);
  });

  it('advances every beat on observed state, in order, including the hold', () => {
    expect(fresh.beats).toEqual(['watching', 'confirm', 'protocol', 'waiting', 'repeat']);
    const recorded = fresh.progress();
    expect(recorded.pointOfCareConfirmedAtTick).not.toBeNull();
    expect(recorded.insulinProtocolIntentAtTick).not.toBeNull();
    expect(recorded.repeatPointOfCareAtTick).not.toBeNull();
  });

  it('waits for the glucose course before recording anything', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.snapshots.get('watching')!.pointOfCareGlucoseMgPerDl).toBeNull();
  });

  it('never asks for the repeat early, so nothing is refused', () => {
    // The waiting beat exists precisely to prevent this.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('repeat-glucose-too-early-'))).toHaveLength(0);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('glycemic-order-refused-'))).toHaveLength(0);
    expect(fresh.snapshots.get('waiting')!.repeatEligible).toBe(false);
    expect(fresh.snapshots.get('repeat')!.repeatEligible).toBe(true);
  });

  it('holds for the whole declared interval', () => {
    // Thirty simulated minutes: 18,000 ticks between intent and repeat.
    const recorded = fresh.progress();
    expect(recorded.repeatPointOfCareAtTick! - recorded.insulinProtocolIntentAtTick!)
      .toBeGreaterThanOrEqual(18_000);
  });

  it('confirms before it records the protocol', () => {
    expect(fresh.snapshots.get('protocol')!.pointOfCareConfirmedAtTick).not.toBeNull();
    expect(fresh.snapshots.get('confirm')!.insulinProtocolIntentAtTick).toBeNull();
    expect(fresh.beats.indexOf('confirm')).toBeLessThan(fresh.beats.indexOf('protocol'));
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('protocol');
    expect(handover.beats).not.toContain('confirm');
    expect(handover.progress().repeatPointOfCareAtTick).not.toBeNull();
  });

  it('calls the waiting an action rather than dead time', () => {
    const waiting = fresh.narrations[fresh.beats.indexOf('waiting')]!;
    expect(waiting).toContain('dispatches nothing');
    expect(waiting).toContain('the interval the third objective is actually about');
    // And the repeat beat says why the interval exists.
    expect(fresh.narrations[fresh.beats.indexOf('repeat')]!)
      .toContain('measures the assay and the last dose rather than the response');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('The repeat value is authored');
    expect(fresh.closing).toContain('grades whether the check was made, never what it found');
    expect(fresh.closing).toContain('lost to impatience rather than to neglect');
    expect(fresh.closing).toContain('this is a documentation lesson and it says so');
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
    const step = perioperativeHyperglycemiaDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
