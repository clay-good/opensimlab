import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the anticholinergic lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type AnticholinergicSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyAnticholinergicAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no temperature
 * measured, no cooling method chosen, no alternative excluded, and in
 * particular no antidote eligibility determined — which are constants rather
 * than observations.
 */
export type AnticholinergicProgress = Pick<AnticholinergicSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const ANTICHOLINERGIC_ACTIONS = [
  'reconcile-toxicology-anticholinergic-product-clock-delirium-temperature-dryness-retention-ecg-and-whole-patient',
  'recognize-toxicology-anticholinergic-central-and-peripheral-pattern-without-mnemonic-temperature-or-pupil-only-closure',
  'activate-toxicology-anticholinergic-resuscitation-cooling-airway-toxicology-monitoring-and-compassionate-safety-ownership',
  'review-toxicology-anticholinergic-supplied-temperature-cns-ecg-renal-ck-retention-and-differential-boundary',
  'record-toxicology-anticholinergic-bounded-qualified-cooling-support-sedation-seizure-surveillance-and-physostigmine-eligibility-intent-with-strict-later-review',
  'handoff-toxicology-anticholinergic-rebound-delirium-hyperthermia-retention-rhabdomyolysis-seizure-coingestion-and-active-risk',
] as const;

export type AnticholinergicAction = (typeof ANTICHOLINERGIC_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like several of its neighbours it declares a `rhythm-change` event as well as
 * its narratives, because the tachycardia is a bedside trace rather than a
 * sentence. That is required by name rather than tolerated.
 */
export function supportsAnticholinergic(scenario: Scenario): boolean {
  return scenario.metadata.id === 'anticholinergic-hyperthermia-delirium'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'anticholinergic-hyperthermia-delirium-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'anticholinergic-hyperthermia-delirium-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ANTICHOLINERGIC_ACTIONS.join('|');
}
