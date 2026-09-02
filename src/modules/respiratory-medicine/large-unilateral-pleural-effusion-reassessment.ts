import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the large-effusion lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps. Unlike the first six Respiratory Medicine
 * lessons this one declares six objectives rather than five, so the shared
 * objectives cap stays outstanding.
 */
export type LargePleuralEffusionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['largePleuralEffusionAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no imaging or ultrasound acquired, no fluid sampled or
 * interpreted, no thoracentesis performed, no drainage volume selected —
 * which are constants rather than observations.
 */
export type LargePleuralEffusionProgress = Pick<LargePleuralEffusionSnapshot,
  'trajectoryAtTick' | 'intentAtTick' | 'responseAtTick'
  | 'fluidAtTick' | 'evaluationAtTick' | 'handoffAtTick'>;

export const LARGE_PLEURAL_EFFUSION_ACTIONS = [
  'reconcile-large-unilateral-pleural-effusion-trajectory',
  'record-large-unilateral-pleural-effusion-pleural-team-and-drainage-intent',
  'review-large-unilateral-pleural-effusion-drainage-response',
  'review-large-unilateral-pleural-effusion-fluid-pattern-and-causes',
  'coordinate-large-unilateral-pleural-effusion-definitive-evaluation',
  'handoff-large-unilateral-pleural-effusion-reassessment',
] as const;

export type LargePleuralEffusionAction = (typeof LARGE_PLEURAL_EFFUSION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Four narratives carry this lesson rather than the three used elsewhere in
 * the module, which is required by name rather than tolerated.
 */
export function supportsLargePleuralEffusion(scenario: Scenario): boolean {
  return scenario.metadata.id === 'large-unilateral-pleural-effusion-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'large-unilateral-pleural-effusion-reassessment').length === 4
    && scenario.timeline.filter((event) => event.target === 'large-unilateral-pleural-effusion-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === LARGE_PLEURAL_EFFUSION_ACTIONS.join('|');
}
