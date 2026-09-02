import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the amniotic-fluid-embolism
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type AfeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsAfeAssessment']>;

/**
 * The six recorded steps, and only those — in the order the engine enforces,
 * which puts the response before the understanding.
 *
 * The rest of the snapshot lists what this lesson does not do — no pulse
 * assessed, no loss measured, no laboratory acquired or read, no oxygen,
 * vasoactive, component, CPR or delivery selected — which are constants rather
 * than observations.
 */
export type AfeProgress = Pick<AfeSnapshot,
  'supportAtTick' | 'trajectoryAtTick' | 'recognitionAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const AFE_ACTIONS = [
  'activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response',
  'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person',
  'recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure',
  'review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary',
  'review-obstetrics-afe-fixed-later-breathing-circulation-bleeding-coagulation-and-support-report',
  'handoff-obstetrics-afe-hypoxemia-shock-coagulopathy-bleeding-arrest-procedure-newborn-family-support-and-outcome-risk',
] as const;

export type AfeAction = (typeof AFE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsAfe(scenario: Scenario): boolean {
  return scenario.metadata.id === 'suspected-amniotic-fluid-embolism-pattern'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'suspected-amniotic-fluid-embolism-pattern-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'suspected-amniotic-fluid-embolism-pattern-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === AFE_ACTIONS.join('|');
}
