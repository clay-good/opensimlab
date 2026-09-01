import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the meconium-stained transition
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MeconiumTransitionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyMeconiumTransitionAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no suction
 * performed, no airway managed, no aspiration excluded — which are constants
 * rather than observations.
 */
export type MeconiumTransitionProgress = Pick<MeconiumTransitionSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const MECONIUM_TRANSITION_ACTIONS = [
  'activate-meconium-stained-transition-prepared-newborn-airway-and-dyad-support',
  'reconcile-meconium-stained-transition-fluid-breathing-tone-heart-rate-airway-and-whole-dyad',
  'recognize-vigorous-meconium-stained-transition-without-routine-suction',
  'review-qualified-selective-airway-clearing-observation-and-escalation-boundaries',
  'review-meconium-stained-transition-fixed-thirty-minute-qualified-report',
  'handoff-meconium-stained-transition-respiratory-thermal-feeding-parent-and-outcome-risk',
] as const;

export type MeconiumTransitionAction = (typeof MECONIUM_TRANSITION_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsMeconiumTransition(scenario: Scenario): boolean {
  return scenario.metadata.id === 'meconium-stained-transition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'meconium-stained-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'meconium-stained-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MECONIUM_TRANSITION_ACTIONS.join('|');
}
