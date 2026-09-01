import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the beta-blocker lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type BetaBlockerSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyBetaBlockerAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no ECG or
 * imaging acquired, no pacing chosen, no rescue selected, no durable perfusion
 * proven — which are constants rather than observations.
 */
export type BetaBlockerProgress = Pick<BetaBlockerSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const BETA_BLOCKER_ACTIONS = [
  'reconcile-toxicology-beta-blocker-product-clock-pulse-perfusion-mentation-glucose-ecg-and-whole-patient',
  'recognize-toxicology-beta-blocker-cardiogenic-shock-pattern-without-pulse-only-closure',
  'activate-toxicology-beta-blocker-poison-center-resuscitation-cardiac-glucose-airway-and-safety-ownership',
  'review-toxicology-beta-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary',
  'record-toxicology-beta-blocker-bounded-qualified-vasopressor-glucagon-insulin-euglycemia-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-beta-blocker-recurrent-shock-bradycardia-hypoglycemia-electrolyte-volume-rescue-and-active-risk',
] as const;

export type BetaBlockerAction = (typeof BETA_BLOCKER_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like the tricyclic lesson, this one declares a `rhythm-change` event as well
 * as its narratives, because the bradycardia is a bedside trace rather than a
 * sentence. That is required by name rather than tolerated.
 */
export function supportsBetaBlocker(scenario: Scenario): boolean {
  return scenario.metadata.id === 'beta-blocker-cardiogenic-shock'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'beta-blocker-cardiogenic-shock-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'beta-blocker-cardiogenic-shock-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === BETA_BLOCKER_ACTIONS.join('|');
}
