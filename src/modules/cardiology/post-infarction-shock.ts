import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the post-infarction shock lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PostInfarctionShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['postInfarctionShockAssessment']>;

/**
 * The five recorded steps.
 *
 * Reopening the causes and contacting the shock centre are unordered against
 * each other, and the transport bridge refuses until both are recorded. One
 * time gate then sits before the handoff.
 *
 * `pressureAloneUsed` is a fixed `false` and it is the whole lesson: her MAP
 * went from 57 to 64 and nothing else improved. `routineDeviceSelected` and
 * `treatmentDelivered` stay `false` too — no device is chosen here, which
 * matters in a subject where the temptation to reach for one is strong.
 */
export type PostInfarctionShockProgress = Pick<PostInfarctionShockSnapshot,
  'trajectoryAtTick' | 'causesAtTick' | 'transferAtTick'
  | 'bridgeAtTick' | 'handoffAtTick'>;

export const POST_INFARCTION_SHOCK_ACTIONS = [
  'reconcile-post-infarction-shock-trajectory',
  'reopen-post-infarction-shock-causes',
  'contact-post-infarction-shock-center',
  'record-post-infarction-shock-bridge',
  'handoff-post-infarction-shock-trajectory',
] as const;

export type PostInfarctionShockAction = (typeof POST_INFARCTION_SHOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Note the second timeline target is `post-infarction-shock-boundary`
 * rather than the scenario id plus `-boundary`, unlike its siblings.
 */
export function supportsPostInfarctionShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'post-infarction-cardiogenic-shock-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'post-infarction-cardiogenic-shock-escalation').length === 1
    && scenario.timeline.filter((event) => event.target === 'post-infarction-shock-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === POST_INFARCTION_SHOCK_ACTIONS.join('|');
}
