import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the calcium-channel-blocker
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type CalciumChannelBlockerSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyCalciumChannelBlockerAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no ECG or
 * imaging acquired, no pacing chosen, no rescue selected, and in particular no
 * absorption completed — which are constants rather than observations.
 */
export type CalciumChannelBlockerProgress = Pick<CalciumChannelBlockerSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const CALCIUM_CHANNEL_BLOCKER_ACTIONS = [
  'reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient',
  'recognize-toxicology-calcium-channel-blocker-mixed-shock-pattern-without-glucose-or-pulse-only-closure',
  'activate-toxicology-calcium-channel-blocker-poison-center-resuscitation-cardiac-metabolic-airway-and-safety-ownership',
  'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary',
  'record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk',
] as const;

export type CalciumChannelBlockerAction = (typeof CALCIUM_CHANNEL_BLOCKER_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like its two neighbours, this lesson declares a `rhythm-change` event as well
 * as its narratives, because the complete block is a bedside trace rather than
 * a sentence. That is required by name rather than tolerated.
 */
export function supportsCalciumChannelBlocker(scenario: Scenario): boolean {
  return scenario.metadata.id === 'calcium-channel-blocker-shock'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'complete-heart-block').length === 1
    && scenario.timeline.filter((event) => event.target === 'calcium-channel-blocker-shock-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'calcium-channel-blocker-shock-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CALCIUM_CHANNEL_BLOCKER_ACTIONS.join('|');
}
