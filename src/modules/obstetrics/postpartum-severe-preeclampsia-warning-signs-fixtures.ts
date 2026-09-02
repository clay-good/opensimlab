import type { PostpartumPreeclampsiaAction } from './postpartum-severe-preeclampsia-warning-signs';

/**
 * Reference transcripts for the postpartum-preeclampsia lesson.
 *
 * The error path is the one a pending laboratory invites: go and read the
 * supplied organ evidence — the platelets, the transaminases, the creatinine —
 * before calling two severe readings an emergency and starting the protocol
 * clock. It is an ordering error rather than a treatment error, because this
 * lesson delivers no treatment. What it skips is the naming and the
 * activation, and the sixty minutes are already running.
 */
export const POSTPARTUM_PREECLAMPSIA_FIXTURES = {
  scenarioId: 'postpartum-severe-preeclampsia-warning-signs', contentVersion: '0.1.0', seed: 7146,
  noAction: [],
  expert: [
    [0, 'reconcile-obstetrics-postpartum-preeclampsia-clock-symptoms-pressure-organs-newborn-and-whole-person'],
    [1, 'recognize-obstetrics-persistent-severe-postpartum-hypertension-and-supplied-preeclampsia-pattern-without-waiting-for-proteinuria'],
    [2, 'activate-obstetrics-postpartum-severe-hypertension-protocol-qualified-obstetric-response-and-patient-centered-support-now'],
    [3, 'review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary'],
    [4, 'review-obstetrics-postpartum-preeclampsia-fixed-later-pressure-symptom-organ-and-support-report'],
    [5, 'handoff-obstetrics-postpartum-preeclampsia-recurrent-pressure-seizure-stroke-pulmonary-hellp-renal-newborn-follow-up-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-postpartum-preeclampsia-clock-symptoms-pressure-organs-newborn-and-whole-person'],
    [1, 'review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary'],
    [2, 'review-obstetrics-postpartum-preeclampsia-fixed-later-pressure-symptom-organ-and-support-report'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-postpartum-preeclampsia-clock-symptoms-pressure-organs-newborn-and-whole-person'],
    [1, 'review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary'],
    [2, 'recognize-obstetrics-persistent-severe-postpartum-hypertension-and-supplied-preeclampsia-pattern-without-waiting-for-proteinuria'],
    [3, 'activate-obstetrics-postpartum-severe-hypertension-protocol-qualified-obstetric-response-and-patient-centered-support-now'],
    [4, 'review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary'],
    [5, 'review-obstetrics-postpartum-preeclampsia-fixed-later-pressure-symptom-organ-and-support-report'],
    [6, 'handoff-obstetrics-postpartum-preeclampsia-recurrent-pressure-seizure-stroke-pulmonary-hellp-renal-newborn-follow-up-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PostpartumPreeclampsiaAction])[];
  expert: readonly (readonly [number, PostpartumPreeclampsiaAction])[];
  commonError: readonly (readonly [number, PostpartumPreeclampsiaAction])[];
  recovery: readonly (readonly [number, PostpartumPreeclampsiaAction])[];
};
