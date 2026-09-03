import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the unplanned-extubation lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type UnplannedExtubationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['unplannedExtubationAssessment']>;

/**
 * Five recorded steps against five declared objectives, in one strict chain —
 * the shape this module shares.
 *
 * The assessment step exists because the obvious answer is right here and is
 * not always right: most unplanned extubations do not need the tube back, and
 * this one does. The engine makes the learner establish which kind this is
 * before the airway plan, so that a correct decision is a conclusion rather
 * than a reflex that happened to land.
 */
export type UnplannedExtubationProgress = Pick<UnplannedExtubationSnapshot,
  'supportAtTick' | 'assessmentAtTick' | 'failureAtTick'
  | 'airwayPlanAtTick' | 'reassessmentAtTick'>;

export const UNPLANNED_EXTUBATION_ACTIONS = [
  'support-unplanned-extubation-and-call-help',
  'assess-unplanned-extubation-tolerance',
  'classify-unplanned-extubation-failure',
  'record-unplanned-extubation-airway-plan',
  'reassess-unplanned-extubation-response',
] as const;

export type UnplannedExtubationAction = (typeof UNPLANNED_EXTUBATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsUnplannedExtubation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'unplanned-extubation'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'unplanned-extubation').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'unplanned-extubation-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === UNPLANNED_EXTUBATION_ACTIONS.join('|');
}
