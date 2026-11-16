/**
 * deliberate-practice-loop → the expert overlay.
 *
 * The overlay draws two traces on one axis, and the whole risk is that it
 * quietly becomes a mark out of ten. These tests hold the two things that stop
 * it: every line names one behaviour and one consequence, and a reference run
 * that is no longer the same patient is withheld rather than drawn.
 */
import { describe, expect, it } from 'vitest';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import {
  OVERLAY_PARAMETERS, expertOverlay, expertPathFor, objectiveLines, overlayMarks, withheldReason,
} from '@anesthesia/debrief/expert-overlay';
import { EXPERT_PATHS } from '@anesthesia/debrief/expert-paths.generated';
import { EXPERT_TRACE_TOLERANCE } from '@anesthesia/debrief/expert-trace';
import { SCENARIOS } from '@anesthesia/scenarios';

const path = expertPathFor(EXPERT_PATHS, 'routine-induction')!;

const history = (vitals: Record<string, number>, ticks: readonly number[]) =>
  ticks.map((tick) => ({ tick, state: { ...vitals } as never, concentrations: {} as never }));

/** A replay that reproduces the recording exactly, at the ticks it sampled. */
const faithfulReplay = () => path.recorded.map((sample) => ({
  tick: sample.tick, state: { ...sample.vitals } as never, concentrations: {} as never,
}));

const input = (overrides: Partial<Parameters<typeof expertOverlay>[0]> = {}) => ({
  ticksPerSecond: TICKS_PER_SECOND,
  path,
  learnerHistory: history({ heartRateBpm: 72, meanArterialMmHg: 90, spo2Percent: 99, etco2MmHg: 35 }, [0, 100]),
  learnerActions: [{ tick: 500, type: 'bolus', payload: {} } as never],
  replayedHistory: faithfulReplay(),
  learnerFindings: [],
  expertFindings: [],
  ...overrides,
});

describe('the expert overlay', () => {
  it('draws both traces when the reference run is still the same patient', () => {
    const overlay = expertOverlay(input());
    expect(overlay.withheld).toBeNull();
    expect(overlay.series.map((series) => series.parameter)).toEqual([...OVERLAY_PARAMETERS]);
    for (const series of overlay.series) expect(series.expert.length).toBeGreaterThan(0);
  });

  /**
   * The measured tolerance decides this, not a judgement call: a parameter that
   * moves further than the engine was measured to move under another seed is a
   * different patient, and two different people on one axis is the one thing
   * the overlay must not draw.
   */
  it('withholds the trace when the replay drifts, and says which parameter and when', () => {
    const drifted = faithfulReplay().map((sample, index) => (index === 1 ? {
      ...sample,
      state: {
        ...(sample.state as unknown as Record<string, number>),
        heartRateBpm: ((sample.state as unknown as Record<string, number>).heartRateBpm ?? 0)
          + (EXPERT_TRACE_TOLERANCE.heartRateBpm ?? 2) + 5,
      } as never,
    } : sample));
    const overlay = expertOverlay(input({ replayedHistory: drifted }));
    expect(overlay.series).toEqual([]);
    expect(overlay.withheld).toMatch(/heartRateBpm/);
    expect(overlay.withheld).toMatch(/no longer the same patient/);
  });

  it('says so plainly when the lesson has no modelled patient', () => {
    const overlay = expertOverlay(input({ path: undefined }));
    expect(overlay.withheld).toMatch(/no modelled patient/);
    expect(overlay.series).toEqual([]);
    // The action marks survive: they are not part of the trace.
    expect(overlay.marks.length).toBeGreaterThan(0);
  });

  it('says so when the replay could not be run at all', () => {
    expect(expertOverlay(input({ replayedHistory: undefined })).withheld)
      .toMatch(/could not be reproduced/);
    expect(withheldReason({ within: false, tick: 1200 })).toMatch(/do not line up at tick 1200/);
  });

  it('marks both runs\' actions on one timeline, in time order', () => {
    const marks = overlayMarks(input());
    expect(marks.map((mark) => mark.tick)).toEqual([...marks.map((mark) => mark.tick)].sort((a, b) => a - b));
    expect(new Set(marks.map((mark) => mark.by))).toEqual(new Set(['learner', 'expert']));
  });
});

describe('what the overlay reports per objective', () => {
  const findings = (atTick: number | undefined, outcome = 'met') => [{
    objectiveId: 'preoxygenate', statement: 'Preoxygenate before induction', outcome, atTick,
  }];

  it('reports a difference only where both runs met the objective', () => {
    const both = objectiveLines(input({
      learnerFindings: findings(900), expertFindings: findings(300),
    }) as never)[0]!;
    expect(both.differenceSeconds).toBe((900 - 300) / TICKS_PER_SECOND);

    const learnerOnly = objectiveLines(input({
      learnerFindings: findings(900), expertFindings: findings(300, 'not-met'),
    }) as never)[0]!;
    // A gap between a moment and nothing is not a gap, and printing one would
    // make an unmet objective look like a slow one.
    expect(learnerOnly.differenceSeconds).toBeNull();
    expect(learnerOnly.expertTick).toBeNull();
  });

  it('keeps every objective the learner was measured on, in the scenario\'s order', () => {
    const scenario = SCENARIOS.find((entry) => entry.metadata.id === 'routine-induction')!;
    const learnerFindings = scenario.metadata.objectives.map((objective) => ({
      objectiveId: objective.id, statement: objective.statement, outcome: 'not-met' as const,
    }));
    const lines = objectiveLines(input({ learnerFindings }) as never);
    expect(lines.map((line) => line.objectiveId))
      .toEqual(scenario.metadata.objectives.map((objective) => objective.id));
  });
});

describe('every closed-loop lesson has a path the overlay can use', () => {
  it('carries all 39, with a recorded trace and replayable actions', () => {
    expect(EXPERT_PATHS).toHaveLength(39);
    for (const entry of EXPERT_PATHS) {
      expect(SCENARIOS.some((scenario) => scenario.metadata.id === entry.scenarioId), entry.scenarioId).toBe(true);
      expect(entry.expert.length, entry.scenarioId).toBeGreaterThan(0);
      expect(entry.recorded.length, entry.scenarioId).toBeGreaterThan(0);
      for (const action of entry.expert) expect(typeof action.type).toBe('string');
    }
  });

  /** A lesson outside the closed-loop module has no path, and the overlay says so. */
  it('has none for a state-transition lesson', () => {
    expect(expertPathFor(EXPERT_PATHS, 'undifferentiated-shock')).toBeUndefined();
  });
});
