import type { MaternalArrestAction } from './maternal-cardiac-arrest-coordinated-response';

/**
 * Reference transcripts for the maternal-cardiac-arrest lesson.
 *
 * Like the amniotic-fluid-embolism lesson, the response comes before the
 * understanding, so the error path is the ordinary instinct: read the arrest
 * before activating the prepared response and starting the clock. It is an
 * ordering error rather than a treatment error, because this lesson performs
 * no resuscitation. What it skips is the activation, and in this arrest the
 * clock is the intervention that everything else is timed against.
 */
export const MATERNAL_ARREST_FIXTURES = {
  scenarioId: 'maternal-cardiac-arrest-coordinated-response', contentVersion: '0.1.0', seed: 7188,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-maternal-arrest-prepared-resuscitation-obstetric-anesthesia-delivery-newborn-and-dignity-response-now'],
    [1, 'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person'],
    [2, 'review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary'],
    [3, 'review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary'],
    [4, 'review-obstetrics-maternal-arrest-fixed-minute-four-active-resuscitation-and-delivery-readiness-report'],
    [5, 'handoff-obstetrics-maternal-arrest-active-arrest-cause-procedure-hemorrhage-newborn-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person'],
    [1, 'review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary'],
    [2, 'review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person'],
    [1, 'activate-obstetrics-maternal-arrest-prepared-resuscitation-obstetric-anesthesia-delivery-newborn-and-dignity-response-now'],
    [2, 'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person'],
    [3, 'review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary'],
    [4, 'review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary'],
    [5, 'review-obstetrics-maternal-arrest-fixed-minute-four-active-resuscitation-and-delivery-readiness-report'],
    [6, 'handoff-obstetrics-maternal-arrest-active-arrest-cause-procedure-hemorrhage-newborn-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MaternalArrestAction])[];
  expert: readonly (readonly [number, MaternalArrestAction])[];
  commonError: readonly (readonly [number, MaternalArrestAction])[];
  recovery: readonly (readonly [number, MaternalArrestAction])[];
};
