import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the cholinergic lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type CholinergicSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyCholinergicAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The third one is `safetyAtTick` rather than the `supportAtTick` its
 * neighbours use, and the difference is the lesson: what gets protected first
 * here is the room, not the patient in it.
 */
export type CholinergicProgress = Pick<CholinergicSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'safetyAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const CHOLINERGIC_ACTIONS = [
  'reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient',
  'recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure',
  'activate-toxicology-cholinergic-ppe-decontamination-airway-resuscitation-poison-center-and-safety-ownership',
  'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary',
  'record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review',
  'handoff-toxicology-cholinergic-recurrent-secretions-bronchospasm-weakness-intermediate-syndrome-exposure-seizure-and-active-risk',
] as const;

export type CholinergicAction = (typeof CHOLINERGIC_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like the other cardiotoxicity-adjacent lessons here it declares a
 * `rhythm-change` event as well as its narratives, because the bradycardia is a
 * bedside trace rather than a sentence. That is required by name rather than
 * tolerated.
 */
export function supportsCholinergic(scenario: Scenario): boolean {
  return scenario.metadata.id === 'cholinergic-pesticide-respiratory-failure'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-bradycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'cholinergic-pesticide-respiratory-failure-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'cholinergic-pesticide-respiratory-failure-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CHOLINERGIC_ACTIONS.join('|');
}
