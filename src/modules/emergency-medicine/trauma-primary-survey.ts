import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency trauma-primary-survey
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes.
 */
export type TraumaPrimarySurveySnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['traumaPrimarySurveyAssessment']>;

/**
 * Six recorded steps against five declared objectives, in one strict chain with
 * no time gates anywhere.
 *
 * The order is the lesson. The engine refuses the airway review until the
 * catastrophic external haemorrhage is controlled, which is the "C" that sits
 * in front of ABCDE, and it refuses the repeat survey until everything before
 * it is done — because a primary survey that is performed once is a snapshot
 * of a patient who is still changing.
 */
export type TraumaPrimarySurveyProgress = Pick<TraumaPrimarySurveySnapshot,
  'activatedAtTick' | 'catastrophicHemorrhageAtTick' | 'airwayBreathingAtTick'
  | 'circulationAtTick' | 'disabilityExposureAtTick' | 'repeatedAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the five overlaps — so
 * the identity guard compares TRAUMA_PRIMARY_SURVEY_OBJECTIVES instead.
 */
export const TRAUMA_PRIMARY_SURVEY_ACTIONS = [
  'activate-trauma-primary-survey',
  'control-trauma-catastrophic-hemorrhage',
  'review-trauma-airway-and-breathing',
  'record-trauma-circulation-response',
  'review-trauma-disability-and-exposure',
  'repeat-trauma-primary-survey',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const TRAUMA_PRIMARY_SURVEY_OBJECTIVES = [
  'activate-structured-trauma-response',
  'control-catastrophic-trauma-hemorrhage',
  'assess-trauma-airway-and-breathing',
  'manage-trauma-circulation',
  'complete-and-repeat-trauma-survey',
] as const;

export type TraumaPrimarySurveyAction = (typeof TRAUMA_PRIMARY_SURVEY_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Both narratives are pinned by their own targets.
 */
export function supportsTraumaPrimarySurvey(scenario: Scenario): boolean {
  return scenario.metadata.id === 'trauma-primary-survey'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'trauma-primary-survey').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'trauma-primary-survey-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === TRAUMA_PRIMARY_SURVEY_OBJECTIVES.join('|');
}
