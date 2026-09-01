import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the sympathomimetic lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type SympathomimeticSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologySympathomimeticAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no restraint
 * chosen, no cardiovascular therapy selected, no alternative excluded, and in
 * particular no adjunct eligibility determined — which are constants rather
 * than observations.
 */
export type SympathomimeticProgress = Pick<SympathomimeticSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const SYMPATHOMIMETIC_ACTIONS = [
  'reconcile-toxicology-sympathomimetic-exposure-clock-agitation-autonomic-temperature-and-whole-patient',
  'recognize-toxicology-sympathomimetic-coupled-pattern-without-screen-pupil-pressure-temperature-or-agitation-only-closure',
  'activate-toxicology-sympathomimetic-deescalation-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
  'review-toxicology-sympathomimetic-supplied-mental-autonomic-cardiac-temperature-renal-ck-and-differential-boundary',
  'record-toxicology-sympathomimetic-bounded-qualified-deescalation-support-sedation-cooling-surveillance-airway-and-adjunct-intent-with-strict-later-review',
  'handoff-toxicology-sympathomimetic-rebound-agitation-psychosis-suicidality-ischemia-arrhythmia-hyperthermia-rhabdomyolysis-coingestion-airway-and-active-risk',
] as const;

export type SympathomimeticAction = (typeof SYMPATHOMIMETIC_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like its hyperthermic neighbours it declares a `rhythm-change` event as well
 * as its narratives, because the tachycardia is a bedside trace rather than a
 * sentence. That is required by name rather than tolerated.
 */
export function supportsSympathomimetic(scenario: Scenario): boolean {
  return scenario.metadata.id === 'sympathomimetic-hyperadrenergic-hyperthermia'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'sympathomimetic-hyperadrenergic-hyperthermia-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'sympathomimetic-hyperadrenergic-hyperthermia-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SYMPATHOMIMETIC_ACTIONS.join('|');
}
