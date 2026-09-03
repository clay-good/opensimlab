import type { LearnerAction } from '@platform/kernel/protocol';
import { OBSTRUCTIVE_PLEURAL_SHOCK_DISPATCHES as D } from './obstructive-shock-tension-pneumothorax';

/**
 * Reference transcripts for the emergency obstructive-shock lesson.
 *
 * These are not a list of control ids like every other lesson in this module.
 * The lab runs on the generic resuscitation mechanics, so a transcript is a
 * list of whole dispatches: a `pneumothorax-response`, a `call-for-help`, a
 * `ventilator` setting, and another `pneumothorax-response`.
 *
 * Every path begins at tick 1. The pleural event is declared at tick 0 and is
 * not active until the first engine step, and both the assessment and the help
 * request are refused outright while it is inactive.
 *
 * The common-error path is the one that waits for a picture: the assessment,
 * the help request and the oxygen are all recorded promptly, and the
 * decompression lands at tick 1300 — a little over two minutes after the
 * modelled event, which is outside even the partly-met window. Nothing about
 * that run is disordered; it is only late, which is the whole point of a lesson
 * scored on a clock.
 */
const at = (tick: number, dispatch: Omit<LearnerAction, 'tick'>) => [tick, dispatch] as const;

export const OBSTRUCTIVE_PLEURAL_SHOCK_FIXTURES = {
  scenarioId: 'obstructive-shock-tension-pneumothorax', contentVersion: '0.1.0', seed: 6521,
  noAction: [],
  expert: [
    at(1, D.assess), at(2, D.help), at(3, D.oxygen), at(4, D.decompress),
  ],
  commonError: [
    at(1, D.assess), at(2, D.help), at(3, D.oxygen),
    // Two minutes and ten seconds after the event. Correct, and too late.
    at(1300, D.decompress),
  ],
  recovery: [
    // Both refused outright: the modelled pleural event is not yet active.
    at(0, D.assess), at(0, D.help),
    at(1, D.assess), at(2, D.help), at(3, D.oxygen), at(4, D.decompress),
    // A duplicate decompression is refused rather than double-counted.
    at(5, D.decompress),
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, Omit<LearnerAction, 'tick'>])[];
  expert: readonly (readonly [number, Omit<LearnerAction, 'tick'>])[];
  commonError: readonly (readonly [number, Omit<LearnerAction, 'tick'>])[];
  recovery: readonly (readonly [number, Omit<LearnerAction, 'tick'>])[];
};
