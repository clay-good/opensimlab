import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency diabetic-ketoacidosis
 * lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Pediatrics has its own weight-based DKA lesson
 * and endocrine has one about the resolution transition; this one is the adult
 * emergency-department arrival, and the guard rejects both on its own targets.
 */
export type DiabeticKetoacidosisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['diabeticKetoacidosisAssessment']>;

/**
 * Six recorded steps against five declared objectives, in one strict chain with
 * no time gates anywhere.
 *
 * The third step is the one that carries the lesson. Potassium is 3.2 mmol/L
 * and the engine refuses the insulin intent until replacement has been recorded
 * and the authored repeat comes back above 3.5 — insulin is what moves
 * potassium into cells, so in this patient it is the treatment that has to
 * wait.
 */
export type DiabeticKetoacidosisProgress = Pick<DiabeticKetoacidosisSnapshot,
  'presentationReviewedAtTick' | 'fluidsAtTick' | 'potassiumAtTick'
  | 'insulinAtTick' | 'dextroseAtTick' | 'transitionAtTick'>;

/**
 * The six control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the five overlaps — so
 * the identity guard compares DIABETIC_KETOACIDOSIS_OBJECTIVES instead.
 */
export const DIABETIC_KETOACIDOSIS_ACTIONS = [
  'review-dka-presentation',
  'record-dka-fluids-and-monitoring',
  'record-dka-potassium-replacement',
  'record-dka-insulin-intent',
  'add-dextrose-and-continue-insulin',
  'confirm-dka-resolution-and-transition',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const DIABETIC_KETOACIDOSIS_OBJECTIVES = [
  'recognize-moderate-dka',
  'begin-dka-fluid-and-monitoring-path',
  'correct-dka-potassium-before-insulin',
  'continue-insulin-with-dextrose-until-dka-resolves',
  'confirm-dka-resolution-and-transition',
] as const;

export type DiabeticKetoacidosisAction = (typeof DIABETIC_KETOACIDOSIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. The engine checks the scenario id as well as the narrative target
 * here, so the guard does too, and it pins both of the two narratives.
 */
export function supportsDiabeticKetoacidosis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'diabetic-ketoacidosis'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'diabetic-ketoacidosis').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'diabetic-ketoacidosis-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === DIABETIC_KETOACIDOSIS_OBJECTIVES.join('|');
}
