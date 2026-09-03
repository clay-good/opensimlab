import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency cardiac-tamponade
 * lesson.
 *
 * The model lives in the shared engine, and unusually for these lessons it
 * keeps running against the learner: the obstructive physiology stays active
 * after every accepted action, because the treatment for this is somewhere
 * else. What was missing was a name for the state the engine publishes.
 * Cardiology has its own, separate medical pericardial-tamponade lesson; this
 * one is the penetrating-trauma case.
 */
export type CardiacTamponadeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['cardiacTamponadeAssessment']>;

/**
 * Four recorded steps against four declared objectives, in one strict chain.
 *
 * The last step is the one that carries the lesson. It records a reassessment
 * that finds nothing better — the engine says so in as many words — because
 * the accepted intent mobilised a team rather than relieving a pericardium.
 */
export type CardiacTamponadeProgress = Pick<CardiacTamponadeSnapshot,
  'contextReviewedAtTick' | 'pocusReviewedAtTick' | 'definitiveControlAtTick'
  | 'reassessedAtTick'>;

/**
 * The four control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares CARDIAC_TAMPONADE_OBJECTIVES instead. Note also
 * that the engine action type is `cardiac-tamponade-assessment`, not the
 * `-response` suffix most of these lessons use.
 */
export const CARDIAC_TAMPONADE_ACTIONS = [
  'review-context-and-perfusion',
  'review-fixed-pocus',
  'record-definitive-control-intent',
  'reassess-perfusion',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const CARDIAC_TAMPONADE_OBJECTIVES = [
  'recognize-traumatic-tamponade-pattern',
  'review-tamponade-focused-pocus',
  'escalate-traumatic-tamponade-control',
  'reassess-traumatic-tamponade',
] as const;

export type CardiacTamponadeAction = (typeof CARDIAC_TAMPONADE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including cardiology's medical pericardial-tamponade lesson. The
 * engine gates on the tamponade event's own target, so the guard does too.
 */
export function supportsCardiacTamponade(scenario: Scenario): boolean {
  return scenario.metadata.id === 'cardiac-tamponade'
    && scenario.timeline.filter((event) => event.type === 'cardiac-tamponade'
      && event.target === 'traumatic-pericardial-pressure').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'cardiac-tamponade').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CARDIAC_TAMPONADE_OBJECTIVES.join('|');
}
