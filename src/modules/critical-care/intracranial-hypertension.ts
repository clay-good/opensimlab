import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the intracranial-hypertension lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type IntracranialHypertensionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['intracranialHypertensionAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The protection step is the one that carries the lesson. Hyperosmolar therapy
 * is what an ICP of 28 makes everyone reach for, and the engine puts the free
 * things first: a head turned 10° off neutral is an obstructed jugular, and no
 * amount of osmotherapy fixes a mechanical drainage problem.
 */
export type IntracranialHypertensionProgress = Pick<IntracranialHypertensionSnapshot,
  'recognitionAtTick' | 'contextAtTick' | 'protectionAtTick'
  | 'rescueAtTick' | 'reassessmentAtTick'>;

export const INTRACRANIAL_HYPERTENSION_ACTIONS = [
  'recognize-intracranial-hypertension',
  'review-intracranial-hypertension-context',
  'activate-first-tier-brain-protection',
  'activate-individualized-hyperosmolar-rescue',
  'reassess-intracranial-hypertension-trajectory',
] as const;

export type IntracranialHypertensionAction = (typeof INTRACRANIAL_HYPERTENSION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsIntracranialHypertension(scenario: Scenario): boolean {
  return scenario.metadata.id === 'intracranial-hypertension'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'intracranial-hypertension').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'intracranial-hypertension-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === INTRACRANIAL_HYPERTENSION_ACTIONS.join('|');
}
