import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the hypoglycemic-seizure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricHypoglycemicSeizureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricHypoglycemicSeizureAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice and shares the unordered-pair
 * shape: rescue ownership and the cause-and-recurrence review may be recorded
 * in either order, and the later report refuses until both are active and
 * simulated time has passed since whichever landed second.
 *
 * Two fixed numbers on this snapshot carry the lesson: `initialGlucoseMgPerDl`
 * is 34 and `laterGlucoseMgPerDl` is 86. The second is the one to be careful
 * with — `seizureCauseProven`, `durableEuglycemiaProven`, `recurrenceExcluded`
 * and `neurologicRecoveryProven` all stay `false` after it.
 */
export type PediatricHypoglycemicSeizureProgress = Pick<PediatricHypoglycemicSeizureSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'rescueAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_HYPOGLYCEMIC_SEIZURE_ACTIONS = [
  'reconcile-pediatric-hypoglycemic-seizure-whole-child-and-glucose',
  'recognize-pediatric-hypoglycemic-seizure',
  'activate-pediatric-hypoglycemic-seizure-qualified-rescue-ownership',
  'review-pediatric-hypoglycemic-seizure-causes-and-recurrence-risk',
  'review-pediatric-hypoglycemic-seizure-later-response',
  'handoff-pediatric-hypoglycemic-seizure-active-risk',
] as const;

export type PediatricHypoglycemicSeizureAction =
  (typeof PEDIATRIC_HYPOGLYCEMIC_SEIZURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPediatricHypoglycemicSeizure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-hypoglycemic-seizure'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-hypoglycemic-seizure-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-hypoglycemic-seizure-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_HYPOGLYCEMIC_SEIZURE_ACTIONS.join('|');
}
