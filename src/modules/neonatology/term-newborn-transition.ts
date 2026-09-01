import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the term newborn transition
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type TermTransitionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neonatologyTermTransitionAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no newborn
 * examined, no cord clamped, no feed given, no outcome predicted — which are
 * constants rather than observations.
 */
export type TermTransitionProgress = Pick<TermTransitionSnapshot,
  'supportAtTick' | 'contextAtTick' | 'recognitionAtTick'
  | 'careAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const TERM_TRANSITION_ACTIONS = [
  'activate-term-newborn-transition-prepared-newborn-and-dyad-support',
  'reconcile-term-newborn-transition-gestation-birth-breathing-tone-heart-rate-temperature-and-whole-dyad',
  'recognize-term-newborn-transition-without-resuscitation-or-well-newborn-closure',
  'review-term-newborn-transition-qualified-cord-skin-to-skin-thermal-and-observation-care',
  'review-term-newborn-transition-fixed-one-hour-qualified-report',
  'handoff-term-newborn-transition-breathing-temperature-feeding-parent-and-outcome-risk',
] as const;

export type TermTransitionAction = (typeof TERM_TRANSITION_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsTermTransition(scenario: Scenario): boolean {
  return scenario.metadata.id === 'term-newborn-transition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'term-newborn-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'term-newborn-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TERM_TRANSITION_ACTIONS.join('|');
}
