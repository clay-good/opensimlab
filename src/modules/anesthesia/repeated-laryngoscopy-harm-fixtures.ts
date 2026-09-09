import type { LearnerAction } from '@platform/kernel/protocol';

/**
 * Reference transcripts for the repeated-laryngoscopy-harm lesson.
 *
 * Two variables, and the transcripts are laid out to separate them, because in
 * this model they are not independent and only one of them reaches the patient.
 *
 * The first is the oxygen reserve built before induction. The second is how many
 * laryngoscopy attempts are made before the rescue device goes in. The error
 * path gets both wrong: no preoxygenation, then three attempts, and its lowest
 * post-rescue saturation is 41%. The recovery path makes exactly the same three
 * attempts and differs only in having preoxygenated -- and its lowest saturation
 * is 100%. The rubric still marks the attempts down on both, identically.
 *
 * The reading that follows is uncomfortable and is the reason the lesson is
 * worth binding: repeated laryngoscopy does no measurable harm here to a patient
 * with a full reserve. The attempts are not the injury. They are the way the
 * reserve is spent, and the injury is what happens when there was none.
 */

const VENTILATE = (tick: number, fio2: number): LearnerAction => ({
  tick, type: 'ventilator',
  payload: { delivering: true, mode: 'volume-control', fio2, tidalVolumeMl: 500, respiratoryRateBpm: 12 },
});
const PROPOFOL = (tick: number): LearnerAction =>
  ({ tick, type: 'bolus', payload: { drugId: 'propofol', amount: 150, unit: 'mg' } });
const HELP = (tick: number): LearnerAction =>
  ({ tick, type: 'call-for-help', payload: { context: 'airway' } });
const LARYNGOSCOPY = (tick: number): LearnerAction =>
  ({ tick, type: 'laryngoscopy', payload: { technique: 'video' } });
const RESCUE = (tick: number): LearnerAction =>
  ({ tick, type: 'airway-device', payload: { device: 'supraglottic-airway' } });

/** Three attempts, help called only after the third, then the rescue. */
const threeAttemptsThenRescue: readonly LearnerAction[] = [
  PROPOFOL(1500), LARYNGOSCOPY(1800), LARYNGOSCOPY(2400), LARYNGOSCOPY(3000),
  HELP(3300), RESCUE(3600), VENTILATE(3900, 1),
];

export const REPEATED_LARYNGOSCOPY_HARM_FIXTURES = {
  scenarioId: 'repeated-laryngoscopy-harm', contentVersion: '0.1.0',
  seed: 3390, ticks: 5400,

  /** Nobody is induced, so no objective is exercised at all. */
  noAction: [] as readonly LearnerAction[],

  /** Reserve built, help before the first look, one attempt, then rescue. */
  expert: [
    VENTILATE(100, 1), HELP(1200), PROPOFOL(1500), LARYNGOSCOPY(1800),
    RESCUE(2600), VENTILATE(2900, 1),
  ] as readonly LearnerAction[],

  /** No reserve and three attempts: the saturation reaches 41%. */
  commonError: threeAttemptsThenRescue,

  /** The identical three attempts, preceded by the preoxygenation. */
  recovery: [
    VENTILATE(100, 1), ...threeAttemptsThenRescue,
  ] as readonly LearnerAction[],
} as const;
