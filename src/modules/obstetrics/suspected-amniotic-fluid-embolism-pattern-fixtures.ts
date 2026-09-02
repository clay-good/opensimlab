import type { AfeAction } from './suspected-amniotic-fluid-embolism-pattern';

/**
 * Reference transcripts for the amniotic-fluid-embolism lesson.
 *
 * This is the one lesson in the module whose response comes before its
 * understanding, so the error path is the ordinary instinct rather than an
 * exotic one: work out what is happening before calling the room. It is an
 * ordering error rather than a treatment error, because this lesson delivers
 * no treatment. What it skips is the activation, and everything that follows
 * refuses until it has happened.
 */
export const AFE_FIXTURES = {
  scenarioId: 'suspected-amniotic-fluid-embolism-pattern', contentVersion: '0.1.0', seed: 7174,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response'],
    [1, 'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person'],
    [2, 'recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure'],
    [3, 'review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary'],
    [4, 'review-obstetrics-afe-fixed-later-breathing-circulation-bleeding-coagulation-and-support-report'],
    [5, 'handoff-obstetrics-afe-hypoxemia-shock-coagulopathy-bleeding-arrest-procedure-newborn-family-support-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person'],
    [1, 'recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure'],
    [2, 'review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person'],
    [1, 'activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response'],
    [2, 'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person'],
    [3, 'recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure'],
    [4, 'review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary'],
    [5, 'review-obstetrics-afe-fixed-later-breathing-circulation-bleeding-coagulation-and-support-report'],
    [6, 'handoff-obstetrics-afe-hypoxemia-shock-coagulopathy-bleeding-arrest-procedure-newborn-family-support-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AfeAction])[];
  expert: readonly (readonly [number, AfeAction])[];
  commonError: readonly (readonly [number, AfeAction])[];
  recovery: readonly (readonly [number, AfeAction])[];
};
