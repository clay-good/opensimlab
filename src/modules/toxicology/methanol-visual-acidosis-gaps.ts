import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the methanol lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MethanolSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyMethanolAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no gap
 * calculated, no laboratory interpreted, no alternative excluded, and in
 * particular neither antidote nor extracorporeal eligibility determined —
 * which are constants rather than observations.
 */
export type MethanolProgress = Pick<MethanolSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const METHANOL_ACTIONS = [
  'reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient',
  'recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure',
  'activate-toxicology-methanol-resuscitation-airway-antidote-extracorporeal-toxicology-laboratory-and-vision-ownership',
  'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary',
  'record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review',
  'handoff-toxicology-methanol-rebound-acidosis-vision-neurologic-airway-renal-electrolyte-coingestion-and-active-risk',
] as const;

export type MethanolAction = (typeof METHANOL_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * It declares a `rhythm-change` event as well as its narratives, because the
 * tachycardia is a bedside trace rather than a sentence. That is required by
 * name rather than tolerated.
 */
export function supportsMethanol(scenario: Scenario): boolean {
  return scenario.metadata.id === 'methanol-visual-acidosis-gaps'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'rhythm-change')
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'sinus-tachycardia').length === 1
    && scenario.timeline.filter((event) => event.target === 'methanol-visual-acidosis-gaps-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'methanol-visual-acidosis-gaps-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === METHANOL_ACTIONS.join('|');
}
