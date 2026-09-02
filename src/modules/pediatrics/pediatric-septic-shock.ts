import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric septic-shock lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricSepticShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricSepticShockAssessment']>;

/**
 * The six recorded steps.
 *
 * Like pediatric sepsis and unlike the rest of the module, this engine case
 * authors no refusable choice, so there is no `lastUnsupportedChoice` to read.
 * Its distinctive shape is elsewhere: two of the six steps are unordered
 * against each other. Rescue and source control may be recorded in either
 * order, and the later report refuses until both are active and simulated
 * time has passed since whichever landed second. Anything reading this state
 * has to handle a run in which either one is present alone.
 */
export type PediatricSepticShockProgress = Pick<PediatricSepticShockSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'rescueAtTick'
  | 'sourceAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_SEPTIC_SHOCK_ACTIONS = [
  'reconcile-pediatric-septic-shock-care-and-trajectory',
  'recognize-pediatric-septic-shock-after-fluid-reassessment',
  'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership',
  'escalate-pediatric-septic-shock-source-control',
  'review-pediatric-septic-shock-later-response',
  'handoff-pediatric-septic-shock-active-risk',
] as const;

export type PediatricSepticShockAction = (typeof PEDIATRIC_SEPTIC_SHOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives on the main target, the third of which is the supplied
 * Phoenix classification, so the count is asserted rather than assumed.
 */
export function supportsPediatricSepticShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-septic-shock'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-septic-shock-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'pediatric-septic-shock-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_SEPTIC_SHOCK_ACTIONS.join('|');
}
