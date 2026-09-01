import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the tricyclic lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type TricyclicSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyTricyclicAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no ECG
 * acquired or interpreted, no antiarrhythmic chosen, no rescue selected, no
 * recurrence excluded — which are constants rather than observations.
 */
export type TricyclicProgress = Pick<TricyclicSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const TRICYCLIC_ACTIONS = [
  'reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient',
  'recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure',
  'activate-toxicology-tricyclic-poison-center-resuscitation-cardiac-airway-seizure-and-safety-ownership',
  'review-toxicology-tricyclic-supplied-ecg-perfusion-acid-base-electrolyte-coingestion-and-rescue-boundary',
  'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk',
] as const;

export type TricyclicAction = (typeof TRICYCLIC_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Unlike its neighbours in this module, this lesson also declares a
 * `rhythm-change` event, because the wide complex is a bedside trace rather
 * than a sentence. That is required here rather than tolerated: a version of
 * this scenario without it would be a different lesson.
 */
export function supportsTricyclic(scenario: Scenario): boolean {
  return scenario.metadata.id === 'tricyclic-sodium-channel-cardiotoxicity'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'tricyclic-sodium-channel-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'tricyclic-sodium-channel-cardiotoxicity-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'tricyclic-sodium-channel-cardiotoxicity-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TRICYCLIC_ACTIONS.join('|');
}
