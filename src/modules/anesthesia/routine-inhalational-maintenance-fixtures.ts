import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the routine-inhalational-maintenance lesson.
 *
 * The dissection begins at tick 2,400 and ends at 3,600. Three objectives run
 * concurrently: depth between 40 and 60 for at least 80% of the window, a
 * remifentanil infusion running before the stimulus with heart rate and mean
 * arterial pressure each rising less than 20% in the minute that follows, and a
 * reduction within 30 seconds of offset leaving a pressure of at least 65 mmHg
 * and a depth back in band.
 *
 * The expert path deepens the volatile to 4.0% at tick 2,350 -- fifty ticks
 * before the stimulus -- and withdraws it to 1.4% at 2,600. That is the narrow
 * window: 100% of the depth trace in band and a pressure rise of 19.5%.
 *
 * The error path is the same anticipation without the withdrawal. It scores the
 * stimulus objective outright and then leaves the patient at 4.0% volatile for
 * the rest of the case: 33% of the depth window in band, and a scenario ending
 * at 43 mmHg with a depth index of 20. Getting the crisis right is not the same
 * as finishing the case.
 *
 * The recovery path withdraws at tick 3,000 instead of 2,600 -- late rather than
 * never -- and ends at 67 mmHg with a depth of 52.
 */

const REMIFENTANIL = (tick: number, rate: number): LearnerAction =>
  ({ tick, type: 'infusion', payload: { drugId: 'remifentanil', rate } });
const SEVOFLURANE = (tick: number, percent: number): LearnerAction =>
  ({ tick, type: 'ventilator', payload: { sevofluranePercent: percent } });

/** Anticipated correctly, and the volatile never brought back down. */
const deepenedAndLeft: readonly LearnerAction[] = [
  REMIFENTANIL(1800, 0.2), SEVOFLURANE(2350, 4), REMIFENTANIL(3700, 0),
];

export const ROUTINE_INHALATIONAL_MAINTENANCE_FIXTURES = {
  scenarioId: 'routine-inhalational-maintenance', contentVersion: '0.1.0',
  seed: 8158, ticks: 5400,

  /** The plan is never touched; the baseline settings simply run. */
  noAction: [] as readonly LearnerAction[],

  /** Deepen just before the stimulus, withdraw promptly after it. */
  expert: [
    REMIFENTANIL(1800, 0.2), SEVOFLURANE(2350, 4),
    SEVOFLURANE(2600, 1.4), REMIFENTANIL(3700, 0),
  ] as readonly LearnerAction[],

  /** The same anticipation, and nothing brought back down. */
  commonError: deepenedAndLeft,

  /** The withdrawal made late rather than never. */
  recovery: [
    REMIFENTANIL(1800, 0.2), SEVOFLURANE(2350, 4),
    SEVOFLURANE(3000, 1.4), REMIFENTANIL(3700, 0),
  ] as readonly LearnerAction[],
} as const;
