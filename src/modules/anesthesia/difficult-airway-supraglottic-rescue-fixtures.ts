import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the difficult-airway supraglottic-rescue lesson.
 *
 * Built to the same shape as the repeated-laryngoscopy-harm transcripts, so the
 * two can be read against each other: the recovery path is the error path with a
 * single preoxygenation prepended, and nothing else differs.
 *
 * The error path induces with no reserve, looks twice, calls for help after the
 * second look, and then rescues. Its lowest post-rescue saturation is 54%. The
 * recovery path makes the same two attempts with the same late help request and
 * holds 100%. That is the same result the sibling lesson produces at three
 * attempts, now reproduced at two in a different scenario.
 *
 * The escalation objective is the one that separates these two lessons, and what
 * it does here is less than its wording suggests. See the completion evidence:
 * help requested 49 seconds late scores exactly what requesting none at all
 * scores, and help requested 96 seconds early -- outside the window the measure
 * describes -- is scored met.
 */

const VENTILATE = (tick: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2: 1, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } });
const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'airway' } });
const LARYNGOSCOPY = (tick: number): LearnerAction =>
  ({ tick, type: 'laryngoscopy', payload: { technique: 'video' } });
const RESCUE = (tick: number): LearnerAction =>
  ({ tick, type: 'airway-device', payload: { device: 'supraglottic-airway' } });

/** Two looks, help after the second, then the rescue and its confirmation. */
const twoAttemptsLateHelp: readonly LearnerAction[] = [
  PROPOFOL(1500), LARYNGOSCOPY(1800), LARYNGOSCOPY(2400),
  HELP(2500), RESCUE(3000), VENTILATE(3300),
];

export const DIFFICULT_AIRWAY_SUPRAGLOTTIC_RESCUE_FIXTURES = {
  scenarioId: 'difficult-airway-supraglottic-rescue', contentVersion: '0.1.0',
  seed: 2277, ticks: 6000,

  /** Nobody is induced, so no objective is exercised at all. */
  noAction: [] as readonly LearnerAction[],

  /** Reserve built, one attempt, help during it, then rescue and proof. */
  expert: [
    VENTILATE(100), PROPOFOL(1500), LARYNGOSCOPY(1800), HELP(1900),
    RESCUE(2600), VENTILATE(2900),
  ] as readonly LearnerAction[],

  /** No reserve, two looks, late help: the saturation reaches 54%. */
  commonError: twoAttemptsLateHelp,

  /** The identical transcript, preceded by the preoxygenation. */
  recovery: [VENTILATE(100), ...twoAttemptsLateHelp] as readonly LearnerAction[],
} as const;
