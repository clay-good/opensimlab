import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric DKA lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricDkaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricDiabeticKetoacidosisAssessment']>;

/**
 * The six recorded steps.
 *
 * Like the other three pediatric metabolic and sepsis-family lessons, this
 * engine case authors no refusable choice, and it shares the branching shape:
 * qualified care ownership and the neurological-metabolic safety review are
 * unordered against each other, and the later report refuses until both are
 * active and simulated time has passed since whichever landed second.
 *
 * One flag on this snapshot is worth reading carefully. `cerebralInjuryAuthored`
 * is a fixed `false` and `cerebralInjuryRiskActive` is a fixed `true`: no
 * warning cluster is present now, and that is never the same as an exclusion.
 * `cerebralInjuryExcluded` stays `false` for the whole lesson, including after
 * the improving later report.
 */
export type PediatricDkaProgress = Pick<PediatricDkaSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'careAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_DKA_ACTIONS = [
  'reconcile-pediatric-dka-illness-and-fixed-pattern',
  'recognize-pediatric-dka-and-current-risk',
  'activate-pediatric-dka-qualified-care-ownership',
  'review-pediatric-dka-neurologic-and-metabolic-safety',
  'review-pediatric-dka-later-response',
  'handoff-pediatric-dka-active-risk',
] as const;

export type PediatricDkaAction = (typeof PEDIATRIC_DKA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives on the main target, as in the dehydration lesson rather than
 * the three the sepsis pair use, so the count is asserted rather than assumed.
 */
export function supportsPediatricDka(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-diabetic-ketoacidosis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-diabetic-ketoacidosis-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-diabetic-ketoacidosis-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_DKA_ACTIONS.join('|');
}
