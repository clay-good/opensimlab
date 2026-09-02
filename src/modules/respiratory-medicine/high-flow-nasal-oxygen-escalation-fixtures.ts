import type { HighFlowOxygenEscalationAction } from './high-flow-nasal-oxygen-escalation';

/**
 * Reference transcripts for the high-flow escalation lesson.
 *
 * As in the support-selection lesson, the authored error is a clinical choice
 * rather than an ordering mistake — but this lesson asks twice. The first
 * tempting wrong answer is the one that feels like patience: staying on a
 * reservoir mask already documented as functioning and already documented as
 * inadequate. The second pair is harder, because by then he looks better,
 * and calling the failure resolved or standing the monitoring down are the
 * two ways a working trial turns into a delayed intubation. The recovery
 * path walks into all four and still reaches a correct handoff.
 */
export const HIGH_FLOW_OXYGEN_FIXTURES = {
  scenarioId: 'high-flow-nasal-oxygen-escalation', contentVersion: '0.1.0', seed: 2471,
  noAction: [],
  expert: [
    [0, 'reconcile-high-flow-oxygen-conventional-support-trajectory'],
    [1, 'review-high-flow-oxygen-suitability-and-rescue-readiness'],
    [2, 'select-high-flow-nasal-oxygen-escalation'],
    [3, 'review-high-flow-oxygen-early-response'],
    [4, 'preserve-high-flow-oxygen-monitoring-and-failure-guards'],
    [5, 'handoff-high-flow-oxygen-escalation'],
  ],
  commonError: [
    [0, 'reconcile-high-flow-oxygen-conventional-support-trajectory'],
    [1, 'review-high-flow-oxygen-suitability-and-rescue-readiness'],
    [2, 'continue-conventional-oxygen'],
  ],
  recovery: [
    [0, 'reconcile-high-flow-oxygen-conventional-support-trajectory'],
    [1, 'review-high-flow-oxygen-suitability-and-rescue-readiness'],
    [2, 'continue-conventional-oxygen'],
    [3, 'select-bilevel-niv-first'],
    [4, 'select-high-flow-nasal-oxygen-escalation'],
    [5, 'review-high-flow-oxygen-early-response'],
    // The second decision point, where he now looks better and both wrong
    // answers are more tempting than they were at the first.
    [6, 'mark-high-flow-respiratory-failure-resolved'],
    [7, 'reduce-high-flow-monitoring'],
    [8, 'preserve-high-flow-oxygen-monitoring-and-failure-guards'],
    [9, 'handoff-high-flow-oxygen-escalation'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HighFlowOxygenEscalationAction])[];
  expert: readonly (readonly [number, HighFlowOxygenEscalationAction])[];
  commonError: readonly (readonly [number, HighFlowOxygenEscalationAction])[];
  recovery: readonly (readonly [number, HighFlowOxygenEscalationAction])[];
};
