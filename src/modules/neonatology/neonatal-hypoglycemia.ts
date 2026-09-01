import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neonatal hypoglycemia lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type NeonatalHypoglycemiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyHypoglycemiaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no glucose
 * obtained, no dextrose given, no universal injury threshold claimed — which
 * are constants rather than observations.
 */
export type NeonatalHypoglycemiaProgress = Pick<NeonatalHypoglycemiaSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const NEONATAL_HYPOGLYCEMIA_ACTIONS = [
  'activate-neonatal-hypoglycemia-newborn-glucose-feeding-neurologic-and-family-support',
  'reconcile-neonatal-hypoglycemia-risk-clock-signs-glucose-temperature-feeding-and-whole-dyad',
  'recognize-symptomatic-low-neonatal-glucose-requiring-qualified-immediate-escalation-without-universal-threshold-closure',
  'review-qualified-neonatal-hypoglycemia-local-protocol-treatment-confirmation-and-cause-boundaries',
  'review-neonatal-hypoglycemia-fixed-thirty-minute-qualified-report',
  'handoff-neonatal-hypoglycemia-recurrence-neurologic-feeding-thermal-cause-family-and-outcome-risk',
] as const;

export type NeonatalHypoglycemiaAction = (typeof NEONATAL_HYPOGLYCEMIA_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsNeonatalHypoglycemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'neonatal-hypoglycemia'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neonatal-hypoglycemia').length === 1
    && scenario.timeline.filter((event) => event.target === 'neonatal-hypoglycemia-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NEONATAL_HYPOGLYCEMIA_ACTIONS.join('|');
}
