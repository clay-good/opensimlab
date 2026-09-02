import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the pulmonary-edema support
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type ApeSupportSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['apeSupportAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no oxygen
 * delivered, no noninvasive support started or setting selected, no medication
 * delivered, no airway procedure performed — which are constants rather than
 * observations.
 */
export type ApeSupportProgress = Pick<ApeSupportSnapshot,
  'trajectoryAtTick' | 'failureAtTick' | 'wholePatientAtTick'
  | 'escalationAtTick' | 'handoffAtTick'>;

export const APE_SUPPORT_ACTIONS = [
  'reconcile-ape-initial-care-and-trajectory',
  'review-ape-progressive-respiratory-failure',
  'review-ape-pressure-perfusion-congestion-and-causes',
  'activate-ape-airway-capable-escalation',
  'handoff-ape-respiratory-support-reassessment',
] as const;

export type ApeSupportAction = (typeof APE_SUPPORT_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsApeSupport(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-pulmonary-edema-respiratory-support-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acute-pulmonary-edema-respiratory-support-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'acute-pulmonary-edema-respiratory-support-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === APE_SUPPORT_ACTIONS.join('|');
}
