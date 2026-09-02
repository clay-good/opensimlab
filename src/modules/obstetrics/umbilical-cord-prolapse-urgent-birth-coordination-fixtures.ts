import type { CordProlapseAction } from './umbilical-cord-prolapse-urgent-birth-coordination';

/**
 * Reference transcripts for the cord-prolapse lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: take in the picture before calling the emergency and
 * getting a theatre. It is an ordering error rather than a treatment error,
 * because this lesson performs no procedure. What it skips is the activation,
 * and here the activation is what books the room that the birth has to happen
 * in.
 */
export const CORD_PROLAPSE_FIXTURES = {
  scenarioId: 'umbilical-cord-prolapse-urgent-birth-coordination', contentVersion: '0.1.0', seed: 7216,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-cord-prolapse-response-diagnosis-clock-theatre-anesthesia-newborn-and-support-roles'],
    [1, 'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person'],
    [2, 'review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries'],
    [3, 'review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries'],
    [4, 'review-obstetrics-cord-prolapse-fixed-persistent-fetal-compromise-and-theatre-transfer-report'],
    [5, 'handoff-obstetrics-cord-prolapse-fetal-maternal-theatre-newborn-support-documentation-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person'],
    [1, 'review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries'],
    [2, 'review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person'],
    [1, 'activate-obstetrics-cord-prolapse-response-diagnosis-clock-theatre-anesthesia-newborn-and-support-roles'],
    [2, 'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person'],
    [3, 'review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries'],
    [4, 'review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries'],
    [5, 'review-obstetrics-cord-prolapse-fixed-persistent-fetal-compromise-and-theatre-transfer-report'],
    [6, 'handoff-obstetrics-cord-prolapse-fetal-maternal-theatre-newborn-support-documentation-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CordProlapseAction])[];
  expert: readonly (readonly [number, CordProlapseAction])[];
  commonError: readonly (readonly [number, CordProlapseAction])[];
  recovery: readonly (readonly [number, CordProlapseAction])[];
};
