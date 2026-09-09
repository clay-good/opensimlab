/**
 * The anaesthesia module's thirty-first observed-state worked example, driven
 * through the real engine.
 *
 * The seventh to open with a beat that deliberately does nothing, and the only
 * one where acting early is permanently expensive rather than merely unrecorded:
 * a refused product action caps the second objective for the rest of the case.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { BLOOD_BANK_HANDOFF as SCENARIO } from '@anesthesia/scenarios/blood-bank-handoff';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from '@anesthesia/scenarios/unexpected-intraoperative-hemorrhage';
import { BLOOD_BANK_HANDOFF_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/blood-bank-handoff-fixtures';
import {
  BLOOD_BANK_HANDOFF_DEMONSTRATION_VERSION, bloodBankHandoffDemonstrationStep,
  supportsBloodBankHandoffDemonstration, type BloodBankHandoffProgress,
} from '@anesthesia/demo/blood-bank-handoff-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 6_000) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, BloodBankHandoffProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): BloodBankHandoffProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      hemorrhageActive: equipment.resuscitation.hemorrhageActive ?? false,
      bloodProductsReleased: equipment.resuscitation.bloodProductsReleased ?? false,
      packedRedBloodCellUnits: equipment.resuscitation.packedRedBloodCellUnits ?? 0,
      hemoglobinGPerDl: state.hemoglobinGPerDl ?? 0,
      meanArterialMmHg: state.meanArterialMmHg ?? 0,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = bloodBankHandoffDemonstrationStep(progress());
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

describe('Requirement: The Blood-Bank Example Calls Before It Reaches', () => {
  const fresh = runExample();
  // A learner who requested the release and handed the case back.
  const handover = runExample(FIXTURES.expert.slice(0, 1));

  it('binds to this exact scenario version and no other', () => {
    expect(BLOOD_BANK_HANDOFF_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsBloodBankHandoffDemonstration(SCENARIO)).toBe(true);
    expect(supportsBloodBankHandoffDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsBloodBankHandoffDemonstration(UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE)).toBe(false);
  });

  it('waits for the hemorrhage, where acting early is permanently expensive', () => {
    expect(fresh.beats[0]).toBe('watching');
    expect(fresh.snapshots.get('watching')!.hemorrhageActive).toBe(false);
    // It never reaches for a product early, so nothing is ever refused.
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('bad-blood-product-'))).toHaveLength(0);
    expect(fresh.events.filter(({ eventId }) =>
      eventId.startsWith('bad-blood-bank-request-'))).toHaveLength(0);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['watching', 'release', 'transfuse']);
    const recorded = fresh.progress();
    expect(recorded.bloodProductsReleased).toBe(true);
    expect(recorded.packedRedBloodCellUnits).toBe(2);
  });

  it('has the release recorded before any product is requested', () => {
    expect(fresh.snapshots.get('transfuse')!.bloodProductsReleased).toBe(true);
    expect(fresh.snapshots.get('release')!.packedRedBloodCellUnits).toBe(0);
    expect(fresh.beats.indexOf('release')).toBeLessThan(fresh.beats.indexOf('transfuse'));
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('transfuse');
    expect(handover.beats).not.toContain('watching');
    expect(handover.beats).not.toContain('release');
    expect(handover.progress().packedRedBloodCellUnits).toBe(2);
  });

  it('states the permanent cost of reaching early, before it could happen', () => {
    const release = fresh.narrations[fresh.beats.indexOf('release')]!;
    expect(release).toContain('BEFORE reaching for any product');
    expect(release).toContain('that one is remembered');
    expect(release).toContain('capped for the rest of the case');
  });

  it('names the quantity the last objective actually reads', () => {
    const transfuse = fresh.narrations[fresh.beats.indexOf('transfuse')]!;
    expect(transfuse).toContain('hemoglobin and calculated oxygen delivery rather than as pressure');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('67 mmHg against the 68 you just watched');
    expect(fresh.closing).toContain('falls from 10.2 to 9.1');
    expect(fresh.closing).toContain('the monitor shows the purchase and not the price');
    expect(fresh.closing).toContain('this is the exception');
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
    const step = bloodBankHandoffDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
