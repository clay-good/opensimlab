/**
 * The anaesthesia module's thirty-fifth observed-state worked example, driven
 * through the real engine.
 *
 * The only one gated on the CLOCK rather than on latched state, which the lesson
 * forces: nothing observable distinguishes "too early" from "just right" except
 * the time itself.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ROUTINE_INHALATIONAL_MAINTENANCE as SCENARIO } from '@anesthesia/scenarios/routine-inhalational-maintenance';
import { ROUTINE_INDUCTION } from '@anesthesia/scenarios/routine-induction';
import { ROUTINE_INHALATIONAL_MAINTENANCE_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-inhalational-maintenance-fixtures';
import {
  INHALATIONAL_MAINTENANCE_DEMONSTRATION_VERSION,
  inhalationalMaintenanceDemonstrationStep,
  supportsInhalationalMaintenanceDemonstration,
  type InhalationalMaintenanceProgress,
} from '@anesthesia/demo/inhalational-maintenance-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 5_400) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, InhalationalMaintenanceProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (tick: number): InhalationalMaintenanceProgress => {
    const equipment = engine.equipment();
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      tick,
      stimulusActive: (state.surgicalStimulus ?? 0) > 0,
      sevofluranePercent: equipment.ventilator.sevofluranePercent ?? 0,
      remifentanilRate: equipment.drugs
        .find((drug) => drug.drugId === 'remifentanil')?.infusionRate ?? 0,
      depthIndex: state.depthIndex ?? 100,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = inhalationalMaintenanceDemonstrationStep(progress(tick));
    if (step.finished) {
      return { beats, narrations, events, snapshots, closing: step.narration, engine, progress, tick };
    }
    if (beats.at(-1) !== step.id) {
      beats.push(step.id); narrations.push(step.narration);
      if (!snapshots.has(step.id)) snapshots.set(step.id, progress(tick));
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

describe('Requirement: The Maintenance Example Waits To Deepen', () => {
  const fresh = runExample();

  it('binds to this exact scenario version and no other', () => {
    expect(INHALATIONAL_MAINTENANCE_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsInhalationalMaintenanceDemonstration(SCENARIO)).toBe(true);
    expect(supportsInhalationalMaintenanceDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    expect(supportsInhalationalMaintenanceDemonstration(ROUTINE_INDUCTION)).toBe(false);
  });

  it('advances every beat in order, including two deliberate holds', () => {
    expect(fresh.beats).toEqual([
      'infusion', 'waiting', 'deepen', 'holding', 'withdraw', 'settling',
      'stop-infusion',
    ]);
    // No beat is re-entered: an earlier draft re-emitted 'deepen' after the
    // withdrawal and would have re-dispatched 4% sevoflurane in the cockpit.
    expect(new Set(fresh.beats).size).toBe(fresh.beats.length);
    const recorded = fresh.progress(fresh.tick);
    expect(recorded.remifentanilRate).toBe(0);
    expect(recorded.sevofluranePercent).toBe(1.4);
  });

  it('starts the infusion well before the stimulus', () => {
    // The second objective needs it running at tick 2,400.
    expect(fresh.snapshots.get('waiting')!.tick).toBeLessThan(2400);
    expect(fresh.snapshots.get('waiting')!.remifentanilRate).toBeGreaterThan(0);
  });

  it('holds the deepening until just before the stimulus', () => {
    // The whole skill. Deepening at the infusion beat would score worse.
    const deepenTick = fresh.snapshots.get('deepen')!.tick;
    expect(deepenTick).toBeGreaterThanOrEqual(2350);
    expect(deepenTick).toBeLessThan(2400);
    expect(fresh.snapshots.get('waiting')!.sevofluranePercent).toBeLessThan(2);
  });

  it('withdraws the volatile promptly after the stimulus', () => {
    const withdrawTick = fresh.snapshots.get('withdraw')!.tick;
    expect(withdrawTick).toBeGreaterThanOrEqual(2600);
    expect(fresh.snapshots.get('withdraw')!.sevofluranePercent).toBe(4);
    expect(fresh.snapshots.get('stop-infusion')!.sevofluranePercent).toBe(1.4);
  });

  it('states the timing consequence before it acts on it', () => {
    const deepen = fresh.narrations[fresh.beats.indexOf('deepen')]!;
    expect(deepen).toContain('The timing is the whole skill');
    expect(deepen).toContain('not more cautious, it is measurably worse');
    // And the withdraw beat names deepening as a loan.
    expect(fresh.narrations[fresh.beats.indexOf('withdraw')]!)
      .toContain('a loan, not a gift');
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('19.5% to 29.6%');
    expect(fresh.closing).toContain('worse than doing nothing at all');
    expect(fresh.closing).toContain('deepening early lowers its own denominator');
    expect(fresh.closing).toContain('a tenth of a percentage point');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a person', () => {
    const everything = [...fresh.narrations, fresh.closing].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the operation went']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = inhalationalMaintenanceDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
