import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the cord-prolapse lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type CordProlapseSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['obstetricsCordProlapseAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no cord handled or replaced, no presenting part elevated, no
 * bladder filled, no birth mode selected — which are constants rather than
 * observations.
 */
export type CordProlapseProgress = Pick<CordProlapseSnapshot,
  'supportAtTick' | 'contextAtTick' | 'bridgeAtTick'
  | 'birthPlanAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const CORD_PROLAPSE_ACTIONS = [
  'activate-obstetrics-cord-prolapse-response-diagnosis-clock-theatre-anesthesia-newborn-and-support-roles',
  'reconcile-obstetrics-cord-prolapse-membrane-rupture-fetal-heart-exam-birth-imminence-and-whole-person',
  'review-obstetrics-cord-prolapse-pressure-relief-minimal-handling-position-and-no-delay-boundaries',
  'review-obstetrics-cord-prolapse-birth-urgency-mode-anesthesia-newborn-documentation-and-safety-boundaries',
  'review-obstetrics-cord-prolapse-fixed-persistent-fetal-compromise-and-theatre-transfer-report',
  'handoff-obstetrics-cord-prolapse-fetal-maternal-theatre-newborn-support-documentation-and-outcome-risk',
] as const;

export type CordProlapseAction = (typeof CORD_PROLAPSE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsCordProlapse(scenario: Scenario): boolean {
  return scenario.metadata.id === 'umbilical-cord-prolapse-urgent-birth-coordination'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'umbilical-cord-prolapse-urgent-birth-coordination-transition').length === 1
    && scenario.timeline.filter((event) => event.target === 'umbilical-cord-prolapse-urgent-birth-coordination-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CORD_PROLAPSE_ACTIONS.join('|');
}
