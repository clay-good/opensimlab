import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the digoxin lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type DigoxinSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyDigoxinAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no level
 * interpreted, no vial count chosen, no pacing selected, and in particular no
 * assay interference resolved — which are constants rather than observations.
 */
export type DigoxinProgress = Pick<DigoxinSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const DIGOXIN_ACTIONS = [
  'reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient',
  'recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure',
  'activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership',
  'review-toxicology-digoxin-supplied-ecg-level-timing-potassium-renal-coingestion-and-antidote-boundary',
  'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review',
  'handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk',
] as const;

export type DigoxinAction = (typeof DIGOXIN_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like the other cardiotoxicity lessons in this module, it declares a
 * `rhythm-change` event as well as its narratives, because the complete block
 * is a bedside trace rather than a sentence. That is required by name rather
 * than tolerated.
 */
export function supportsDigoxin(scenario: Scenario): boolean {
  return scenario.metadata.id === 'digoxin-rhythm-potassium'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'complete-heart-block').length === 1
    && scenario.timeline.filter((event) => event.target === 'digoxin-rhythm-potassium-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'digoxin-rhythm-potassium-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DIGOXIN_ACTIONS.join('|');
}
