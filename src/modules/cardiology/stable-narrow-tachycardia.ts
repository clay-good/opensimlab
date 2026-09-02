import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the stable narrow-complex
 * tachycardia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type StableNarrowTachycardiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['stableNarrowTachycardiaAssessment']>;

/**
 * Six recorded steps against five declared objectives.
 *
 * The extra step is `review-stable-regular-narrow-vagal-response`, which has
 * no matching objective because it is not a decision — it is the observation
 * that the maneuver did not work, and the engine makes it a separate recorded
 * step precisely so it cannot be skipped on the way to a drug. Two time gates
 * enforce that: the vagal response refuses until a tick has passed since the
 * vagal intent, and the reassessment refuses until a tick has passed since the
 * adenosine intent.
 *
 * `hemodynamicallyStable` is a fixed `true`, `mechanismProven` a fixed `false`
 * — the rhythm converts and the mechanism is still not established — and
 * `treatmentDelivered` stays `false`.
 */
export type StableNarrowTachycardiaProgress = Pick<StableNarrowTachycardiaSnapshot,
  'stabilityAtTick' | 'contextAtTick' | 'vagalAtTick'
  | 'vagalResponseAtTick' | 'adenosineAtTick' | 'reassessmentAtTick'>;

export const STABLE_NARROW_TACHYCARDIA_ACTIONS = [
  'reconcile-stable-regular-narrow-tachycardia',
  'review-stable-regular-narrow-context',
  'record-stable-regular-narrow-vagal-intent',
  'review-stable-regular-narrow-vagal-response',
  'record-stable-regular-narrow-adenosine-intent',
  'reassess-stable-regular-narrow-trajectory',
] as const;

export type StableNarrowTachycardiaAction =
  (typeof STABLE_NARROW_TACHYCARDIA_ACTIONS)[number];

/** The five declared objectives, which omit the vagal-response observation. */
export const STABLE_NARROW_TACHYCARDIA_OBJECTIVES = [
  'reconcile-stable-regular-narrow-tachycardia',
  'review-stable-regular-narrow-context',
  'record-stable-regular-narrow-vagal-intent',
  'record-stable-regular-narrow-adenosine-intent',
  'reassess-stable-regular-narrow-trajectory',
] as const;

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. The timeline opens with a `rhythm-change` event, as in the SVT and
 * AF lessons.
 */
export function supportsStableNarrowTachycardia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'regular-narrow-complex-tachycardia'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'svt').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'regular-narrow-complex-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'regular-narrow-complex-tachycardia-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === STABLE_NARROW_TACHYCARDIA_OBJECTIVES.join('|');
}
