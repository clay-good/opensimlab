import type { HighNeuraxialAction } from './high-neuraxial-block-obstetric-coordination';

/**
 * Reference transcripts for the high-neuraxial-block lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: work out how high the block has gone before calling for
 * someone who can manage an airway. It is an ordering error rather than a
 * treatment error, because this lesson delivers no treatment. What it skips is
 * the activation, and the block is still ascending while the assessment
 * happens.
 */
export const HIGH_NEURAXIAL_FIXTURES = {
  scenarioId: 'high-neuraxial-block-obstetric-coordination', contentVersion: '0.1.0', seed: 7258,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-high-neuraxial-block-airway-anesthesia-obstetric-theatre-newborn-and-support-response'],
    [1, 'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person'],
    [2, 'review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries'],
    [3, 'review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness'],
    [4, 'review-obstetrics-high-neuraxial-block-fixed-four-minute-qualified-support-report'],
    [5, 'handoff-obstetrics-high-neuraxial-block-airway-circulation-block-fetal-birth-awareness-support-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person'],
    [1, 'review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries'],
    [2, 'review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person'],
    [1, 'activate-obstetrics-high-neuraxial-block-airway-anesthesia-obstetric-theatre-newborn-and-support-response'],
    [2, 'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person'],
    [3, 'review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries'],
    [4, 'review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness'],
    [5, 'review-obstetrics-high-neuraxial-block-fixed-four-minute-qualified-support-report'],
    [6, 'handoff-obstetrics-high-neuraxial-block-airway-circulation-block-fetal-birth-awareness-support-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HighNeuraxialAction])[];
  expert: readonly (readonly [number, HighNeuraxialAction])[];
  commonError: readonly (readonly [number, HighNeuraxialAction])[];
  recovery: readonly (readonly [number, HighNeuraxialAction])[];
};
