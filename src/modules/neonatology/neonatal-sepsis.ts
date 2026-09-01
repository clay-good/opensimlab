import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neonatal sepsis lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type NeonatalSepsisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologySepsisAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no risk
 * calculated, no test obtained, no sepsis diagnosed — which are constants
 * rather than observations.
 */
export type NeonatalSepsisProgress = Pick<NeonatalSepsisSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const NEONATAL_SEPSIS_ACTIONS = [
  'activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support',
  'reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad',
  'recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure',
  'review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries',
  'review-neonatal-sepsis-fixed-one-hour-qualified-report',
  'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk',
] as const;

export type NeonatalSepsisAction = (typeof NEONATAL_SEPSIS_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsNeonatalSepsis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'neonatal-sepsis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-sepsis').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-sepsis-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NEONATAL_SEPSIS_ACTIONS.join('|');
}
