import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the hyperkalemic-conduction lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type HyperkalemicConductionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['hyperkalemicConductionAssessment']>;

/**
 * Six recorded steps against six declared objectives, an unordered triple, and
 * two time gates.
 *
 * This is the only lesson in the cardiology module with three parallel review
 * lanes rather than two. After the trajectory is reconciled, the calcium
 * response, the shifting surveillance and the removal-and-device-restraint
 * work are all available at once and in any order; the later panel refuses
 * until all three have landed and a tick has passed, and the handoff refuses
 * until a tick has passed after that.
 *
 * Six objectives exceed the shared observable-objectives cap of five, so this
 * lesson leaves three requirements outstanding rather than two.
 *
 * `initialPulsePresent` is a fixed `true`; `treatmentDeliveredByLearner`,
 * `pacingDelivered`, `captureAssessed` and `permanentDeviceSelected` all stay
 * `false` — every treatment in this lesson was reported by somebody else.
 */
export type HyperkalemicConductionProgress = Pick<HyperkalemicConductionSnapshot,
  'reconciledAtTick' | 'calciumResponseAtTick' | 'shiftSurveillanceAtTick'
  | 'removalDeviceAtTick' | 'laterPanelAtTick' | 'handoffAtTick'>;

export const HYPERKALEMIC_CONDUCTION_ACTIONS = [
  'reconcile-hyperkalemic-conduction-trajectory',
  'review-hyperkalemic-conduction-calcium-response',
  'review-hyperkalemic-conduction-shift-surveillance',
  'review-hyperkalemic-conduction-removal-and-device-restraint',
  'review-hyperkalemic-conduction-later-panel',
  'handoff-hyperkalemic-conduction-reassessment',
] as const;

export type HyperkalemicConductionAction = (typeof HYPERKALEMIC_CONDUCTION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsHyperkalemicConduction(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hyperkalemic-conduction-disturbance'
    && scenario.timeline.filter((event) => event.type === 'rhythm-change'
      && event.target === 'hyperkalemic-conduction').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hyperkalemic-conduction-disturbance').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hyperkalemic-conduction-disturbance-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HYPERKALEMIC_CONDUCTION_ACTIONS.join('|');
}
