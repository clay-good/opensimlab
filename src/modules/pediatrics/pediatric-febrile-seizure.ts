import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the febrile-seizure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricFebrileSeizureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricFebrileSeizureAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice and shares the unordered-pair
 * shape: care ownership and the infection-recurrence review may be recorded in
 * either order, and the later report refuses until both are active and
 * simulated time has passed since whichever landed second.
 *
 * Six flags on this snapshot are the lesson. `simpleFebrileSeizureFinallyProven`,
 * `benignCourseProven`, `seizureCauseProven`, `cnsInfectionExcluded`,
 * `seriousInfectionExcluded` and `recurrenceExcluded` are all fixed `false` and
 * stay false through the improving later report. "Simple features to date" is
 * the strongest claim this lesson ever makes.
 */
export type PediatricFebrileSeizureProgress = Pick<PediatricFebrileSeizureSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'careAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_FEBRILE_SEIZURE_ACTIONS = [
  'reconcile-pediatric-febrile-seizure-event-recovery-and-fever',
  'recognize-pediatric-febrile-seizure-pattern-and-danger-boundary',
  'activate-pediatric-febrile-seizure-qualified-care-ownership',
  'review-pediatric-febrile-seizure-infection-recurrence-and-alternatives',
  'review-pediatric-febrile-seizure-later-response',
  'handoff-pediatric-febrile-seizure-active-risk',
] as const;

export type PediatricFebrileSeizureAction = (typeof PEDIATRIC_FEBRILE_SEIZURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPediatricFebrileSeizure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-febrile-seizure'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-febrile-seizure-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-febrile-seizure-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_FEBRILE_SEIZURE_ACTIONS.join('|');
}
