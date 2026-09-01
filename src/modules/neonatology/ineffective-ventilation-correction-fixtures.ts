import type { IneffectiveVentilationAction } from './ineffective-ventilation-correction';

/**
 * Reference transcripts for the ineffective newborn ventilation lesson.
 *
 * The error path is the escalation this lesson exists to delay. A newborn who
 * is not responding invites the next intervention, and the shape refused here
 * is reaching for what comes after correction before anyone has established the
 * team, the clock and the interface. The recovery path starts from exactly
 * those refusals and still reaches a correct handoff in the same run.
 */
export const INEFFECTIVE_VENTILATION_FIXTURES = {
  scenarioId: 'ineffective-ventilation-correction', contentVersion: '0.1.0', seed: 3742,
  noAction: [],
  expert: [
    [0, 'activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response'],
    [1, 'reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad'],
    [2, 'recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure'],
    [3, 'review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary'],
    [4, 'review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report'],
    [5, 'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure'],
    [1, 'review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report'],
    [2, 'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure'],
    [1, 'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'],
    [2, 'activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response'],
    [3, 'reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad'],
    [4, 'recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure'],
    [5, 'review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary'],
    [6, 'review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report'],
    [7, 'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, IneffectiveVentilationAction])[];
  expert: readonly (readonly [number, IneffectiveVentilationAction])[];
  commonError: readonly (readonly [number, IneffectiveVentilationAction])[];
  recovery: readonly (readonly [number, IneffectiveVentilationAction])[];
};
