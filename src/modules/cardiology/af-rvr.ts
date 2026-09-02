import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the AF-with-rapid-response lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type AfRvrSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['afRvrAssessment']>;

/**
 * The five recorded steps, in a strict line with no time gate.
 *
 * `hemodynamicallyStable` is a fixed `true` and `durationCertain` a fixed
 * `false`, and that pair is most of the lesson: a stable patient means there is
 * time to think, and an uncertain duration is what makes cardioversion a
 * question rather than an option. `exactScoreCalculated` and
 * `treatmentDelivered` stay `false`.
 */
export type AfRvrProgress = Pick<AfRvrSnapshot,
  'stabilityAtTick' | 'contextAtTick' | 'rateIntentAtTick'
  | 'strokePreventionAtTick' | 'reassessmentAtTick'>;

export const AF_RVR_ACTIONS = [
  'reconcile-af-rvr-rhythm-and-stability',
  'review-af-rvr-context-and-triggers',
  'record-af-rvr-rate-control-intent',
  'record-af-rvr-stroke-prevention-intent',
  'reassess-af-rvr-trajectory-and-follow-up',
] as const;

export type AfRvrAction = (typeof AF_RVR_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * As in the SVT and bradycardic-arrest lessons, this timeline is not all
 * narrative: it opens with a `rhythm-change` event putting the irregularly
 * irregular rhythm on the teaching monitor.
 */
export function supportsAfRvr(scenario: Scenario): boolean {
  return scenario.metadata.id === 'atrial-fibrillation-with-rapid-response'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'atrial-fibrillation').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'atrial-fibrillation-with-rapid-response').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'atrial-fibrillation-with-rapid-response-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === AF_RVR_ACTIONS.join('|');
}
