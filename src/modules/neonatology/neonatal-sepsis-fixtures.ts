import type { NeonatalSepsisAction } from './neonatal-sepsis';

/**
 * Reference transcripts for the neonatal sepsis lesson.
 *
 * The error path recognizes the risk from the maternal record. Fever,
 * twenty-two hours of rupture and unknown GBS status are the inputs a
 * calculator wants, and the shape refused here is reaching a conclusion from
 * them before the team, the deterioration clock and the newborn's own change
 * have been connected — because it is the clinically ill infant, not the
 * maternal risk, that ends the calculation. The recovery path starts from
 * exactly those refusals and still reaches a correct handoff in the same run.
 */
export const NEONATAL_SEPSIS_FIXTURES = {
  scenarioId: 'neonatal-sepsis', contentVersion: '0.1.0', seed: 7351,
  noAction: [],
  expert: [
    [0, 'activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support'],
    [1, 'reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad'],
    [2, 'recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure'],
    [3, 'review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries'],
    [4, 'review-neonatal-sepsis-fixed-one-hour-qualified-report'],
    [5, 'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure'],
    [1, 'review-neonatal-sepsis-fixed-one-hour-qualified-report'],
    [2, 'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure'],
    [1, 'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'],
    [2, 'activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support'],
    [3, 'reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad'],
    [4, 'recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure'],
    [5, 'review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries'],
    [6, 'review-neonatal-sepsis-fixed-one-hour-qualified-report'],
    [7, 'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NeonatalSepsisAction])[];
  expert: readonly (readonly [number, NeonatalSepsisAction])[];
  commonError: readonly (readonly [number, NeonatalSepsisAction])[];
  recovery: readonly (readonly [number, NeonatalSepsisAction])[];
};
