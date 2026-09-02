import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the NSTEMI risk-reassessment lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type NstemiRiskSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['nstemiRiskAssessment']>;

/**
 * The five recorded steps, in a strict line with no time gate.
 *
 * One trap here that the pediatrics lessons never had: the action ids and the
 * declared objective ids are not the same list. The fourth objective is
 * `classify-nstemi-invasive-strategy` while the action the engine accepts is
 * `record-nstemi-invasive-strategy`. The identity guard below therefore
 * compares against the objective ids explicitly rather than reusing the action
 * list, which is what every other lesson in this repository does.
 *
 * `ischemicRisk` is a fixed 'high' and `currentVeryHighRisk` a fixed `false` —
 * high risk without a current very-high-risk feature is the whole
 * classification, and `exactScoreCalculated` and `procedurePerformed` stay
 * `false`.
 */
export type NstemiRiskProgress = Pick<NstemiRiskSnapshot,
  'trajectoryAtTick' | 'verificationAtTick' | 'veryHighRiskAtTick'
  | 'strategyAtTick' | 'handoffAtTick'>;

export const NSTEMI_RISK_ACTIONS = [
  'reconcile-nstemi-serial-trajectory',
  'verify-nstemi-and-alternatives',
  'screen-nstemi-very-high-risk-features',
  'record-nstemi-invasive-strategy',
  'record-nstemi-monitoring-and-handoff',
] as const;

export type NstemiRiskAction = (typeof NSTEMI_RISK_ACTIONS)[number];

/** The declared objective ids, which deliberately differ from the actions. */
export const NSTEMI_RISK_OBJECTIVES = [
  'reconcile-nstemi-serial-trajectory',
  'verify-nstemi-and-alternatives',
  'screen-nstemi-very-high-risk-features',
  'classify-nstemi-invasive-strategy',
  'record-nstemi-monitoring-and-handoff',
] as const;

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsNstemiRisk(scenario: Scenario): boolean {
  return scenario.metadata.id === 'nstemi-risk-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'nstemi-risk-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'nstemi-risk-reassessment-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NSTEMI_RISK_OBJECTIVES.join('|');
}
