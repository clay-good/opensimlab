import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency anaphylaxis lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Pediatrics has its own, separate anaphylaxis
 * lesson with weight-based controls; this one is the adult fixed-dose case, and
 * the guard rejects the other on its own timeline target.
 */
export type EmergencyAnaphylaxisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['emergencyAnaphylaxisAssessment']>;

/**
 * Six recorded steps against four declared objectives.
 *
 * The first three are a strict chain and the fourth step is where the lesson
 * lives: the engine gates the intramuscular epinephrine ahead of both
 * supportive adjuncts, because oxygen and a line feel like prerequisites for
 * the drug and are not. The two adjuncts that follow are unordered against each
 * other, and the reassessment sits behind both plus one further tick.
 */
export type EmergencyAnaphylaxisProgress = Pick<EmergencyAnaphylaxisSnapshot,
  'patternReviewedAtTick' | 'positionedAndHelpedAtTick' | 'imEpinephrineAtTick'
  | 'oxygenAtTick' | 'crystalloidAtTick' | 'reassessedAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares EMERGENCY_ANAPHYLAXIS_OBJECTIVES instead.
 */
export const EMERGENCY_ANAPHYLAXIS_ACTIONS = [
  'review-systemic-pattern',
  'position-and-call-for-help',
  'give-im-epinephrine',
  'give-high-flow-oxygen',
  'begin-fixed-crystalloid',
  'reassess-response',
] as const;

/** The two supportive adjuncts the engine accepts in either order. */
export const EMERGENCY_ANAPHYLAXIS_PARALLEL_ACTIONS = [
  'give-high-flow-oxygen',
  'begin-fixed-crystalloid',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const EMERGENCY_ANAPHYLAXIS_OBJECTIVES = [
  'recognize-ed-anaphylaxis-pattern',
  'give-first-line-im-epinephrine',
  'support-anaphylaxis-airway-and-circulation',
  'reassess-initial-anaphylaxis-response',
] as const;

export type EmergencyAnaphylaxisAction = (typeof EMERGENCY_ANAPHYLAXIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario — including the pediatric anaphylaxis lesson, whose narrative
 * boundary carries a different target.
 */
export function supportsEmergencyAnaphylaxis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'anaphylaxis'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'emergency-anaphylaxis').length === 1
    && scenario.timeline.filter((event) => event.type === 'anaphylaxis').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === EMERGENCY_ANAPHYLAXIS_OBJECTIVES.join('|');
}
