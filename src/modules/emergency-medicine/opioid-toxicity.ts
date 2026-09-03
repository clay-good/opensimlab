import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency opioid-toxicity lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes.
 */
export type OpioidToxicitySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['opioidToxicityAssessment']>;

/**
 * Six recorded steps against five declared objectives, in one strict chain with
 * no time gates anywhere.
 *
 * Two of the gates carry the lesson. The engine refuses the naloxone intent
 * until ventilation is recorded, because the antagonist is not the airway. And
 * the last two steps exist because the authored twenty-five-minute panel gets
 * worse rather than better: opioid effect can outlast naloxone, so the
 * observation is part of the treatment rather than a formality after it.
 */
export type OpioidToxicityProgress = Pick<OpioidToxicitySnapshot,
  'patternReviewedAtTick' | 'ventilationAtTick' | 'antagonistAtTick'
  | 'initialReassessmentAtTick' | 'recurrenceReviewedAtTick' | 'recurrencePlanAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the five overlaps — so
 * the identity guard compares OPIOID_TOXICITY_OBJECTIVES instead.
 */
export const OPIOID_TOXICITY_ACTIONS = [
  'review-opioid-toxicity-pattern',
  'record-opioid-ventilation-support',
  'record-opioid-naloxone-intent',
  'reassess-opioid-initial-response',
  'review-opioid-recurrence',
  'record-opioid-recurrence-and-safety-plan',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const OPIOID_TOXICITY_OBJECTIVES = [
  'recognize-opioid-respiratory-emergency',
  'ventilate-opioid-toxicity-first',
  'record-opioid-antagonist-intent',
  'reassess-opioid-breathing-response',
  'manage-recurrent-opioid-depression',
] as const;

export type OpioidToxicityAction = (typeof OPIOID_TOXICITY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Both narratives are pinned by their own targets, which separates
 * this from toxicology's own opioid lessons.
 */
export function supportsOpioidToxicity(scenario: Scenario): boolean {
  return scenario.metadata.id === 'opioid-toxicity'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'opioid-toxicity').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'opioid-toxicity-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === OPIOID_TOXICITY_OBJECTIVES.join('|');
}
