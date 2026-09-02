import type { UterineRuptureAction } from './suspected-uterine-rupture-recognition';

/**
 * Reference transcripts for the uterine-rupture lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: satisfy yourself that this really is a rupture before
 * calling for a theatre. It is an ordering error rather than a treatment
 * error, because this lesson performs no surgery. What it skips is the
 * activation, and the only thing that would confirm the diagnosis is the
 * operation the activation exists to arrange.
 */
export const UTERINE_RUPTURE_FIXTURES = {
  scenarioId: 'suspected-uterine-rupture-recognition', contentVersion: '0.1.0', seed: 7230,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-suspected-uterine-rupture-category-one-surgery-anesthesia-blood-newborn-and-support-response'],
    [1, 'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person'],
    [2, 'review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries'],
    [3, 'review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness'],
    [4, 'review-obstetrics-suspected-uterine-rupture-fixed-worsening-and-laparotomy-start-report'],
    [5, 'handoff-obstetrics-suspected-uterine-rupture-maternal-fetal-hemorrhage-surgery-newborn-fertility-support-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person'],
    [1, 'review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries'],
    [2, 'review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person'],
    [1, 'activate-obstetrics-suspected-uterine-rupture-category-one-surgery-anesthesia-blood-newborn-and-support-response'],
    [2, 'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person'],
    [3, 'review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries'],
    [4, 'review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness'],
    [5, 'review-obstetrics-suspected-uterine-rupture-fixed-worsening-and-laparotomy-start-report'],
    [6, 'handoff-obstetrics-suspected-uterine-rupture-maternal-fetal-hemorrhage-surgery-newborn-fertility-support-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UterineRuptureAction])[];
  expert: readonly (readonly [number, UterineRuptureAction])[];
  commonError: readonly (readonly [number, UterineRuptureAction])[];
  recovery: readonly (readonly [number, UterineRuptureAction])[];
};
