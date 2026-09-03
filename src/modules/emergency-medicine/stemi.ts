import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency STEMI lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Cardiology has its own clinic-STEMI lesson and a
 * separate recognition lesson; this one is the emergency-department arrival in
 * a declared PCI-capable setting.
 */
export type StemiSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['stemiAssessment']>;

/**
 * Five recorded steps against four declared objectives.
 *
 * The pattern review gates everything. The three that follow — pathway
 * activation, the aspirin load, and the P2Y12 plus parenteral anticoagulation —
 * are unordered against each other, and the handoff sits behind all three plus
 * one further engine tick.
 */
export type StemiProgress = Pick<StemiSnapshot,
  'patternReviewedAtTick' | 'pathwayActivatedAtTick' | 'aspirinAtTick'
  | 'additionalAntithromboticsAtTick' | 'reassessedAtTick'>;

/**
 * The five control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares STEMI_OBJECTIVES instead.
 */
export const STEMI_ACTIONS = [
  'review-stemi-pattern',
  'activate-stemi-pathway',
  'record-aspirin-load',
  'record-p2y12-anticoagulation-intent',
  'reassess-and-handoff',
] as const;

/** The three the engine accepts in any order once the pattern is reviewed. */
export const STEMI_PARALLEL_ACTIONS = [
  'activate-stemi-pathway',
  'record-aspirin-load',
  'record-p2y12-anticoagulation-intent',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const STEMI_OBJECTIVES = [
  'recognize-stemi-pattern',
  'activate-stemi-reperfusion',
  'record-stemi-antithrombotic-intent',
  'reassess-and-handoff-stemi',
] as const;

export type StemiAction = (typeof STEMI_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. This lesson carries a single narrative event, which is what
 * separates it from cardiology's clinic-STEMI and recognition lessons.
 */
export function supportsStemi(scenario: Scenario): boolean {
  return scenario.metadata.id === 'stemi'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'stemi').length === 1
    && scenario.timeline.length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === STEMI_OBJECTIVES.join('|');
}
