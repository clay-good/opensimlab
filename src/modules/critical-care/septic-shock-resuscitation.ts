import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the persistent septic-shock lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. This is the first critical-care lesson to be
 * given that pair.
 */
export type SepticShockResuscitationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['septicShockResuscitationAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain
 * with no unordered lane and no time gate.
 *
 * The chain is the argument. Every step exists to stop the next one being taken
 * on a number: the prior claims are separated from the present response before
 * the perfusion is read, the perfusion is read before fluid responsiveness is
 * tested, and the dynamic test lands before any plan is recorded. A learner who
 * reaches for another bolus finds the engine has put two steps in the way.
 *
 * The snapshot carries the finding the lesson turns on —
 * `passiveLegRaiseStrokeVolumeChangePercent`, a fixed 2 — and
 * `blindRepeatFluidOffered` stays `false`.
 */
export type SepticShockResuscitationProgress = Pick<SepticShockResuscitationSnapshot,
  'contextAtTick' | 'perfusionAtTick' | 'fluidResponseAtTick'
  | 'planAtTick' | 'reassessedAtTick'>;

export const SEPTIC_SHOCK_RESUSCITATION_ACTIONS = [
  'reconcile-septic-shock-resuscitation-so-far',
  'reassess-septic-shock-perfusion',
  'test-septic-shock-fluid-responsiveness',
  'individualize-septic-shock-support-and-source-control',
  'reassess-septic-shock-trajectory',
] as const;

export type SepticShockResuscitationAction = (typeof SEPTIC_SHOCK_RESUSCITATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. This lesson declares only two narratives and no state event.
 */
export function supportsSepticShockResuscitation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'septic-shock-resuscitation'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'septic-shock-resuscitation').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'septic-shock-resuscitation-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === SEPTIC_SHOCK_RESUSCITATION_ACTIONS.join('|');
}
