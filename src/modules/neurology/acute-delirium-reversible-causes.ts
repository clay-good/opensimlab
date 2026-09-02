import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the delirium lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type DeliriumSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyDeliriumAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no score
 * calculated, no capacity assessed, no restraint or observation level selected,
 * and in particular no single cause proven — which are constants rather than
 * observations.
 */
export type DeliriumProgress = Pick<DeliriumSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'ownershipAtTick'
  | 'boundaryAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const DELIRIUM_ACTIONS = [
  'reconcile-neurology-delirium-baseline-clock-fluctuation-attention-perception-function-and-whole-patient',
  'recognize-neurology-delirium-indicators-and-qualified-assessment-boundary-without-dementia-or-single-cause-closure',
  'activate-neurology-delirium-qualified-medical-nursing-pharmacy-family-safety-capacity-and-mobility-ownership',
  'review-neurology-delirium-reversible-contributors-communication-environment-deescalation-and-treatment-boundary',
  'review-neurology-delirium-strict-later-contributor-and-unresolved-cognitive-trajectory',
  'handoff-neurology-delirium-causes-capacity-safety-medicines-function-recurrence-follow-up-and-active-risk',
] as const;

export type DeliriumAction = (typeof DELIRIUM_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the assessment boundary and the
 * contributor boundary each need one of their own. That shape is required by
 * name rather than tolerated.
 */
export function supportsDelirium(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-delirium-reversible-causes'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acute-delirium-reversible-causes-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'acute-delirium-reversible-causes-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DELIRIUM_ACTIONS.join('|');
}
