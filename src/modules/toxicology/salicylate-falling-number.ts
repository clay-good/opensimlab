import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the salicylate lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type SalicylateSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologySalicylateAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no gas
 * acquired, no airway plan chosen, no dialysis threshold set, no tissue
 * concentration proven — which are constants rather than observations.
 */
export type SalicylateProgress = Pick<SalicylateSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const SALICYLATE_ACTIONS = [
  'reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient',
  'recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure',
  'activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership',
  'review-toxicology-salicylate-supplied-serial-level-acid-base-volume-electrolyte-and-airway-boundary',
  'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review',
  'handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk',
] as const;

export type SalicylateAction = (typeof SALICYLATE_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsSalicylate(scenario: Scenario): boolean {
  return scenario.metadata.id === 'salicylate-falling-number'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'salicylate-falling-number-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'salicylate-falling-number-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SALICYLATE_ACTIONS.join('|');
}
