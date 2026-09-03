import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the mixed-shock lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type MixedShockSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['mixedShockAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The lesson closes the shock trio. Septic shock taught a fluid decision,
 * cardiogenic shock taught the opposite one, and this patient has both
 * physiologies at once: an ejection fraction of 25% with a wedge of 24, and a
 * systemic vascular resistance of 720 with a temperature of 39.1. The chain
 * refuses to let either half be settled before the other is seen, and both the
 * support step and the cause step are explicitly plural.
 */
export type MixedShockProgress = Pick<MixedShockSnapshot,
  'recognitionAtTick' | 'hemodynamicsAtTick' | 'supportAtTick'
  | 'causesAtTick' | 'reassessmentAtTick'>;

export const MIXED_SHOCK_ACTIONS = [
  'recognize-mixed-shock-discordance',
  'classify-mixed-shock-hemodynamics',
  'record-mixed-shock-support',
  'address-mixed-shock-causes',
  'reassess-mixed-shock-trajectory',
] as const;

export type MixedShockAction = (typeof MIXED_SHOCK_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsMixedShock(scenario: Scenario): boolean {
  return scenario.metadata.id === 'mixed-shock'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'mixed-shock').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'mixed-shock-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MIXED_SHOCK_ACTIONS.join('|');
}
