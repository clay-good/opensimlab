/**
 * Whether an expert transcript, replayed under a learner's seed, is still the
 * same patient (learning/deliberate-practice → expert overlay).
 *
 * THE PROBLEM THIS SOLVES. The overlay draws the learner's trace and the
 * expert's on one axis. The expert transcript was recorded under the fixture's
 * own seed, and a learner's session may carry a different one — an assignment
 * link, or a blind draw. So the expert actions are replayed under the learner's
 * seed before anything is drawn, and the result has to be checked: if it is not
 * the same patient any more, drawing it beside the learner's run would compare
 * two different people and label one of them the expert.
 *
 * THE TOLERANCE IS MEASURED, NOT CHOSEN. Replaying all 39 closed-loop lessons'
 * expert transcripts under three other seeds moves the trace by at most 0.9
 * bpm, 6 mmHg systolic, 2.8 mmHg diastolic, 3.8 mmHg mean, 2.7 mmHg end-tidal
 * CO2 and 0.1% saturation. The bounds below sit above those observations and
 * well below any difference that would be a different patient, and
 * `tests/unit/expert-trace.test.ts` re-runs the measurement and fails if the
 * engine ever moves further than is declared here. That is the point: the
 * number stays evidence rather than becoming folklore.
 *
 * It is one shared set rather than a field on each of 256 fixtures, because the
 * measurement found the lessons alike and 256 separately justified numbers is
 * 256 numbers nobody can defend. A lesson that genuinely needs a wider bound
 * can carry its own when one appears.
 */

/** The most a parameter may move, under a different seed, and still be the same patient. */
export const EXPERT_TRACE_TOLERANCE: Readonly<Record<string, number>> = {
  heartRateBpm: 2,
  systolicMmHg: 8,
  diastolicMmHg: 4,
  meanArterialMmHg: 5,
  etco2MmHg: 4,
  spo2Percent: 0.5,
};

export interface TraceSample {
  readonly tick: number;
  readonly vitals: Readonly<Record<string, number>>;
}

export interface ToleranceVerdict {
  /** Whether the replayed trace may be drawn beside the learner's. */
  readonly within: boolean;
  /** The first parameter that moved too far, for the line that says why not. */
  readonly parameter?: string;
  readonly tick?: number;
  readonly observed?: number;
  readonly allowed?: number;
}

/**
 * Compare a replayed expert trace against the recorded one.
 *
 * A trace of a different length, or sampled at different ticks, is not within
 * tolerance at any threshold: it is not the same run. A parameter the
 * comparison has no bound for is ignored rather than guessed at — declaring a
 * tolerance is how a parameter joins this check.
 */
export function expertTraceWithinTolerance(
  recorded: readonly TraceSample[],
  replayed: readonly TraceSample[],
  tolerance: Readonly<Record<string, number>> = EXPERT_TRACE_TOLERANCE,
): ToleranceVerdict {
  if (recorded.length === 0 || recorded.length !== replayed.length) return { within: false };
  for (let index = 0; index < recorded.length; index += 1) {
    const before = recorded[index]!;
    const after = replayed[index]!;
    if (before.tick !== after.tick) {
      return { within: false, tick: before.tick };
    }
    for (const [parameter, allowed] of Object.entries(tolerance)) {
      const a = before.vitals[parameter];
      const b = after.vitals[parameter];
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      const observed = Math.abs(a - b);
      if (observed > allowed) {
        return { within: false, parameter, tick: before.tick, observed, allowed };
      }
    }
  }
  return { within: true };
}
