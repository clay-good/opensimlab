/**
 * The anaesthesia module's twenty-seventh observed-state worked example, driven
 * through the real engine.
 *
 * The fourth to open with a beat that deliberately does nothing: the bounded
 * source-control action is refused before the scripted event, and every
 * objective is timed from it.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { VENOUS_AIR_EMBOLISM_DURING_LINE_REMOVAL as SCENARIO } from '@anesthesia/scenarios/venous-air-embolism-during-line-removal';
import { PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE } from '@anesthesia/scenarios/pneumothorax-under-positive-pressure';
import { VENOUS_AIR_EMBOLISM_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/venous-air-embolism-fixtures';
import {
  VENOUS_AIR_EMBOLISM_DEMONSTRATION_VERSION, venousAirEmbolismDemonstrationStep,
  supportsVenousAirEmbolismDemonstration, type VenousAirEmbolismProgress,
} from '@anesthesia/demo/venous-air-embolism-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 8_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, VenousAirEmbolismProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): VenousAirEmbolismProgress => {
    const equipment = engine.equipment();
    return {
      severity: equipment.resuscitation.venousAirEmbolismFraction ?? 0,
      helpRequestedAtTick: equipment.airway.helpRequestedAtTick ?? null,
      entryControlled: equipment.resuscitation.venousAirEntryControlled ?? false,
      ventilatorDelivering: equipment.ventilator.delivering,
      inspiredOxygenFraction: equipment.ventilator.fio2,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = venousAirEmbolismDemonstrationStep(progress());
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

describe('Requirement: The Air-Embolism Example Stops The Source First', () => {
  const fresh = runExample();
  // A learner who called for help and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(VENOUS_AIR_EMBOLISM_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsVenousAirEmbolismDemonstration(SCENARIO)).toBe(true);
    expect(supportsVenousAirEmbolismDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsVenousAirEmbolismDemonstration(PNEUMOTHORAX_UNDER_POSITIVE_PRESSURE)).toBe(false);
  });

  it('waits for the event before acting at all', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.narrations[0]).toContain('acting early records nothing');
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('venous-air-entry-control-refused-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'escalate', 'stop-entry', 'oxygen']);
    const recorded = fresh.progress();
    expect(recorded.helpRequestedAtTick).not.toBeNull();
    expect(recorded.entryControlled).toBe(true);
    expect(recorded.inspiredOxygenFraction).toBe(1);
  });

  it('stops the source before it turns up the oxygen', () => {
    // The order is the lesson. Read from the snapshots, not the final state.
    expect(fresh.snapshots.get('oxygen')!.entryControlled).toBe(true);
    expect(fresh.snapshots.get('stop-entry')!.ventilatorDelivering).toBe(false);
    expect(fresh.beats.indexOf('stop-entry')).toBeLessThan(fresh.beats.indexOf('oxygen'));
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('stop-entry');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('escalate');
    expect(handover.progress().entryControlled).toBe(true);
  });

  it('names the source control as the action the patient responds to', () => {
    const stop = fresh.narrations[fresh.beats.indexOf('stop-entry')]!;
    expect(stop).toContain('the action the patient actually responds to');
    expect(stop).toContain('only this stops more of it');
  });

  it('gives the oxygen for the physiology rather than for the monitor', () => {
    // The honest instruction, given what this bounded model then shows.
    const oxygen = fresh.narrations[fresh.beats.indexOf('oxygen')]!;
    expect(oxygen).toContain('will not show you its benefit');
    expect(oxygen).toContain('not because the monitor will thank you');
  });

  it('reads the capnogram rather than the oximeter', () => {
    const escalate = fresh.narrations[fresh.beats.indexOf('escalate')]!;
    expect(escalate).toContain('while the saturation has barely moved');
    expect(escalate).toContain('waiting for a number that will not change much');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('earns the oxygenation objective and ends with an end-tidal carbon dioxide of 17');
    expect(fresh.closing).toContain('does nothing at all ends at 16 and 55');
    expect(fresh.closing).toContain('scoring two of the four objectives');
    expect(fresh.closing).toContain('sees almost no signal');
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
    const step = venousAirEmbolismDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
