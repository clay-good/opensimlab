import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the safeguarding-escalation lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricInjurySafeguardingSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricInjurySafeguardingAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice and its steps are a strict
 * line, with two time gates at the end. What makes it unlike the rest of the
 * module is the size of its refusal surface: this snapshot carries more fixed
 * `false` fields than any other lesson, and they are not all about clinical
 * restraint. `abuseDiagnosedByLearner`, `perpetratorNamedByLearner`,
 * `caregiverCredibilityJudgedByLearner`, `caregiverConfrontedByLearner`,
 * `caregiverSeparatedByLearner`, `reportingThresholdDeterminedByLearner`,
 * `jurisdictionSelectedByLearner`, `referralSubmittedByLearner`,
 * `custodyActionSelectedByLearner` and `childRemovedByLearner` are all fixed
 * false, and so are `identifyingInformationCollected` and
 * `freeTextDisclosureCollected` — this lesson deliberately cannot capture a
 * disclosure or anything identifying about a real child.
 *
 * `medicalAlternativesRemainOpen` is a fixed `true`. It never becomes false,
 * which is the whole discipline: a concern is raised and nothing is concluded.
 */
export type PediatricInjurySafeguardingProgress = Pick<PediatricInjurySafeguardingSnapshot,
  'trajectoryAtTick' | 'concernAtTick' | 'safeguardingAtTick'
  | 'alternativesAtTick' | 'laterSafetyAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_INJURY_SAFEGUARDING_ACTIONS = [
  'reconcile-pediatric-injury-development-history-and-whole-child',
  'recognize-pediatric-injury-safeguarding-concern-without-diagnosis',
  'activate-pediatric-injury-qualified-safeguarding-and-immediate-safety-ownership',
  'review-pediatric-injury-medical-alternatives-and-information-boundary',
  'review-pediatric-injury-later-safety-state',
  'handoff-pediatric-injury-unresolved-safeguarding-risk',
] as const;

export type PediatricInjurySafeguardingAction =
  (typeof PEDIATRIC_INJURY_SAFEGUARDING_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPediatricInjurySafeguarding(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-injury-safeguarding-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-injury-safeguarding-escalation-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'pediatric-injury-safeguarding-escalation-reassessment-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_INJURY_SAFEGUARDING_ACTIONS.join('|');
}
