/**
 * The anaesthesia module's thirty-third observed-state worked example, driven
 * through the real engine.
 *
 * All three of its gates are latched ticks, so none can walk backwards even
 * though the quantity they are about falls and then rises — a gate on the
 * temperature itself would reverse mid-run.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { HYPOTHERMIA_AND_REWARMING as SCENARIO } from '@anesthesia/scenarios/hypothermia-and-rewarming';
import { EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA } from '@anesthesia/scenarios/early-malignant-hyperthermia-during-volatile-anesthesia';
import { HYPOTHERMIA_AND_REWARMING_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/hypothermia-and-rewarming-fixtures';
import {
  HYPOTHERMIA_REWARMING_DEMONSTRATION_VERSION, hypothermiaRewarmingDemonstrationStep,
  supportsHypothermiaRewarmingDemonstration, type HypothermiaRewarmingProgress,
} from '@anesthesia/demo/hypothermia-rewarming-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 9_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, HypothermiaRewarmingProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): HypothermiaRewarmingProgress => {
    const thermal = engine.equipment().resuscitation.thermalResponse;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      targetTemperatureC: thermal?.targetTemperatureC ?? null,
      coreTemperatureConfirmedAtTick: thermal?.coreTemperatureConfirmedAtTick ?? null,
      forcedAirWarmingAtTick: thermal?.forcedAirWarmingAtTick ?? null,
      warmedBulkFluidsAtTick: thermal?.warmedBulkFluidsAtTick ?? null,
      coreTemperatureC: state.coreTemperatureC ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = hypothermiaRewarmingDemonstrationStep(progress());
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

describe('Requirement: The Rewarming Example Names The Action That Works', () => {
  const fresh = runExample();
  // A learner who confirmed the temperature and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(HYPOTHERMIA_REWARMING_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHypothermiaRewarmingDemonstration(SCENARIO)).toBe(true);
    expect(supportsHypothermiaRewarmingDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The module's other temperature lesson, in the opposite direction.
    expect(supportsHypothermiaRewarmingDemonstration(
      EARLY_MALIGNANT_HYPERTHERMIA_DURING_VOLATILE_ANESTHESIA,
    )).toBe(false);
  });

  it('waits for the cooling course before recording anything', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.snapshots.get('watching')!.targetTemperatureC).toBeNull();
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('thermal-response-refused-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'confirm', 'surface', 'fluids']);
    const recorded = fresh.progress();
    expect(recorded.coreTemperatureConfirmedAtTick).not.toBeNull();
    expect(recorded.forcedAirWarmingAtTick).not.toBeNull();
    expect(recorded.warmedBulkFluidsAtTick).not.toBeNull();
  });

  it('confirms before it warms, which the engine also enforces', () => {
    expect(fresh.snapshots.get('surface')!.coreTemperatureConfirmedAtTick).not.toBeNull();
    expect(fresh.snapshots.get('confirm')!.forcedAirWarmingAtTick).toBeNull();
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('thermal-order-refused-'))).toHaveLength(0);
  });

  it('gates on latched ticks rather than the temperature it is about', () => {
    // The beats advance forward while the temperature they are about falls, so
    // a gate keyed on the temperature would run backwards through them. The
    // latched ticks only ever increase.
    const atConfirm = fresh.snapshots.get('confirm')!.coreTemperatureC;
    const atSurface = fresh.snapshots.get('surface')!.coreTemperatureC;
    const atFluids = fresh.snapshots.get('fluids')!.coreTemperatureC;
    expect(atSurface).toBeLessThanOrEqual(atConfirm);
    expect(atFluids).toBeLessThanOrEqual(atSurface);
    const recorded = fresh.progress();
    expect(recorded.coreTemperatureConfirmedAtTick!)
      .toBeLessThan(recorded.forcedAirWarmingAtTick!);
    expect(recorded.forcedAirWarmingAtTick!)
      .toBeLessThan(recorded.warmedBulkFluidsAtTick!);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('surface');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('confirm');
    expect(handover.progress().warmedBulkFluidsAtTick).not.toBeNull();
  });

  it('says the fluids beat will not be seen to work, before it is not', () => {
    const fluids = fresh.narrations[fresh.beats.indexOf('fluids')]!;
    expect(fluids).toContain('this simulator will not show you it working');
    expect(fluids).toContain('no delivery and no thermal transfer modelled');
    // And the surface beat claims the trajectory it actually carries.
    expect(fresh.narrations[fresh.beats.indexOf('surface')]!)
      .toContain('the whole of the rewarming trajectory');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('identical to a patient nobody treated at all');
    expect(fresh.closing).toContain('moves the modelled temperature by nothing');
    expect(fresh.closing).toContain('not a reason to skip warmed fluids in a real theatre');
    expect(fresh.closing).toContain('from 36.36 to 35.83');
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
    const step = hypothermiaRewarmingDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
