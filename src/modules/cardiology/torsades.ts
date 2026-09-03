import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the torsades lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type TorsadesSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['torsadesAssessment']>;

/**
 * Six recorded steps against six declared objectives, one unordered pair, and
 * two time gates.
 *
 * The shape is a strict chain and then a fork. Recognition, the shock intent
 * and the post-shock review must happen in that order, and the engine refuses
 * anything else — including, in particular, the magnesium and the cause work,
 * which is the whole argument of the lesson. Only afterwards do the long-QT
 * context and the recurrence-suppression intent become an unordered pair, with
 * the handoff refusing until both have landed and a tick has passed.
 *
 * Six objectives exceed the shared observable-objectives cap of five, so this
 * lesson leaves three requirements outstanding rather than two.
 *
 * `initialPulsePresent` is a fixed `true`, and `shockDeliveredByLearner` and
 * `treatmentDeliveredByLearner` both stay `false` — the treating team shocks
 * her, not the learner.
 */
export type TorsadesProgress = Pick<TorsadesSnapshot,
  'recognitionAtTick' | 'shockIntentAtTick' | 'postShockAtTick'
  | 'contextAtTick' | 'recurrenceIntentAtTick' | 'handoffAtTick'>;

export const TORSADES_ACTIONS = [
  'reconcile-torsades-pulse-and-pattern',
  'record-torsades-unsynchronized-shock-intent',
  'review-torsades-post-shock-rhythm',
  'review-torsades-long-qt-context',
  'record-torsades-recurrence-suppression-intent',
  'handoff-torsades-recurrence-plan',
] as const;

export type TorsadesAction = (typeof TORSADES_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsTorsades(scenario: Scenario): boolean {
  return scenario.metadata.id === 'torsades-de-pointes'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'torsades-de-pointes').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'torsades-de-pointes').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'torsades-de-pointes-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TORSADES_ACTIONS.join('|');
}
