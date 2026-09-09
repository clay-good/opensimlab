/**
 * The anaesthesia module's thirty-eighth and last observed-state worked example,
 * driven through the real engine.
 *
 * Its reduce beat fires on the recorded END-TIDAL concentration rather than on a
 * tick, because the objective it serves is measured from the moment of reduction
 * and a reduction made before the wash-in target would not count at all — the
 * gate has to read the same quantity the rubric does.
 */
import { describe, expect, it } from 'vitest';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { LearnerAction } from '@platform/kernel/protocol';
import { ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION as SCENARIO } from '@anesthesia/scenarios/routine-pediatric-inhalational-induction';
import { ROUTINE_PEDIATRIC_IV_INDUCTION } from '@anesthesia/scenarios/routine-pediatric-iv-induction';
import { ROUTINE_PEDIATRIC_INHALATIONAL_INDUCTION_FIXTURES as FIXTURES } from '../../src/modules/anesthesia/routine-pediatric-inhalational-induction-fixtures';
import {
  PEDIATRIC_INHALATIONAL_INDUCTION_DEMONSTRATION_VERSION,
  pediatricInhalationalInductionDemonstrationStep,
  supportsPediatricInhalationalInductionDemonstration,
  type PediatricInhalationalInductionProgress,
} from '@anesthesia/demo/pediatric-inhalational-induction-demonstration';

function runExample(opening: readonly LearnerAction[] = [], limit = 4_200) {
  const engine = new AnesthesiaEngine({ scenario: SCENARIO, seed: FIXTURES.seed, practiceRegion: 'US' });
  const beats: string[] = [];
  const narrations: string[] = [];
  const snapshots = new Map<string, PediatricInhalationalInductionProgress>();
  const submitted = new Set<string>();
  const events = [];
  let handed = 0;
  let frame = engine.step();
  /** The same assembly the cockpit does, from the same sources. */
  const progress = (): PediatricInhalationalInductionProgress => {
    const ventilator = engine.equipment().ventilator;
    const state = frame.state as Readonly<Record<string, number>>;
    return {
      inspiredOxygenFraction: ventilator.fio2,
      freshGasFlowLPerMin: ventilator.freshGasFlowLPerMin ?? 0,
      sevofluranePercent: ventilator.sevofluranePercent ?? 0,
      endTidalSevofluranePercent: state.endTidalSevofluranePercent ?? 0,
      ventilatorDelivering: ventilator.delivering,
    };
  };
  for (let tick = 1; tick <= limit; tick += 1) {
    while (opening[handed]?.tick === tick) { engine.apply(opening[handed]!); handed += 1; }
    if (handed < opening.length) { frame = engine.step(); events.push(...frame.events); continue; }
    const step = pediatricInhalationalInductionDemonstrationStep(progress());
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

describe('Requirement: The Inhalational Example Comes Down On Time', () => {
  const fresh = runExample();
  // A learner who prepared the circuit and handed the case back.
  const handover = runExample([FIXTURES.expert[0]!]);

  it('binds to this exact scenario version and no other', () => {
    expect(PEDIATRIC_INHALATIONAL_INDUCTION_DEMONSTRATION_VERSION).toBe('0.1.0');
    expect(supportsPediatricInhalationalInductionDemonstration(SCENARIO)).toBe(true);
    expect(supportsPediatricInhalationalInductionDemonstration({
      ...SCENARIO, metadata: { ...SCENARIO.metadata, version: '0.1.1' },
    })).toBe(false);
    // The other paediatric induction lesson, with the same-sized child.
    expect(supportsPediatricInhalationalInductionDemonstration(ROUTINE_PEDIATRIC_IV_INDUCTION)).toBe(false);
  });

  it('advances every beat on observed state, in order', () => {
    expect(fresh.beats).toEqual(['prepare', 'wash-in', 'reduce']);
    expect(new Set(fresh.beats).size).toBe(fresh.beats.length);
    const recorded = fresh.progress();
    expect(recorded.sevofluranePercent).toBe(2);
    expect(recorded.freshGasFlowLPerMin).toBeGreaterThanOrEqual(6);
  });

  it('prepares the circuit with the vaporizer still off', () => {
    // The restraint clause, honoured rather than described.
    expect(fresh.snapshots.get('wash-in')!.sevofluranePercent).toBe(0);
    expect(fresh.snapshots.get('wash-in')!.inspiredOxygenFraction).toBe(1);
    expect(fresh.snapshots.get('wash-in')!.freshGasFlowLPerMin).toBe(6);
    expect(fresh.narrations[fresh.beats.indexOf('prepare')]!)
      .toContain('The vaporizer staying off is part of the objective');
  });

  it('reduces on the end-tidal value rather than on a tick', () => {
    // The gate reads the same quantity the rubric does.
    expect(fresh.snapshots.get('reduce')!.endTidalSevofluranePercent).toBeGreaterThanOrEqual(2);
    expect(fresh.snapshots.get('reduce')!.sevofluranePercent).toBe(6);
    expect(fresh.narrations[fresh.beats.indexOf('reduce')]!)
      .toContain('measures the sixty seconds that follow this action');
  });

  it('watches the end-tidal number rather than the dial during wash-in', () => {
    const washIn = fresh.narrations[fresh.beats.indexOf('wash-in')]!;
    expect(washIn).toContain('Watch the END-TIDAL number rather than the dial');
    expect(washIn).toContain('not interchangeable');
  });

  it('resumes from the step a learner actually reached', () => {
    expect(handover.beats[0]).toBe('wash-in');
    expect(handover.beats).not.toContain('prepare');
    expect(handover.progress().sevofluranePercent).toBe(2);
  });

  it('declines the credit its own demonstration would take', () => {
    expect(fresh.closing).toContain('about WHEN that reduction happened');
    expect(fresh.closing).toContain('the same settled numbers you are looking at now');
    expect(fresh.closing).toContain('still scores the third objective only partly met');
    expect(fresh.closing).toContain('Finishing in the right place is not the same as having got there safely');
    expect(fresh.closing).toContain('ends the example, not the evaluation');
  });

  it('never predicts an outcome for a child', () => {
    const everything = [...fresh.narrations, fresh.closing, ...handover.narrations].join(' ').toLowerCase();
    for (const forbidden of ['he did well', 'she did well', 'recovered fully', 'was fine',
      'no harm came', 'survived', 'the operation went', 'woke up happy']) {
      expect(everything, forbidden).not.toContain(forbidden);
    }
  });

  it('says nothing before the first snapshot', () => {
    const step = pediatricInhalationalInductionDemonstrationStep(undefined);
    expect(step.id).toBe('preparing');
    expect(step.dispatch).toBeUndefined();
    expect(step.progress).toBe(0);
  });
});
