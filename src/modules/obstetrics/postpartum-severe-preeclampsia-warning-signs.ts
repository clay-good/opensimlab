import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the postpartum-preeclampsia
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PostpartumPreeclampsiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsPostpartumPreeclampsiaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no pressure
 * measured, no patient interviewed or examined, no laboratory acquired or read,
 * no antihypertensive or magnesium chosen — which are constants rather than
 * observations.
 */
export type PostpartumPreeclampsiaProgress = Pick<PostpartumPreeclampsiaSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const POSTPARTUM_PREECLAMPSIA_ACTIONS = [
  'reconcile-obstetrics-postpartum-preeclampsia-clock-symptoms-pressure-organs-newborn-and-whole-person',
  'recognize-obstetrics-persistent-severe-postpartum-hypertension-and-supplied-preeclampsia-pattern-without-waiting-for-proteinuria',
  'activate-obstetrics-postpartum-severe-hypertension-protocol-qualified-obstetric-response-and-patient-centered-support-now',
  'review-obstetrics-postpartum-preeclampsia-supplied-neurologic-pulmonary-hematologic-renal-hepatic-medication-and-competing-cause-boundary',
  'review-obstetrics-postpartum-preeclampsia-fixed-later-pressure-symptom-organ-and-support-report',
  'handoff-obstetrics-postpartum-preeclampsia-recurrent-pressure-seizure-stroke-pulmonary-hellp-renal-newborn-follow-up-and-outcome-risk',
] as const;

export type PostpartumPreeclampsiaAction = (typeof POSTPARTUM_PREECLAMPSIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPostpartumPreeclampsia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'postpartum-severe-preeclampsia-warning-signs'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'postpartum-severe-preeclampsia-warning-signs-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'postpartum-severe-preeclampsia-warning-signs-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POSTPARTUM_PREECLAMPSIA_ACTIONS.join('|');
}
