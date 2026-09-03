import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the ventilator-dyssynchrony lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type DyssynchronySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['ventilatorDyssynchronyAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The driver review sits between the graphics and the classification on
 * purpose. A patient fighting the ventilator is the commonest reason a team
 * reaches for sedation, and the drivers step is where pain, drive, the airway,
 * secretions, the circuit and auto-PEEP get excluded as the reason he is
 * fighting — before anybody decides the interaction itself is the problem.
 */
export type DyssynchronyProgress = Pick<DyssynchronySnapshot,
  'graphicsAtTick' | 'driversAtTick' | 'classificationAtTick'
  | 'correctionAtTick' | 'reassessmentAtTick'>;

export const DYSSYNCHRONY_ACTIONS = [
  'review-dyssynchrony-patient-and-graphics',
  'review-dyssynchrony-drivers',
  'classify-dyssynchrony-pattern',
  'record-dyssynchrony-correction-intent',
  'reassess-dyssynchrony-response',
] as const;

export type DyssynchronyAction = (typeof DYSSYNCHRONY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsDyssynchrony(scenario: Scenario): boolean {
  return scenario.metadata.id === 'ventilator-dyssynchrony'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'ventilator-dyssynchrony').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'ventilator-dyssynchrony-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DYSSYNCHRONY_ACTIONS.join('|');
}
