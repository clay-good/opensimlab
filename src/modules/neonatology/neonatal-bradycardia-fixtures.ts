import type { NeonatalBradycardiaAction } from './neonatal-bradycardia';

/**
 * Reference transcripts for the neonatal bradycardia lesson.
 *
 * This is the lesson where the compression threshold is actually met, and the
 * error path is still the one that reaches for it early: naming the threshold
 * before the team is assembled and the ventilation evidence connected. Being
 * right about the number is not the same as having established it. The recovery
 * path starts from exactly those refusals and still reaches a correct handoff
 * in the same run.
 */
export const NEONATAL_BRADYCARDIA_FIXTURES = {
  scenarioId: 'neonatal-bradycardia', contentVersion: '0.1.0', seed: 5264,
  noAction: [],
  expert: [
    [0, 'activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response'],
    [1, 'reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad'],
    [2, 'recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation'],
    [3, 'review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary'],
    [4, 'review-neonatal-bradycardia-fixed-three-minute-qualified-response-report'],
    [5, 'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation'],
    [1, 'review-neonatal-bradycardia-fixed-three-minute-qualified-response-report'],
    [2, 'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation'],
    [1, 'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'],
    [2, 'activate-neonatal-bradycardia-qualified-compression-ventilation-clock-and-dyad-response'],
    [3, 'reconcile-neonatal-bradycardia-adequate-ventilation-heart-rate-airway-oxygenation-and-whole-dyad'],
    [4, 'recognize-neonatal-bradycardia-compression-threshold-after-adequate-ventilation'],
    [5, 'review-qualified-neonatal-compression-ventilation-coordination-and-epinephrine-boundary'],
    [6, 'review-neonatal-bradycardia-fixed-three-minute-qualified-response-report'],
    [7, 'handoff-neonatal-bradycardia-respiratory-circulatory-neurologic-parent-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, NeonatalBradycardiaAction])[];
  expert: readonly (readonly [number, NeonatalBradycardiaAction])[];
  commonError: readonly (readonly [number, NeonatalBradycardiaAction])[];
  recovery: readonly (readonly [number, NeonatalBradycardiaAction])[];
};
