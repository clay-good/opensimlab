/**
 * The anaesthesia module's thirty-sixth observed-state worked example, driven
 * through the real engine.
 *
 * A separate demonstration from the emergency-medicine lesson of the same shape:
 * that lesson's guard checks its own scenario id and requires an empty
 * formulary, so neither can drive the other.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { PERSISTENT_VF_CARDIAC_ARREST as SCENARIO } from '@anesthesia/scenarios/persistent-vf-cardiac-arrest';
import { PERSISTENT_VF_CARDIAC_ARREST_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/persistent-vf-cardiac-arrest-fixtures';
import {
  PERSISTENT_VF_CARDIAC_ARREST_DEMONSTRATION_VERSION,
  persistentVfCardiacArrestDemonstrationStep,
  supportsPersistentVfCardiacArrestDemonstration,
  type PersistentVfCardiacArrestProgress,
} from '@anesthesia/demo/persistent-vf-cardiac-arrest-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 3_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, PersistentVfCardiacArrestProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): PersistentVfCardiacArrestProgress => {
    const resuscitation = engine.equipment().resuscitation;
    return {
      arrestActive: resuscitation.cardiacArrestActive ?? false,
      compressionsActive: resuscitation.chestCompressionsActive ?? false,
      arrestEpinephrineTotalMg: resuscitation.arrestEpinephrineTotalMg ?? 0,
      defibrillationShockCount: resuscitation.defibrillationShockCount ?? 0,
      roscAtTick: resuscitation.roscAtTick ?? null,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = persistentVfCardiacArrestDemonstrationStep(progress());
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

describe('Requirement: The VF Example Shocks Into A Prepared Rhythm', () => {
  const fresh = runExample();
  // A learner who started compressions and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(PERSISTENT_VF_CARDIAC_ARREST_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPersistentVfCardiacArrestDemonstration(SCENARIO)).toBe(true);
    expect(supportsPersistentVfCardiacArrestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // Emergency medicine's lesson of the same shape carries a different id.
    expect(supportsPersistentVfCardiacArrestDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, id: 'persistent-vf-arrest' },
    })).toBe(false);
  });

  it('waits for the arrest before reaching for any control', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.snapshots.get('watching')!.arrestActive).toBe(false);
    // Nothing is refused, because it never acts before the rhythm changes.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('bad-compressions-'))).toHaveLength(0);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('bad-defibrillation-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'compressions', 'epinephrine', 'shock']);
    expect(new Set(fresh.beats).size).toBe(fresh.beats.length);
    const recorded = fresh.progress();
    expect(recorded.roscAtTick).not.toBeNull();
    expect(recorded.arrestEpinephrineTotalMg).toBe(1);
    expect(recorded.defibrillationShockCount).toBe(1);
  });

  it('has every conversion condition in place before it shocks', () => {
    const atShock = fresh.snapshots.get('shock')!;
    expect(atShock.compressionsActive).toBe(true);
    expect(atShock.arrestEpinephrineTotalMg).toBe(1);
    expect(atShock.defibrillationShockCount).toBe(0);
    // And the drug came after compressions were already running.
    expect(fresh.snapshots.get('epinephrine')!.compressionsActive).toBe(true);
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('epinephrine');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('compressions');
    expect(handover.progress().roscAtTick).not.toBeNull();
  });

  it('says why compressions come before the defibrillator', () => {
    const compressions = fresh.narrations[fresh.beats.indexOf('compressions')]!;
    expect(compressions).toContain('before reaching for the defibrillator');
    expect(compressions).toContain('reliably makes the shock fail');
    // And the shock beat names the conjunction.
    expect(fresh.narrations[fresh.beats.indexOf('shock')]!)
      .toContain('That conjunction is the lesson');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('conjunctive rather than sufficient');
    expect(fresh.closing).toContain('CANNOT BE FAILED');
    expect(fresh.closing).toContain('a run that fires six shocks earns that objective');
    expect(fresh.closing).toContain('a real principle recorded against a scenario that cannot test it');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the operation went', 'made a full recovery']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = persistentVfCardiacArrestDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
