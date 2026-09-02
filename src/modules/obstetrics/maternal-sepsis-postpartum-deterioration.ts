import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the maternal-sepsis lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MaternalSepsisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMaternalSepsisAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no score
 * calculated, no culture or sample acquired, no antimicrobial chosen, no source
 * control performed — which are constants rather than observations.
 */
export type MaternalSepsisProgress = Pick<MaternalSepsisSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const MATERNAL_SEPSIS_ACTIONS = [
  'reconcile-obstetrics-sepsis-postpartum-clock-infection-organ-dysfunction-and-whole-person',
  'recognize-obstetrics-maternal-sepsis-emergency-without-fever-score-source-or-single-value-closure',
  'activate-obstetrics-sepsis-obstetric-critical-care-anesthesia-nursing-pharmacy-microbiology-source-newborn-and-dignity-ownership',
  'review-obstetrics-sepsis-supplied-infectious-noninfectious-culture-lactate-perfusion-and-source-boundary',
  'record-obstetrics-sepsis-bounded-qualified-immediate-care-source-control-intent-and-strict-later-review',
  'handoff-obstetrics-sepsis-shock-source-organ-antimicrobial-vte-newborn-survivor-and-outcome-risk',
] as const;

export type MaternalSepsisAction = (typeof MATERNAL_SEPSIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMaternalSepsis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'maternal-sepsis-postpartum-deterioration'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'maternal-sepsis-postpartum-deterioration-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'maternal-sepsis-postpartum-deterioration-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MATERNAL_SEPSIS_ACTIONS.join('|');
}
