import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the high-flow escalation lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type HighFlowOxygenEscalationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['highFlowOxygenEscalationAssessment']>;

/**
 * The six recorded steps, plus the last unsupported support goal.
 *
 * `lastUnsupportedChoice` is not a step — it is how the engine reports that
 * unchanged conventional oxygen or a bilevel-first trial was just offered and
 * refused, with the patient unchanged.
 */
export type HighFlowOxygenEscalationProgress = Pick<HighFlowOxygenEscalationSnapshot,
  'trajectoryAtTick' | 'suitabilityAtTick' | 'selectionAtTick'
  | 'responseAtTick' | 'guardsAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const HIGH_FLOW_OXYGEN_ACTIONS = [
  'reconcile-high-flow-oxygen-conventional-support-trajectory',
  'review-high-flow-oxygen-suitability-and-rescue-readiness',
  'select-high-flow-nasal-oxygen-escalation',
  'review-high-flow-oxygen-early-response',
  'preserve-high-flow-oxygen-monitoring-and-failure-guards',
  'handoff-high-flow-oxygen-escalation',
] as const;

/**
 * The four choices this lesson offers and refuses, at two separate moments.
 *
 * None of them is absurd, which is the point. Staying on conventional oxygen
 * is the one that feels like waiting; a bilevel-first trial is defensible in
 * selected acute hypoxemic failure and simply is not this case's pathway.
 * The second pair is more tempting still, because by then the patient looks
 * better: calling the failure resolved, and standing the monitoring down.
 */
export const HIGH_FLOW_OXYGEN_UNSUPPORTED_ACTIONS = [
  'continue-conventional-oxygen',
  'select-bilevel-niv-first',
  'mark-high-flow-respiratory-failure-resolved',
  'reduce-high-flow-monitoring',
] as const;

export type HighFlowOxygenEscalationAction =
  (typeof HIGH_FLOW_OXYGEN_ACTIONS)[number] | (typeof HIGH_FLOW_OXYGEN_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsHighFlowOxygenEscalation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'high-flow-nasal-oxygen-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'high-flow-nasal-oxygen-escalation').length === 3
    && scenario.timeline.filter((event) => event.target === 'high-flow-nasal-oxygen-escalation-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HIGH_FLOW_OXYGEN_ACTIONS.join('|');
}
