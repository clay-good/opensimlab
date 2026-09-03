import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the auto-PEEP lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type AutoPeepSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['autoPeepAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares, and the first of its ventilation lessons to
 * carry a tutor.
 *
 * The chain separates three things a learner tends to collapse into one: what
 * the waveform shows, what the expiratory hold measures, and what either of
 * those means. Seeing flow that has not reached zero is not the same as knowing
 * the intrinsic PEEP is 11, and neither is the same as having established
 * dynamic hyperinflation as the reason her blood pressure is 62.
 */
export type AutoPeepProgress = Pick<AutoPeepSnapshot,
  'flowAtTick' | 'measurementAtTick' | 'classificationAtTick'
  | 'correctionAtTick' | 'reassessmentAtTick'>;

export const AUTO_PEEP_ACTIONS = [
  'review-auto-peep-patient-and-flow',
  'measure-auto-peep',
  'classify-auto-peep-pattern',
  'record-auto-peep-correction-intent',
  'reassess-auto-peep-response',
] as const;

export type AutoPeepAction = (typeof AUTO_PEEP_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsAutoPeep(scenario: Scenario): boolean {
  return scenario.metadata.id === 'auto-peep'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'auto-peep').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'auto-peep-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === AUTO_PEEP_ACTIONS.join('|');
}
