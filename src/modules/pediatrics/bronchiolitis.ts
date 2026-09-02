import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the bronchiolitis lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps — including the wrong turn they most recently
 * took.
 */
export type BronchiolitisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['bronchiolitisAssessment']>;

/**
 * The six recorded steps, plus the last unsupported choice.
 *
 * `lastUnsupportedChoice` is not a step — it is how the engine reports that
 * one of the five ways to over-treat this infant was just tried and refused,
 * with him unchanged.
 */
export type BronchiolitisProgress = Pick<BronchiolitisSnapshot,
  'recognitionAtTick' | 'patternAtTick' | 'supportAtTick'
  | 'feedingHydrationAtTick' | 'laterResponseAtTick' | 'handoffAtTick' | 'lastUnsupportedChoice'>;

export const BRONCHIOLITIS_ACTIONS = [
  'reconcile-bronchiolitis-risk-and-trajectory',
  'recognize-bronchiolitis-supportive-care-pattern',
  'activate-bronchiolitis-oxygenation-and-monitoring',
  'review-bronchiolitis-feeding-and-hydration',
  'review-bronchiolitis-later-response',
  'handoff-bronchiolitis-active-risk',
] as const;

/**
 * The five choices this lesson offers and refuses, at three separate moments.
 *
 * Bronchiolitis is a disease people treat too much, so every one of these is
 * a way of doing something instead of the right thing: a routine radiograph,
 * a saturation watched on its own, a bronchodilator for a wheeze that is not
 * asthma, an antibiotic for a fever that is viral, and a discharge decided by
 * a number.
 */
export const BRONCHIOLITIS_UNSUPPORTED_ACTIONS = [
  'wait-for-bronchiolitis-routine-radiograph',
  'observe-bronchiolitis-saturation-alone',
  'select-routine-bronchiolitis-albuterol',
  'start-routine-bronchiolitis-antibiotic',
  'discharge-bronchiolitis-on-saturation-alone',
] as const;

export type BronchiolitisAction =
  (typeof BRONCHIOLITIS_ACTIONS)[number] | (typeof BRONCHIOLITIS_UNSUPPORTED_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * As throughout this module, the timeline targets carry a `-reassessment`
 * suffix that the scenario id does not.
 */
export function supportsBronchiolitis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'bronchiolitis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'bronchiolitis-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'bronchiolitis-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === BRONCHIOLITIS_ACTIONS.join('|');
}
