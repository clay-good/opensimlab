import type { MaternalSepsisAction } from './maternal-sepsis-postpartum-deterioration';

/**
 * Reference transcripts for the maternal-sepsis lesson.
 *
 * The error path is the one a screening tool invites: go and settle what this
 * is — read the supplied cultures, the lactate, the mimics — before calling it
 * an emergency and bringing the owners in. It is an ordering error rather than
 * a treatment error, because this lesson delivers no treatment. What it skips
 * is the naming and the call, and her kidneys are failing while the thinking
 * happens.
 */
export const MATERNAL_SEPSIS_FIXTURES = {
  scenarioId: 'maternal-sepsis-postpartum-deterioration', contentVersion: '0.1.0', seed: 7118,
  noAction: [],
  expert: [
    [0, 'reconcile-obstetrics-sepsis-postpartum-clock-infection-organ-dysfunction-and-whole-person'],
    [1, 'recognize-obstetrics-maternal-sepsis-emergency-without-fever-score-source-or-single-value-closure'],
    [2, 'activate-obstetrics-sepsis-obstetric-critical-care-anesthesia-nursing-pharmacy-microbiology-source-newborn-and-dignity-ownership'],
    [3, 'review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary'],
    [4, 'record-obstetrics-sepsis-bounded-qualified-immediate-care-source-control-intent-and-strict-later-review'],
    [5, 'handoff-obstetrics-sepsis-shock-source-organ-antimicrobial-vte-newborn-survivor-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-sepsis-postpartum-clock-infection-organ-dysfunction-and-whole-person'],
    [1, 'review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary'],
    [2, 'record-obstetrics-sepsis-bounded-qualified-immediate-care-source-control-intent-and-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-sepsis-postpartum-clock-infection-organ-dysfunction-and-whole-person'],
    [1, 'review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary'],
    [2, 'recognize-obstetrics-maternal-sepsis-emergency-without-fever-score-source-or-single-value-closure'],
    [3, 'activate-obstetrics-sepsis-obstetric-critical-care-anesthesia-nursing-pharmacy-microbiology-source-newborn-and-dignity-ownership'],
    [4, 'review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary'],
    [5, 'record-obstetrics-sepsis-bounded-qualified-immediate-care-source-control-intent-and-strict-later-review'],
    [6, 'handoff-obstetrics-sepsis-shock-source-organ-antimicrobial-vte-newborn-survivor-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MaternalSepsisAction])[];
  expert: readonly (readonly [number, MaternalSepsisAction])[];
  commonError: readonly (readonly [number, MaternalSepsisAction])[];
  recovery: readonly (readonly [number, MaternalSepsisAction])[];
};
