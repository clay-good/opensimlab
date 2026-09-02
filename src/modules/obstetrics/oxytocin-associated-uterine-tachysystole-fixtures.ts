import type { OxytocinTachysystoleAction } from './oxytocin-associated-uterine-tachysystole';

/**
 * Reference transcripts for the oxytocin-tachysystole lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: study the trace before bringing anyone senior into the
 * room. It is an ordering error rather than a treatment error, because this
 * lesson touches no infusion. What it skips is the call, and the contractions
 * that caused this are still coming while the trace is being studied.
 */
export const OXYTOCIN_TACHYSYSTOLE_FIXTURES = {
  scenarioId: 'oxytocin-associated-uterine-tachysystole', contentVersion: '0.1.0', seed: 7300,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-oxytocin-tachysystole-qualified-obstetric-fetal-and-support-response'],
    [1, 'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context'],
    [2, 'recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure'],
    [3, 'review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness'],
    [4, 'review-obstetrics-oxytocin-tachysystole-fixed-six-minute-qualified-recovery-report'],
    [5, 'handoff-obstetrics-oxytocin-tachysystole-recurrence-fetal-birth-medication-maternal-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context'],
    [1, 'recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure'],
    [2, 'review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context'],
    [1, 'activate-obstetrics-oxytocin-tachysystole-qualified-obstetric-fetal-and-support-response'],
    [2, 'reconcile-obstetrics-oxytocin-tachysystole-infusion-contraction-fetal-maternal-and-whole-person-context'],
    [3, 'recognize-obstetrics-oxytocin-tachysystole-with-fetal-heart-deterioration-without-single-trace-closure'],
    [4, 'review-obstetrics-oxytocin-tachysystole-qualified-source-stop-position-cause-and-birth-readiness'],
    [5, 'review-obstetrics-oxytocin-tachysystole-fixed-six-minute-qualified-recovery-report'],
    [6, 'handoff-obstetrics-oxytocin-tachysystole-recurrence-fetal-birth-medication-maternal-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, OxytocinTachysystoleAction])[];
  expert: readonly (readonly [number, OxytocinTachysystoleAction])[];
  commonError: readonly (readonly [number, OxytocinTachysystoleAction])[];
  recovery: readonly (readonly [number, OxytocinTachysystoleAction])[];
};
