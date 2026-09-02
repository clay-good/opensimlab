import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the maternal-cardiac-arrest
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MaternalArrestSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMaternalArrestAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * There is no recognition step here, because the arrest is already
 * established and someone is already compressing. The rest of the snapshot
 * lists what this lesson does not do — no pulse checked, no compressions or
 * uterine displacement performed, no rhythm read, no drug, shock or delivery
 * selected — which are constants rather than observations.
 */
export type MaternalArrestProgress = Pick<MaternalArrestSnapshot,
  'supportAtTick' | 'contextAtTick' | 'modificationsAtTick'
  | 'readinessAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const MATERNAL_ARREST_ACTIONS = [
  'activate-obstetrics-maternal-arrest-prepared-resuscitation-obstetric-anesthesia-delivery-newborn-and-dignity-response-now',
  'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person',
  'review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary',
  'review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary',
  'review-obstetrics-maternal-arrest-fixed-minute-four-active-resuscitation-and-delivery-readiness-report',
  'handoff-obstetrics-maternal-arrest-active-arrest-cause-procedure-hemorrhage-newborn-family-and-outcome-risk',
] as const;

export type MaternalArrestAction = (typeof MATERNAL_ARREST_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMaternalArrest(scenario: Scenario): boolean {
  return scenario.metadata.id === 'maternal-cardiac-arrest-coordinated-response'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'maternal-cardiac-arrest-coordinated-response-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'maternal-cardiac-arrest-coordinated-response-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MATERNAL_ARREST_ACTIONS.join('|');
}
