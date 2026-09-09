/**
 * The anaesthesia module's twenty-sixth observed-state worked example, driven
 * through the real engine.
 *
 * The third to open with a beat that deliberately does nothing: the bounded
 * ephedrine action is refused outright before the scripted block declares
 * itself, and every objective is timed from that moment.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP as SCENARIO } from '@anesthesia/scenarios/high-spinal-after-epidural-top-up';
import { HYPOTENSION_AFTER_INDUCTION } from '@anesthesia/scenarios/hypotension-after-induction';
import { HIGH_SPINAL_AFTER_EPIDURAL_TOP_UP_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/high-spinal-after-epidural-top-up-fixtures';
import {
  HIGH_SPINAL_DEMONSTRATION_VERSION, highSpinalDemonstrationStep,
  supportsHighSpinalDemonstration, type HighSpinalProgress,
} from '@anesthesia/demo/high-spinal-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 8_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, HighSpinalProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): HighSpinalProgress => {
    const equipment = engine.equipment();
    return {
      severity: equipment.resuscitation.highSpinalFraction ?? 0,
      helpRequestedAtTick: equipment.airway.helpRequestedAtTick ?? null,
      ventilatorDelivering: equipment.ventilator.delivering,
      inspiredOxygenFraction: equipment.ventilator.fio2,
      crystalloidTotalMl: equipment.resuscitation.crystalloidTotalMl ?? 0,
      ephedrineTotalMg: equipment.resuscitation.ephedrineTotalMg ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = highSpinalDemonstrationStep(progress());
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

describe('Requirement: The High-Spinal Example Ventilates Before It Treats', () => {
  const fresh = runExample();
  // A learner who called for help and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(HIGH_SPINAL_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsHighSpinalDemonstration(SCENARIO)).toBe(true);
    expect(supportsHighSpinalDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsHighSpinalDemonstration(HYPOTENSION_AFTER_INDUCTION)).toBe(false);
  });

  it('waits for the block before acting at all', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.narrations[0]).toContain('acting early records nothing and treats nothing');
    // The bounded ephedrine action is never refused, because it is never early.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('bad-ephedrine-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual([
      'watching', 'help', 'breathe', 'crystalloid', 'ephedrine',
    ]);
    const recorded = fresh.progress();
    expect(recorded.helpRequestedAtTick).not.toBeNull();
    expect(recorded.ventilatorDelivering).toBe(true);
    expect(recorded.crystalloidTotalMl).toBeGreaterThanOrEqual(500);
    expect(recorded.ephedrineTotalMg).toBe(12);
  });

  it('ventilates before it gives anything', () => {
    // The order is the lesson. Read from the snapshots, not the final state.
    expect(fresh.snapshots.get('crystalloid')!.ventilatorDelivering).toBe(true);
    expect(fresh.snapshots.get('breathe')!.crystalloidTotalMl).toBe(0);
    expect(fresh.beats.indexOf('breathe')).toBeLessThan(fresh.beats.indexOf('crystalloid'));
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('breathe');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('help');
    expect(handover.progress().ephedrineTotalMg).toBe(12);
  });

  it('names the breathing as the action the patient lives or dies by', () => {
    const breathe = fresh.narrations[fresh.beats.indexOf('breathe')]!;
    expect(breathe).toContain('the action the patient lives or dies by');
    expect(breathe).toContain('the ventilation is what kills');
    // And the crystalloid beat states the ordering as consequence, not style.
    expect(fresh.narrations[fresh.beats.indexOf('crystalloid')]!)
      .toContain('not a stylistic preference here');
  });

  it('declines the credit its own demonstration would take', () => {
    // The honest closing reports all three findings, including that the
    // treatment it just performed did not restore the pressure.
    expect(fresh.closing).toContain('earns the circulation objective outright');
    expect(fresh.closing).toContain('its saturation reaches 0%');
    expect(fresh.closing).toContain('holds 97%, identical to this one');
    expect(fresh.closing).toContain('did not fix the pressure either');
    expect(fresh.closing).toContain('fails it exactly as a run that reaches 0% does');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['she did well', 'she recovered', 'she was fine', 'the baby',
      'no harm came', 'she survived', 'delivered safely']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = highSpinalDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
