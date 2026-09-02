import type { FailedIntubationAction } from './failed-obstetric-intubation-oxygenation-first';

/**
 * Reference transcripts for the failed-intubation lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: take stock of the airway before declaring the failure out
 * loud. It is an ordering error rather than a treatment error, because this
 * lesson touches no airway. What it skips is the declaration, which is the
 * thing that stops another attempt from happening.
 */
export const FAILED_INTUBATION_FIXTURES = {
  scenarioId: 'failed-obstetric-intubation-oxygenation-first', contentVersion: '0.1.0', seed: 7272,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-failed-intubation-oxygenation-anesthesia-obstetric-theatre-newborn-and-support-response'],
    [1, 'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person'],
    [2, 'review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries'],
    [3, 'review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness'],
    [4, 'review-obstetrics-failed-intubation-fixed-three-minute-qualified-course-report'],
    [5, 'handoff-obstetrics-failed-intubation-airway-aspiration-awareness-birth-newborn-support-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person'],
    [1, 'review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries'],
    [2, 'review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person'],
    [1, 'activate-obstetrics-failed-intubation-oxygenation-anesthesia-obstetric-theatre-newborn-and-support-response'],
    [2, 'reconcile-obstetrics-failed-intubation-attempts-device-ventilation-aspiration-fetus-and-whole-person'],
    [3, 'review-obstetrics-failed-intubation-attempt-limit-oxygenation-cico-awareness-and-aspiration-boundaries'],
    [4, 'review-obstetrics-failed-intubation-individualized-wake-or-proceed-and-parallel-readiness'],
    [5, 'review-obstetrics-failed-intubation-fixed-three-minute-qualified-course-report'],
    [6, 'handoff-obstetrics-failed-intubation-airway-aspiration-awareness-birth-newborn-support-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, FailedIntubationAction])[];
  expert: readonly (readonly [number, FailedIntubationAction])[];
  commonError: readonly (readonly [number, FailedIntubationAction])[];
  recovery: readonly (readonly [number, FailedIntubationAction])[];
};
