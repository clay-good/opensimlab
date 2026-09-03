import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the controls of the emergency
 * pulmonary-embolism-deterioration lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes. Critical care has its own massive-PE lesson and
 * respiratory medicine a post-PE dyspnoea one; this is the intermediate-risk
 * patient who becomes a high-risk one while you are treating them.
 */
export type PulmonaryEmbolismSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['pulmonaryEmbolismAssessment']>;

/**
 * Five recorded steps against four declared objectives.
 *
 * The severity review gates everything. Oxygen and anticoagulation are then
 * unordered against each other, the reassessment sits behind both plus one
 * further engine tick, and the escalation behind the reassessment — because
 * the deterioration has to be seen before it can be acted on.
 */
export type PulmonaryEmbolismProgress = Pick<PulmonaryEmbolismSnapshot,
  'severityReviewedAtTick' | 'oxygenAtTick' | 'anticoagulationAtTick'
  | 'deteriorationAtTick' | 'escalationAtTick'>;

/**
 * The five control ids the engine accepts.
 *
 * They are NOT the declared objective strings — none of the four overlaps — so
 * the identity guard compares PULMONARY_EMBOLISM_OBJECTIVES instead.
 */
export const PULMONARY_EMBOLISM_ACTIONS = [
  'review-confirmed-pe-severity',
  'record-titrated-oxygen',
  'record-therapeutic-anticoagulation-intent',
  'reassess-for-deterioration',
  'activate-pert-and-record-reperfusion-intent',
] as const;

/** The two initial intents the engine accepts in either order. */
export const PULMONARY_EMBOLISM_PARALLEL_ACTIONS = [
  'record-titrated-oxygen',
  'record-therapeutic-anticoagulation-intent',
] as const;

/** The four declared objectives, in order, as the scenario states them. */
export const PULMONARY_EMBOLISM_OBJECTIVES = [
  'classify-acute-pe-severity',
  'support-and-anticoagulate-acute-pe',
  'recognize-pe-deterioration',
  'escalate-deteriorating-pe',
] as const;

export type PulmonaryEmbolismAction = (typeof PULMONARY_EMBOLISM_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario. This lesson carries a single narrative event, which is what
 * separates it from critical care's massive-PE lesson.
 */
export function supportsPulmonaryEmbolism(scenario: Scenario): boolean {
  return scenario.metadata.id === 'pulmonary-embolism-deterioration'
    && scenario.timeline.filter((event) => event.type === 'narrative'
      && event.target === 'pulmonary-embolism-deterioration').length === 1
    && scenario.timeline.length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === PULMONARY_EMBOLISM_OBJECTIVES.join('|');
}
