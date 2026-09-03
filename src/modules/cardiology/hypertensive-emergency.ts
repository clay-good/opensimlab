import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the hypertensive-emergency lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type HypertensiveEmergencySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['hypertensiveEmergencyAssessment']>;

/**
 * Six recorded steps against six declared objectives, an unordered pair, and
 * two time gates.
 *
 * The opening is a strict chain of two, and the order carries the argument:
 * the measurement must be verified before the organ injury is reviewed,
 * because a number taken badly is the commonest reason a patient is treated
 * for an emergency they do not have. Afterwards the phenotype-and-causes
 * review and the controlled-reduction intent are an unordered pair — they are
 * simultaneous in a real unit — and the later panel refuses until both have
 * landed and a tick has passed, with the handoff a tick after that.
 *
 * Six objectives exceed the shared observable-objectives cap of five, so this
 * lesson leaves three requirements outstanding rather than two.
 *
 * `initialPulsePresent` and `acuteTargetOrganDamage` are both a fixed `true`
 * — this patient really does have an emergency — while nine restraint flags,
 * including `drugSelected`, `universalTargetSelected` and
 * `rapidNormalizationSelected`, all stay `false`.
 */
export type HypertensiveEmergencyProgress = Pick<HypertensiveEmergencySnapshot,
  'measurementAtTick' | 'organInjuryAtTick' | 'phenotypeAtTick'
  | 'reductionIntentAtTick' | 'laterPanelAtTick' | 'handoffAtTick'>;

export const HYPERTENSIVE_EMERGENCY_ACTIONS = [
  'reconcile-hypertensive-emergency-measurement-and-trajectory',
  'review-hypertensive-emergency-organ-injury',
  'review-hypertensive-emergency-phenotype-and-causes',
  'record-hypertensive-emergency-controlled-reduction-intent',
  'review-hypertensive-emergency-later-panel',
  'handoff-hypertensive-emergency-reassessment',
] as const;

export type HypertensiveEmergencyAction = (typeof HYPERTENSIVE_EMERGENCY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. This lesson carries four narratives rather than three: three share
 * the reassessment target and one is the boundary.
 */
export function supportsHypertensiveEmergency(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hypertensive-emergency'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hypertensive-emergency-reassessment').length === 3
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hypertensive-emergency-reassessment-boundary').length === 1
    && scenario.timeline.length === 4
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HYPERTENSIVE_EMERGENCY_ACTIONS.join('|');
}
