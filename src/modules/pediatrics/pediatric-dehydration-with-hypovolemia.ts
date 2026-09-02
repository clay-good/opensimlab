import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric dehydration lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricDehydrationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricDehydrationAssessment']>;

/**
 * The six recorded steps.
 *
 * Like pediatric sepsis and septic shock, this engine case authors no
 * refusable choice, so there is no `lastUnsupportedChoice` to read. It shares
 * the septic-shock shape rather than the sepsis one: rehydration ownership and
 * the ongoing-loss safety review are unordered against each other, either may
 * be recorded first, and the later report refuses until both are active and
 * simulated time has passed since whichever landed second.
 */
export type PediatricDehydrationProgress = Pick<PediatricDehydrationSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'rehydrationAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_DEHYDRATION_ACTIONS = [
  'reconcile-pediatric-dehydration-losses-and-perfusion',
  'recognize-pediatric-dehydration-with-hypovolemia',
  'activate-pediatric-dehydration-qualified-rehydration-ownership',
  'review-pediatric-dehydration-ongoing-losses-and-safety',
  'review-pediatric-dehydration-later-response',
  'handoff-pediatric-dehydration-active-risk',
] as const;

export type PediatricDehydrationAction = (typeof PEDIATRIC_DEHYDRATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * This lesson carries two narratives on its main target, not the three the
 * sepsis and septic-shock lessons use, so the count is asserted rather than
 * assumed.
 */
export function supportsPediatricDehydration(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-dehydration-with-hypovolemia'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-dehydration-with-hypovolemia-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-dehydration-with-hypovolemia-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_DEHYDRATION_ACTIONS.join('|');
}
