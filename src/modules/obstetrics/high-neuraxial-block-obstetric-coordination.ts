import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the high-neuraxial-block lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type HighNeuraxialSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsHighNeuraxialAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no block assessed, no airway managed, no oxygen or ventilation
 * delivered, no birth planned — which are constants rather than observations.
 */
export type HighNeuraxialProgress = Pick<HighNeuraxialSnapshot,
  'supportAtTick' | 'contextAtTick' | 'uncertaintyAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const HIGH_NEURAXIAL_ACTIONS = [
  'activate-obstetrics-high-neuraxial-block-airway-anesthesia-obstetric-theatre-newborn-and-support-response',
  'reconcile-obstetrics-high-neuraxial-block-injection-clock-level-breathing-arms-circulation-fetus-and-whole-person',
  'review-obstetrics-high-neuraxial-block-rapid-progression-awareness-and-alternative-cause-boundaries',
  'review-obstetrics-high-neuraxial-block-parallel-airway-ventilation-circulation-uterine-displacement-fetal-birth-and-support-readiness',
  'review-obstetrics-high-neuraxial-block-fixed-four-minute-qualified-support-report',
  'handoff-obstetrics-high-neuraxial-block-airway-circulation-block-fetal-birth-awareness-support-and-outcome-risk',
] as const;

export type HighNeuraxialAction = (typeof HIGH_NEURAXIAL_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsHighNeuraxial(scenario: Scenario): boolean {
  return scenario.metadata.id === 'high-neuraxial-block-obstetric-coordination'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'high-neuraxial-block-obstetric-coordination-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'high-neuraxial-block-obstetric-coordination-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HIGH_NEURAXIAL_ACTIONS.join('|');
}
