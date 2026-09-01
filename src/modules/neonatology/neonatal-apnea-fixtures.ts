import type { NeonatalApneaAction } from './neonatal-apnea';

/**
 * Reference transcripts for the neonatal apnea lesson.
 *
 * The error path starts from the number, which is what this lesson is about.
 * A heart rate of 92 is the figure everyone in the room is looking at, and
 * naming the threshold from it before the team is activated and the birth clock
 * connected is the shape the lesson refuses. The recovery path starts from
 * exactly those refusals and still reaches a correct handoff in the same run.
 */
export const NEONATAL_APNEA_FIXTURES = {
  scenarioId: 'neonatal-apnea', contentVersion: '0.1.0', seed: 1608,
  noAction: [],
  expert: [
    [0, 'activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support'],
    [1, 'reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad'],
    [2, 'recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure'],
    [3, 'review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness'],
    [4, 'review-neonatal-apnea-fixed-ninety-second-qualified-response-report'],
    [5, 'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure'],
    [1, 'review-neonatal-apnea-fixed-ninety-second-qualified-response-report'],
    [2, 'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure'],
    [1, 'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'],
    [2, 'activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support'],
    [3, 'reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad'],
    [4, 'recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure'],
    [5, 'review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness'],
    [6, 'review-neonatal-apnea-fixed-ninety-second-qualified-response-report'],
    [7, 'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NeonatalApneaAction])[];
  expert: readonly (readonly [number, NeonatalApneaAction])[];
  commonError: readonly (readonly [number, NeonatalApneaAction])[];
  recovery: readonly (readonly [number, NeonatalApneaAction])[];
};
