import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the magnesium-toxicity lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MagnesiumToxicitySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMagnesiumToxicityAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no infusion changed, no airway managed, no oxygen or ventilation
 * delivered, no antidote selected — which are constants rather than
 * observations.
 */
export type MagnesiumToxicityProgress = Pick<MagnesiumToxicitySnapshot,
  'supportAtTick' | 'contextAtTick' | 'uncertaintyAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const MAGNESIUM_TOXICITY_ACTIONS = [
  'activate-obstetrics-magnesium-toxicity-airway-anesthesia-critical-care-pharmacy-and-support-response',
  'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person',
  'review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries',
  'review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness',
  'review-obstetrics-magnesium-toxicity-fixed-five-minute-qualified-response-report',
  'handoff-obstetrics-magnesium-toxicity-respiratory-renal-preeclampsia-medication-newborn-support-and-outcome-risk',
] as const;

export type MagnesiumToxicityAction = (typeof MAGNESIUM_TOXICITY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMagnesiumToxicity(scenario: Scenario): boolean {
  return scenario.metadata.id === 'magnesium-sulfate-toxicity-recognition'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'magnesium-sulfate-toxicity-recognition-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'magnesium-sulfate-toxicity-recognition-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MAGNESIUM_TOXICITY_ACTIONS.join('|');
}
