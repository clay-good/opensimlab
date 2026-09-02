import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the pediatric anaphylaxis lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type PediatricAnaphylaxisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pediatricAnaphylaxisAssessment']>;

/**
 * The six recorded steps.
 *
 * This engine case authors no refusable choice, and unlike the septic-shock,
 * dehydration, DKA, hypoglycemia, febrile-seizure and status-epilepticus
 * lessons it has no unordered pair either: the six steps are a strict line.
 * The broader safety review refuses until repeat first-line ownership is
 * recorded, which is the lesson's argument rather than an implementation
 * detail — nothing gets reviewed ahead of the second dose. Two time gates
 * follow, on the later report and on the handoff.
 *
 * Everything this lesson could conclude stays open: `anaphylaxisFinallyProven`,
 * `triggerConfirmed`, `airwayRiskResolved`, `shockResolved`,
 * `refractoryAnaphylaxisExcluded`, `biphasicReactionExcluded` and
 * `recurrenceExcluded` are all fixed `false`, including after the improving
 * minute-18 report.
 */
export type PediatricAnaphylaxisProgress = Pick<PediatricAnaphylaxisSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'firstLineAtTick'
  | 'safetyAtTick' | 'laterResponseAtTick' | 'handoffAtTick'>;

export const PEDIATRIC_ANAPHYLAXIS_ACTIONS = [
  'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child',
  'recognize-pediatric-anaphylaxis-persistent-abc-compromise',
  'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership',
  'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary',
  'review-pediatric-anaphylaxis-later-response',
  'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk',
] as const;

export type PediatricAnaphylaxisAction = (typeof PEDIATRIC_ANAPHYLAXIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsPediatricAnaphylaxis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pediatric-anaphylaxis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'pediatric-anaphylaxis-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'pediatric-anaphylaxis-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PEDIATRIC_ANAPHYLAXIS_ACTIONS.join('|');
}
