import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pulse-oximeter artifact lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. The engine case and assessment are named for
 * the response (`pulse-oximeter-artifact`) rather than for the scenario id.
 */
export type PulseOximeterArtifactSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pulseOximeterArtifactAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The corroboration step is the one that carries the lesson. Everything before
 * it builds a good case that the signal is bad, and a good case is not the same
 * as an independent measurement; the engine will not accept the clean-site
 * reading until oxygenation has been confirmed some other way.
 */
export type PulseOximeterArtifactProgress = Pick<PulseOximeterArtifactSnapshot,
  'discordanceAtTick' | 'plethAtTick' | 'probePerfusionAtTick'
  | 'corroboratedAtTick' | 'reassessedAtTick'>;

export const PULSE_OXIMETER_ARTIFACT_ACTIONS = [
  'recognize-pulse-oximeter-discordance',
  'inspect-pleth-and-pulse-rate-coherence',
  'review-probe-motion-and-perfusion',
  'corroborate-oxygenation-independently',
  'reassess-pulse-oximeter-signal',
] as const;

export type PulseOximeterArtifactAction = (typeof PULSE_OXIMETER_ARTIFACT_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * This is the only lab in the module whose timeline is three events rather than
 * two: an `artifact` event begins the motion, and the two narratives follow.
 */
export function supportsPulseOximeterArtifact(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pulse-oximeter-motion-artifact'
    && scenario.timeline.filter((event) => event.type === 'artifact'
      && event.target === 'pulse-oximeter-motion').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pulse-oximeter-motion-artifact').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pulse-oximeter-motion-artifact-boundary').length === 1
    && scenario.timeline.length === 3
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PULSE_OXIMETER_ARTIFACT_ACTIONS.join('|');
}
