import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the maternal-to-neonatal handoff
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MaternalNeonatalHandoffSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsMaternalNeonatalHandoffAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no newborn resuscitation performed, no ventilation delivered, no
 * family counseling given — which are constants rather than observations.
 */
export type MaternalNeonatalHandoffProgress = Pick<MaternalNeonatalHandoffSnapshot,
  'supportAtTick' | 'contextAtTick' | 'safetyAtTick'
  | 'transferAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const MATERNAL_NEONATAL_HANDOFF_ACTIONS = [
  'activate-obstetrics-maternal-neonatal-handoff-two-patient-team-and-support-ownership',
  'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context',
  'review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries',
  'review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness',
  'review-obstetrics-maternal-neonatal-handoff-fixed-five-minute-qualified-course-report',
  'handoff-obstetrics-maternal-neonatal-postresuscitation-monitoring-maternal-family-and-outcome-risk',
] as const;

export type MaternalNeonatalHandoffAction = (typeof MATERNAL_NEONATAL_HANDOFF_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMaternalNeonatalHandoff(scenario: Scenario): boolean {
  return scenario.metadata.id === 'maternal-to-neonatal-resuscitation-handoff'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'maternal-to-neonatal-resuscitation-handoff-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'maternal-to-neonatal-resuscitation-handoff-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MATERNAL_NEONATAL_HANDOFF_ACTIONS.join('|');
}
