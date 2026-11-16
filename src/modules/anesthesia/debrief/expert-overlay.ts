/**
 * The expert overlay's data (learning/deliberate-practice → expert overlay).
 *
 * What this builds: the learner's trace and the expert's on one set of axes,
 * each accepted action marked on both, and one line per objective saying when
 * each of them met it and by how much they differ.
 *
 * WHAT IT REFUSES TO BUILD, and the refusal is the design. There is no sum, no
 * mean, no score and no distance between the two runs. Every line names one
 * behaviour and one consequence, which is the rule the private tutor already
 * follows, and `tests/arch/expert-overlay-has-no-score.test.ts` holds this
 * module to it. A single number comparing a learner to an expert is a ranking
 * whatever it is called, and the one thing this overlay must not become is a
 * mark out of ten.
 *
 * The expert transcript was recorded under its fixture's seed. A learner's
 * session may carry a different one - an assignment link, or a blind draw -
 * so the caller replays the expert actions under the LEARNER's seed and passes
 * the result in. If that replay is not the same patient any more, within the
 * measured tolerance, the overlay withholds the trace and says which parameter
 * moved and when. Drawing it anyway would put two different people on one axis
 * and label one of them the expert.
 */

import type { HistorySample } from '@platform/session/session-store';
import type { LearnerAction } from '@platform/kernel/protocol';
import {
  expertTraceWithinTolerance, type ExpertPath, type TraceSample, type ToleranceVerdict,
} from './expert-trace';

/** The vitals both traces are drawn from, in the order the overlay draws them. */
export const OVERLAY_PARAMETERS = [
  'heartRateBpm', 'meanArterialMmHg', 'spo2Percent', 'etco2MmHg',
] as const;

export type OverlayParameter = typeof OVERLAY_PARAMETERS[number];

/** One action, on whichever trace performed it. */
export interface OverlayMark {
  readonly tick: number;
  readonly label: string;
  readonly by: 'learner' | 'expert';
}

/** One parameter, as both runs produced it. */
export interface OverlaySeries {
  readonly parameter: OverlayParameter;
  readonly learner: readonly TraceSample[];
  readonly expert: readonly TraceSample[];
}

/**
 * One objective, as each run met it.
 *
 * `differenceSeconds` is the gap between two moments, not a score: it is
 * positive when the learner was later and negative when they were earlier, and
 * it exists only where both runs met the objective.
 */
export interface OverlayObjectiveLine {
  readonly objectiveId: string;
  readonly statement: string;
  readonly learnerTick: number | null;
  readonly expertTick: number | null;
  readonly differenceSeconds: number | null;
}

export interface ExpertOverlay {
  /** Null when there is a trace to draw; a reason when there is not. */
  readonly withheld: string | null;
  readonly series: readonly OverlaySeries[];
  readonly marks: readonly OverlayMark[];
  readonly objectives: readonly OverlayObjectiveLine[];
}

/** One run's finding for one objective, as the debrief already computes it. */
export interface OverlayFinding {
  readonly objectiveId: string;
  readonly statement: string;
  readonly outcome: string;
  readonly atTick?: number;
}

export interface ExpertOverlayInput {
  readonly ticksPerSecond: number;
  readonly path: ExpertPath | undefined;
  readonly learnerHistory: readonly HistorySample[];
  readonly learnerActions: readonly LearnerAction[];
  /** The expert actions replayed under the learner's seed, or undefined if the replay failed. */
  readonly replayedHistory: readonly HistorySample[] | undefined;
  readonly learnerFindings: readonly OverlayFinding[];
  readonly expertFindings: readonly OverlayFinding[];
}

function samplesOf(
  history: readonly HistorySample[], parameter: OverlayParameter,
): TraceSample[] {
  return history.flatMap((sample) => {
    const value = (sample.state as unknown as Record<string, unknown>)[parameter];
    return typeof value === 'number' ? [{ tick: sample.tick, vitals: { [parameter]: value } }] : [];
  });
}

/** The replayed trace at the ticks the recording sampled, for the comparison. */
function atRecordedTicks(
  history: readonly HistorySample[], recorded: readonly TraceSample[],
): TraceSample[] {
  const byTick = new Map(history.map((sample) => [sample.tick, sample]));
  return recorded.flatMap((sample) => {
    const found = byTick.get(sample.tick);
    if (found === undefined) return [];
    const vitals: Record<string, number> = {};
    for (const parameter of Object.keys(sample.vitals)) {
      const value = (found.state as unknown as Record<string, unknown>)[parameter];
      if (typeof value === 'number') vitals[parameter] = Math.round(value * 10) / 10;
    }
    return [{ tick: sample.tick, vitals }];
  });
}

/** Why the trace is not drawn, in the overlay's own words. */
export function withheldReason(verdict: ToleranceVerdict): string {
  if (verdict.parameter !== undefined && verdict.tick !== undefined
    && verdict.observed !== undefined && verdict.allowed !== undefined) {
    return `Under this session's seed the reference run reaches a different ${verdict.parameter} `
      + `at tick ${verdict.tick}: ${verdict.observed.toFixed(1)} away, where ${verdict.allowed} is `
      + 'as far as the same patient goes. The reference trace is not drawn, because it is no '
      + 'longer the same patient as yours.';
  }
  if (verdict.tick !== undefined) {
    return `The reference run and this session do not line up at tick ${verdict.tick}, so the `
      + 'reference trace is not drawn.';
  }
  return 'The reference run could not be reproduced for this session, so its trace is not drawn.';
}

/**
 * Build the overlay, or say why there is nothing to draw.
 *
 * Every refusal is explicit: a lesson with no closed-loop model has no path, a
 * replay that failed has no history, and a replay that drifted is refused by
 * the measured tolerance. None of the three draws a half-trace.
 */
export function expertOverlay(input: ExpertOverlayInput): ExpertOverlay {
  const objectives = objectiveLines(input);
  const marks = overlayMarks(input);
  if (input.path === undefined) {
    return {
      withheld: 'This lesson has no modelled patient, so there is no reference trace to draw '
        + 'beside yours. The reference path itself is in the facilitator guide.',
      series: [], marks, objectives,
    };
  }
  if (input.replayedHistory === undefined || input.replayedHistory.length === 0) {
    return { withheld: withheldReason({ within: false }), series: [], marks, objectives };
  }
  const verdict = expertTraceWithinTolerance(
    input.path.recorded, atRecordedTicks(input.replayedHistory, input.path.recorded),
  );
  if (!verdict.within) {
    return { withheld: withheldReason(verdict), series: [], marks, objectives };
  }
  return {
    withheld: null,
    series: OVERLAY_PARAMETERS.map((parameter) => ({
      parameter,
      learner: samplesOf(input.learnerHistory, parameter),
      expert: samplesOf(input.replayedHistory!, parameter),
    })),
    marks,
    objectives,
  };
}

/** Each run's accepted actions, in time order, labelled by who performed them. */
export function overlayMarks(input: ExpertOverlayInput): OverlayMark[] {
  const learner = input.learnerActions.map((action) => ({
    tick: action.tick, label: action.type, by: 'learner' as const,
  }));
  const expert = (input.path?.expert ?? []).map((action) => ({
    tick: action.tick, label: action.type, by: 'expert' as const,
  }));
  return [...learner, ...expert].sort((a, b) => a.tick - b.tick || a.by.localeCompare(b.by));
}

/**
 * One line per objective, in the scenario's own order.
 *
 * A difference is reported only where BOTH runs met the objective: a gap
 * between a moment and nothing is not a gap, and printing one would make an
 * unmet objective look like a slow one.
 */
export function objectiveLines(input: ExpertOverlayInput): OverlayObjectiveLine[] {
  const expertByObjective = new Map(input.expertFindings.map((finding) => [finding.objectiveId, finding]));
  return input.learnerFindings.map((finding) => {
    const expert = expertByObjective.get(finding.objectiveId);
    const learnerTick = finding.outcome === 'met' && finding.atTick !== undefined ? finding.atTick : null;
    const expertTick = expert?.outcome === 'met' && expert.atTick !== undefined ? expert.atTick : null;
    return {
      objectiveId: finding.objectiveId,
      statement: finding.statement,
      learnerTick,
      expertTick,
      differenceSeconds: learnerTick === null || expertTick === null ? null
        : Math.round((learnerTick - expertTick) / input.ticksPerSecond),
    };
  });
}

/** The lesson's expert path, or undefined where the lesson has no model. */
export function expertPathFor(
  paths: readonly ExpertPath[], scenarioId: string,
): ExpertPath | undefined {
  return paths.find((path) => path.scenarioId === scenarioId);
}
