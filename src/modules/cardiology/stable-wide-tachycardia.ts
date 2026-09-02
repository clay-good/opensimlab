import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the stable wide-complex tachycardia
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type StableWideTachycardiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['stableWideTachycardiaAssessment']>;

/**
 * Seven recorded steps against six declared objectives, and two time gates.
 *
 * As in the narrow-complex lesson, the extra step is the observation rather
 * than a decision: recording the authored medication pathway and reviewing
 * whether it worked are separate, and the escalation refuses until the second
 * one lands. This lesson is the only cardiology lab given evidence so far
 * whose `meaningful-progression` requirement was already satisfied before this
 * change, and its six objectives exceed the shared observable-objectives cap
 * of five — so unlike its siblings it leaves three requirements outstanding
 * rather than two.
 *
 * `hemodynamicallyStable` is a fixed `true`, `mechanismProven` a fixed
 * `false` — the rhythm converts and nobody has proven it was ventricular —
 * and `learnerTreatmentDelivered` stays `false`.
 */
export type StableWideTachycardiaProgress = Pick<StableWideTachycardiaSnapshot,
  'stabilityAtTick' | 'contextAtTick' | 'readinessAtTick' | 'medicationAtTick'
  | 'nonresponseAtTick' | 'cardioversionAtTick' | 'reassessmentAtTick'>;

export const STABLE_WIDE_TACHYCARDIA_ACTIONS = [
  'reconcile-stable-wide-complex-tachycardia',
  'review-wide-complex-context',
  'prepare-wide-complex-pathway',
  'record-wide-complex-procainamide-pathway',
  'review-wide-complex-medication-nonresponse',
  'record-wide-complex-cardioversion-intent',
  'reassess-wide-complex-trajectory',
] as const;

export type StableWideTachycardiaAction = (typeof STABLE_WIDE_TACHYCARDIA_ACTIONS)[number];

/** The six declared objectives, which collapse the medication pair into one. */
export const STABLE_WIDE_TACHYCARDIA_OBJECTIVES = [
  'reconcile-stable-wide-complex-tachycardia',
  'review-wide-complex-context',
  'prepare-wide-complex-pathway',
  'review-wide-complex-medication-response',
  'record-wide-complex-cardioversion-intent',
  'reassess-wide-complex-trajectory',
] as const;

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsStableWideTachycardia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'wide-complex-tachycardia'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'ventricular-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'wide-complex-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'wide-complex-tachycardia-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === STABLE_WIDE_TACHYCARDIA_OBJECTIVES.join('|');
}
