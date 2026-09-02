import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the mucus-plugging lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. Six objectives rather than five, so the shared
 * objectives cap stays outstanding here.
 */
export type BronchiectasisMucusPluggingSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['bronchiectasisMucusPluggingAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no sputum assessed, no airway clearance or suction performed, no
 * bronchoscopy, no device or technique selected — which are constants rather
 * than observations.
 */
export type BronchiectasisMucusPluggingProgress = Pick<BronchiectasisMucusPluggingSnapshot,
  'trajectoryAtTick' | 'evidenceAtTick' | 'clearanceIntentAtTick'
  | 'responseAtTick' | 'escalationAtTick' | 'handoffAtTick'>;

export const BRONCHIECTASIS_MUCUS_PLUGGING_ACTIONS = [
  'reconcile-bronchiectasis-mucus-plugging-trajectory',
  'review-bronchiectasis-mucus-plugging-evidence-and-alternatives',
  'record-bronchiectasis-mucus-plugging-supported-airway-clearance-intent',
  'review-bronchiectasis-mucus-plugging-later-response',
  'escalate-bronchiectasis-mucus-plugging-persistent-collapse',
  'handoff-bronchiectasis-mucus-plugging-reassessment',
] as const;

export type BronchiectasisMucusPluggingAction = (typeof BRONCHIECTASIS_MUCUS_PLUGGING_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsBronchiectasisMucusPlugging(scenario: Scenario): boolean {
  return scenario.metadata.id === 'bronchiectasis-mucus-plugging-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'bronchiectasis-mucus-plugging-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'bronchiectasis-mucus-plugging-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === BRONCHIECTASIS_MUCUS_PLUGGING_ACTIONS.join('|');
}
