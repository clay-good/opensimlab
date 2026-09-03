import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the ARDS lung-protective lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. The engine case and assessment are named for
 * the response (`ards-lung-protective`) rather than for the scenario id.
 */
export type ArdsLungProtectiveSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['ardsLungProtectiveAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The predicted-body-weight step is the one that carries the lesson. She weighs
 * 92 kg and 500 mL looks modest against that; against the 61.5 kg her height
 * predicts it is 8.1 mL/kg, and the engine refuses to record any tidal-volume
 * intent until that basis exists.
 */
export type ArdsLungProtectiveProgress = Pick<ArdsLungProtectiveSnapshot,
  'baselineAtTick' | 'pbwAtTick' | 'protectionAtTick'
  | 'reassessmentAtTick' | 'escalationAtTick'>;

/**
 * The five control ids the engine accepts.
 *
 * They are NOT the same strings as the declared objectives — this is the second
 * lesson in the module where the two vocabularies diverge, so the identity
 * guard compares ARDS_LUNG_PROTECTIVE_OBJECTIVES rather than these. Comparing
 * the wrong array would let the guard pass on a scenario the engine cannot run.
 */
export const ARDS_LUNG_PROTECTIVE_ACTIONS = [
  'review-ards-baseline',
  'calculate-ards-pbw',
  'record-ards-protective-settings',
  'reassess-ards-protection',
  'record-ards-peep-prone-escalation',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const ARDS_LUNG_PROTECTIVE_OBJECTIVES = [
  'review-ards-ventilation-baseline',
  'calculate-ards-predicted-body-weight',
  'record-ards-lung-protective-settings',
  'reassess-ards-gas-and-mechanics',
  'escalate-moderate-severe-ards-support',
] as const;

export type ArdsLungProtectiveAction = (typeof ARDS_LUNG_PROTECTIVE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsArdsLungProtective(scenario: Scenario): boolean {
  return scenario.metadata.id === 'ards-lung-protective-ventilation'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'ards-lung-protective-ventilation').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'ards-lung-protective-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ARDS_LUNG_PROTECTIVE_OBJECTIVES.join('|');
}
