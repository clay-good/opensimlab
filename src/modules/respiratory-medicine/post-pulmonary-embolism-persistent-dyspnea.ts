import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the post-PE dyspnea lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PostPeDyspneaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['postPeDyspneaAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no
 * anticoagulation delivered, no test acquired, no CTEPD diagnosed, no
 * treatment selected or procedure performed — which are constants rather than
 * observations.
 */
export type PostPeDyspneaProgress = Pick<PostPeDyspneaSnapshot,
  'trajectoryAtTick' | 'safetyAtTick' | 'evidenceAtTick'
  | 'referralAtTick' | 'handoffAtTick'>;

export const POST_PE_DYSPNEA_ACTIONS = [
  'reconcile-post-pe-symptoms-and-anticoagulation-course',
  'review-post-pe-functional-limitation-and-current-safety',
  'review-post-pe-ctepd-evidence-and-alternatives',
  'activate-post-pe-pulmonary-vascular-referral',
  'handoff-post-pe-persistent-dyspnea-reassessment',
] as const;

export type PostPeDyspneaAction = (typeof POST_PE_DYSPNEA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPostPeDyspnea(scenario: Scenario): boolean {
  return scenario.metadata.id === 'post-pulmonary-embolism-persistent-dyspnea'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'post-pulmonary-embolism-persistent-dyspnea-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POST_PE_DYSPNEA_ACTIONS.join('|');
}
