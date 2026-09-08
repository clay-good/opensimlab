import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the awareness-under-paralysis lesson.
 *
 * The counterfactual is the order, and it is the same order the previous lesson
 * is built around. Rapid-sequence induction lets a learner give the relaxant
 * before the hypnotic and reports it only in the debrief; this lesson scores it,
 * and then removes the second safeguard as well by disconnecting the line that
 * was supposed to keep her asleep.
 *
 * The error path gets the order backwards and never looks at the line. The
 * recovery path gets the order backwards in exactly the same way and does look,
 * eighty seconds late. Measured, both peak at a predicted depth of 78: a late
 * reconnection does not lower the peak the patient was exposed to, it only
 * shortens the tail, and hypnosis-before-paralysis fails on both because an
 * order cannot be un-given.
 *
 * The expert path runs a deliberately light maintenance rate, and that is the
 * finding this lesson turns on rather than an oversight. At 0.06 mg/kg/min the
 * predicted depth crosses 60 within about thirty seconds of the disconnection,
 * which is the warning the learner acts on. At the 0.15 mg/kg/min a generous
 * anaesthetist would run, it never crosses 60 at all — not even a hundred and
 * ninety seconds later. The infusion that keeps her safest minute to minute is
 * the one that hides the failure longest, and the objective's threshold is only
 * reachable in a light anaesthetic or a long one.
 */

const OXYGEN: LearnerAction = { tick: 60, type: 'ventilator', payload: { fio2: 1 } };
const REMIFENTANIL: LearnerAction =
  { tick: 560, type: 'bolus', payload: { drugId: 'remifentanil', amount: 25, unit: 'µg' } };
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 1.5, unit: 'mg/kg' } });
// 0.06 mg/kg/min is 3.6 mg/kg/h: light for a propofol-only maintenance, and
// chosen because it is what makes the disconnection visible in time to act.
const INFUSION: LearnerAction =
  { tick: 660, type: 'infusion', payload: { drugId: 'propofol', rate: 0.06, unit: 'mg/kg/min' } };
const ROCURONIUM = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'rocuronium', amount: 0.6, unit: 'mg/kg' } });
const LARYNGOSCOPY: LearnerAction =
  { tick: 1100, type: 'laryngoscopy', payload: { technique: 'video' } };
const VENTILATE: LearnerAction =
  { tick: 1200, type: 'ventilator', payload: { delivering: true, mode: 'volume-control' } };
const LINE = (tick: number, action: 'inspect' | 'reconnect'): LearnerAction =>
  ({ tick, type: 'hypnotic-line', payload: { action } });

export const AWARENESS_UNDER_PARALYSIS_FIXTURES = {
  scenarioId: 'awareness-under-paralysis', contentVersion: '0.1.0', seed: 8801, ticks: 7200,

  /** Nothing is done at all. The line still disconnects, and nothing notices. */
  noAction: [] as readonly LearnerAction[],

  /**
   * The hypnotic first, an infusion running before the failure, and the line
   * inspected thirty-five seconds after the depth index started to climb.
   */
  expert: [
    OXYGEN,
    REMIFENTANIL,
    PROPOFOL(600),
    INFUSION,
    ROCURONIUM(700),
    LARYNGOSCOPY,
    VENTILATE,
    LINE(2150, 'inspect'),
    LINE(2350, 'reconnect'),
  ] as readonly LearnerAction[],

  /** The relaxant first, no infusion at all, and the line never looked at. */
  commonError: [
    OXYGEN,
    ROCURONIUM(560),
    PROPOFOL(620),
    LARYNGOSCOPY,
    VENTILATE,
  ] as readonly LearnerAction[],

  /**
   * The same order, and then the decisions that differ: looking, reconnecting,
   * and starting the infusion that was never running.
   *
   * The third of those is not a flourish. Measured, inspecting and reconnecting
   * alone change nothing at all in this patient — the peak predicted depth and
   * the seconds spent above 60 are identical to the path that never looked —
   * because restoring a delivery path restores nothing when there was nothing
   * going down it. Two objectives move from not met to partly met and the
   * patient is no better off, which is the sharpest thing this lesson has to
   * say about a rubric. A test pins that variant separately.
   */
  recovery: [
    OXYGEN,
    ROCURONIUM(560),
    PROPOFOL(620),
    LARYNGOSCOPY,
    VENTILATE,
    LINE(2600, 'inspect'),
    LINE(2900, 'reconnect'),
    { tick: 2950, type: 'infusion', payload: { drugId: 'propofol', rate: 0.06, unit: 'mg/kg/min' } },
  ] as readonly LearnerAction[],
} as const;
