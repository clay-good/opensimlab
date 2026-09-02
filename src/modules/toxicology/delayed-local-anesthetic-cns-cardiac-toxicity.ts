import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the delayed local-anesthetic
 * lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type DelayedLastSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyDelayedLastAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no catheter
 * handled, no rhythm intervention chosen, no alternative excluded, and in
 * particular no rescue eligibility determined — which are constants rather than
 * observations.
 */
export type DelayedLastProgress = Pick<DelayedLastSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const DELAYED_LAST_ACTIONS = [
  'reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient',
  'recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure',
  'activate-toxicology-delayed-last-source-airway-seizure-cardiac-toxicology-lipid-and-refractory-rescue-ownership',
  'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary',
  'record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review',
  'handoff-toxicology-delayed-last-recurrent-seizure-arrhythmia-shock-airway-acidemia-source-lipid-and-refractory-risk',
] as const;

export type DelayedLastAction = (typeof DELAYED_LAST_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * It declares a `rhythm-change` event as well as its narratives, because the
 * bradycardia is a bedside trace rather than a sentence. That is required by
 * name rather than tolerated.
 */
export function supportsDelayedLast(scenario: Scenario): boolean {
  return scenario.metadata.id === 'delayed-local-anesthetic-cns-cardiac-toxicity'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'delayed-local-anesthetic-cns-cardiac-toxicity-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'delayed-local-anesthetic-cns-cardiac-toxicity-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DELAYED_LAST_ACTIONS.join('|');
}
