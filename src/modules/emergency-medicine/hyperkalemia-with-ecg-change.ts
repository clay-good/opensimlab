import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency hyperkalemia lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Cardiology and renal each have their own,
 * separate hyperkalemia lessons — conduction disturbance and cardioprotection
 * with rebound — and the guard rejects both on this scenario's own targets.
 */
export type HyperkalemiaWithEcgChangeSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['hyperkalemiaAssessment']>;

/**
 * Seven recorded steps against five declared objectives.
 *
 * Two are a strict opening chain — the review, then the calcium — and the four
 * that follow are unordered against each other. Two separate time gates then
 * apply: the post-calcium ECG report cannot be read on the same tick the
 * calcium intent was recorded, and the final panel cannot be read on the same
 * tick as the last of the four lanes.
 */
export type HyperkalemiaWithEcgChangeProgress = Pick<HyperkalemiaWithEcgChangeSnapshot,
  'patternReviewedAtTick' | 'calciumAtTick' | 'postCalciumEcgAtTick'
  | 'insulinGlucoseAtTick' | 'betaAgonistAtTick' | 'removalAtTick' | 'reassessedAtTick'>;

/**
 * The seven control ids the engine accepts. Note the action type is
 * `hyperkalemia-response`, shorter than the scenario id.
 *
 * They are NOT the declared objective strings — none of the five overlaps — so
 * the identity guard compares HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES instead.
 */
export const HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS = [
  'review-hyperkalemia-pattern',
  'record-hyperkalemia-calcium-intent',
  'review-hyperkalemia-post-calcium-ecg',
  'record-hyperkalemia-insulin-glucose',
  'record-hyperkalemia-beta-agonist',
  'record-hyperkalemia-removal-and-cause-control',
  'reassess-hyperkalemia',
] as const;

/** The four lanes the engine accepts in any order once calcium is recorded. */
export const HYPERKALEMIA_WITH_ECG_CHANGE_PARALLEL_ACTIONS = [
  'review-hyperkalemia-post-calcium-ecg',
  'record-hyperkalemia-insulin-glucose',
  'record-hyperkalemia-beta-agonist',
  'record-hyperkalemia-removal-and-cause-control',
] as const;

/** The five declared objectives, in order, as the scenario states them. */
export const HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES = [
  'recognize-severe-hyperkalemia-toxicity',
  'protect-heart-in-hyperkalemia',
  'shift-potassium-and-protect-glucose',
  'remove-potassium-and-control-cause',
  'reassess-hyperkalemia-and-rebound',
] as const;

export type HyperkalemiaWithEcgChangeAction = (typeof HYPERKALEMIA_WITH_ECG_CHANGE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. Both narratives are pinned by their own targets, which is what
 * separates this from the cardiology and renal hyperkalemia lessons.
 */
export function supportsHyperkalemiaWithEcgChange(scenario: Scenario): boolean {
  return scenario.metadata.id === 'hyperkalemia-with-ecg-change'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hyperkalemia-with-ecg-change').length === 1
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'hyperkalemia-with-ecg-change-boundary').length === 1
    && scenario.timeline.length === 2
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HYPERKALEMIA_WITH_ECG_CHANGE_OBJECTIVES.join('|');
}
