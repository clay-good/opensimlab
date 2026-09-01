import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the serotonin-toxicity lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type SerotoninSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologySerotoninAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no temperature
 * measured, no alternative excluded, no neuromuscular blocker chosen, and in
 * particular no rescue eligibility determined — which are constants rather than
 * observations.
 */
export type SerotoninProgress = Pick<SerotoninSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const SEROTONIN_ACTIONS = [
  'reconcile-toxicology-serotonin-agents-clock-mental-autonomic-neuromuscular-temperature-and-whole-patient',
  'recognize-toxicology-serotonin-coupled-pattern-without-hunter-clonus-temperature-or-medication-list-only-closure',
  'activate-toxicology-serotonin-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
  'review-toxicology-serotonin-supplied-cns-autonomic-neuromuscular-temperature-ecg-renal-ck-and-differential-boundary',
  'record-toxicology-serotonin-bounded-qualified-source-cessation-cooling-support-sedation-seizure-surveillance-airway-and-antagonist-intent-with-strict-later-review',
  'handoff-toxicology-serotonin-rebound-hyperthermia-clonus-rigidity-seizure-rhabdomyolysis-coingestion-airway-and-active-risk',
] as const;

export type SerotoninAction = (typeof SEROTONIN_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like its hyperthermic neighbours it declares a `rhythm-change` event as well
 * as its narratives, because the tachycardia is a bedside trace rather than a
 * sentence. That is required by name rather than tolerated.
 */
export function supportsSerotonin(scenario: Scenario): boolean {
  return scenario.metadata.id === 'serotonin-toxicity-hyperthermia-clonus'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'serotonin-toxicity-hyperthermia-clonus-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'serotonin-toxicity-hyperthermia-clonus-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SEROTONIN_ACTIONS.join('|');
}
