import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neonatal apnea lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type NeonatalApneaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyApneaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no ventilation
 * delivered, no airway managed, no cause determined — which are constants
 * rather than observations.
 */
export type NeonatalApneaProgress = Pick<NeonatalApneaSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const NEONATAL_APNEA_ACTIONS = [
  'activate-neonatal-apnea-qualified-newborn-airway-clock-and-dyad-support',
  'reconcile-neonatal-apnea-gestation-birth-clock-breathing-heart-rate-tone-temperature-and-whole-dyad',
  'recognize-neonatal-apnea-ventilation-threshold-without-cause-or-outcome-closure',
  'review-neonatal-apnea-qualified-effective-ventilation-heart-rate-and-escalation-readiness',
  'review-neonatal-apnea-fixed-ninety-second-qualified-response-report',
  'handoff-neonatal-apnea-respiratory-thermal-glucose-neurologic-parent-and-outcome-risk',
] as const;

export type NeonatalApneaAction = (typeof NEONATAL_APNEA_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsNeonatalApnea(scenario: Scenario): boolean {
  return scenario.metadata.id === 'neonatal-apnea'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-apnea-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-apnea-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NEONATAL_APNEA_ACTIONS.join('|');
}
