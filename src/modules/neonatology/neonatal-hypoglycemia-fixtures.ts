import type { NeonatalHypoglycemiaAction } from './neonatal-hypoglycemia';

/**
 * Reference transcripts for the neonatal hypoglycemia lesson.
 *
 * The error path escalates from the number alone. Thirty-two milligrams per
 * decilitre reads as a threshold crossed, and the shape refused here is acting
 * on it before the team, the maternal risk, the clock, the signs and the
 * feeding have been connected — because in this lesson the number does not
 * define the disease and the signs are what make it urgent. The recovery path
 * starts from exactly those refusals and still reaches a correct handoff in the
 * same run.
 */
export const NEONATAL_HYPOGLYCEMIA_FIXTURES = {
  scenarioId: 'neonatal-hypoglycemia', contentVersion: '0.1.0', seed: 6132,
  noAction: [],
  expert: [
    [0, 'activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support'],
    [1, 'reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad'],
    [2, 'recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure'],
    [3, 'review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries'],
    [4, 'review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report'],
    [5, 'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure'],
    [1, 'review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report'],
    [2, 'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure'],
    [1, 'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'],
    [2, 'activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support'],
    [3, 'reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad'],
    [4, 'recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure'],
    [5, 'review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries'],
    [6, 'review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report'],
    [7, 'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NeonatalHypoglycemiaAction])[];
  expert: readonly (readonly [number, NeonatalHypoglycemiaAction])[];
  commonError: readonly (readonly [number, NeonatalHypoglycemiaAction])[];
  recovery: readonly (readonly [number, NeonatalHypoglycemiaAction])[];
};
