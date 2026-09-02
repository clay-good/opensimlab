import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the eclampsia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type EclampsiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsEclampsiaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no seizure
 * timed or protected, nobody positioned or examined, no magnesium or
 * antihypertensive chosen, no birth selected — which are constants rather than
 * observations.
 */
export type EclampsiaProgress = Pick<EclampsiaSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const ECLAMPSIA_ACTIONS = [
  'reconcile-obstetrics-eclampsia-seizure-clock-recovery-pressure-organs-fetal-context-and-whole-person',
  'recognize-obstetrics-supplied-eclampsia-pattern-after-first-seizure-with-dangerous-alternatives-open',
  'activate-obstetrics-eclampsia-maternal-stabilization-seizure-severe-pressure-airway-obstetric-fetal-and-dignity-response-now',
  'review-obstetrics-eclampsia-supplied-neurologic-airway-aspiration-organ-fetal-metabolic-toxic-infectious-and-trauma-boundary',
  'review-obstetrics-eclampsia-fixed-later-recovery-pressure-breathing-fetal-and-organ-report',
  'handoff-obstetrics-eclampsia-recurrence-airway-aspiration-stroke-pressure-organ-fetal-delivery-and-outcome-risk',
] as const;

export type EclampsiaAction = (typeof ECLAMPSIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsEclampsia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'eclampsia-first-seizure-response'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'eclampsia-first-seizure-response-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'eclampsia-first-seizure-response-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ECLAMPSIA_ACTIONS.join('|');
}
