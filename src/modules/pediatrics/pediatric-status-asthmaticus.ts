import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the status-asthmaticus lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type PediatricStatusAsthmaticusSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricStatusAsthmaticusAssessment']>;

/**
 * The six recorded steps, plus the last unsupported choice.
 *
 * This engine case clears `lastUnsupportedChoice` at exactly two of its six
 * correct steps — recognizing nonresponse, and recording the second-line
 * intent — each of which follows a refusal. The handoff does not clear it, so
 * a run that reached for discharge and then handed off correctly still
 * carries `saturation-discharge` at the end. The tutor is unaffected because
 * it goes silent once the handoff is recorded, but a reader of this state
 * should not assume the value is cleared by any correct step.
 */
export type PediatricStatusAsthmaticusProgress = Pick<PediatricStatusAsthmaticusSnapshot,
  'trajectoryAtTick' | 'nonresponseAtTick' | 'escalationAtTick'
  | 'secondLineIntentAtTick' | 'laterResponseAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const PEDIATRIC_STATUS_ASTHMATICUS_ACTIONS = [
  'reconcile-pediatric-status-asthmaticus-treatment-and-trajectory',
  'recognize-pediatric-status-asthmaticus-severe-nonresponse',
  'activate-pediatric-status-asthmaticus-critical-care-escalation',
  'record-pediatric-status-asthmaticus-qualified-second-line-care-intent',
  'review-pediatric-status-asthmaticus-later-response',
  'handoff-pediatric-status-asthmaticus-reassessment',
] as const;

/**
 * The four choices this lesson offers and refuses, at three separate moments.
 *
 * None of them is over-treatment — they all spend time. A measurement she
 * cannot perform, a film that answers a question nobody is asking, a trigger
 * conversation that is owed to her but not in this hour, and a discharge read
 * off a saturation she is holding on oxygen.
 */
export const PEDIATRIC_STATUS_ASTHMATICUS_UNSUPPORTED_ACTIONS = [
  'force-pediatric-status-asthmaticus-peak-flow',
  'wait-for-pediatric-status-asthmaticus-routine-radiograph',
  'delay-pediatric-status-asthmaticus-escalation-for-trigger-review',
  'discharge-pediatric-status-asthmaticus-from-saturation-alone',
] as const;

export type PediatricStatusAsthmaticusAction =
  (typeof PEDIATRIC_STATUS_ASTHMATICUS_ACTIONS)[number]
  | (typeof PEDIATRIC_STATUS_ASTHMATICUS_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * This lesson carries three narratives on its main target rather than the
 * two most of the module uses, so the count is asserted rather than assumed.
 */
export function supportsPediatricStatusAsthmaticus(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-status-asthmaticus'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-status-asthmaticus-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'pediatric-status-asthmaticus-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_STATUS_ASTHMATICUS_ACTIONS.join('|');
}
