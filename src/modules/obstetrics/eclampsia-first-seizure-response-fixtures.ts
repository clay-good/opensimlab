import type { EclampsiaAction } from './eclampsia-first-seizure-response';

/**
 * Reference transcripts for the eclampsia lesson.
 *
 * The error path is the one a stopped seizure invites: go and work out what
 * caused it — the pending imaging, the toxicology, the alternatives — before
 * calling it eclampsia and starting the maternal response. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the naming and the activation, and a second
 * convulsion does not wait for the differential.
 */
export const ECLAMPSIA_FIXTURES = {
  scenarioId: 'eclampsia-first-seizure-response', contentVersion: '0.1.0', seed: 7160,
  noAction: [],
  expert: [
    [0, 'reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person'],
    [1, 'recognize-obstetrics-supplied-eclampsia-pattern-after-first-seizure-with-dangerous-alternatives-open'],
    [2, 'activate-obstetrics-eclampsia-maternal-stabilization-seizure-severe-pressure-airway-obstetric-fetal-and-dignity-response-now'],
    [3, 'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary'],
    [4, 'review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report'],
    [5, 'handoff-obstetrics-eclampsia-recurrence-airway-aspiration-stroke-pressure-organ-fetal-delivery-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person'],
    [1, 'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary'],
    [2, 'review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person'],
    [1, 'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary'],
    [2, 'recognize-obstetrics-supplied-eclampsia-pattern-after-first-seizure-with-dangerous-alternatives-open'],
    [3, 'activate-obstetrics-eclampsia-maternal-stabilization-seizure-severe-pressure-airway-obstetric-fetal-and-dignity-response-now'],
    [4, 'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary'],
    [5, 'review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report'],
    [6, 'handoff-obstetrics-eclampsia-recurrence-airway-aspiration-stroke-pressure-organ-fetal-delivery-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, EclampsiaAction])[];
  expert: readonly (readonly [number, EclampsiaAction])[];
  commonError: readonly (readonly [number, EclampsiaAction])[];
  recovery: readonly (readonly [number, EclampsiaAction])[];
};
