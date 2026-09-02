import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the herniation lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type HerniationSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyHerniationAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no GCS
 * calculated, no imaging interpreted, no airway procedure performed, and in
 * particular no neurologic recovery proven — which are constants rather than
 * observations.
 */
export type HerniationProgress = Pick<HerniationSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'ownershipAtTick'
  | 'boundaryAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const HERNIATION_ACTIONS = [
  'reconcile-neurology-herniation-clock-consciousness-pupils-motor-physiology-and-whole-patient',
  'recognize-neurology-converging-transtentorial-herniation-pattern-without-isolated-pupil-or-complete-triad',
  'activate-neurology-herniation-qualified-airway-neurocritical-neurosurgical-and-brain-rescue-ownership',
  'review-neurology-herniation-immediate-systemic-brain-rescue-imaging-and-definitive-source-control-boundary',
  'review-neurology-herniation-strict-later-qualified-rescue-and-unresolved-neurologic-trajectory',
  'handoff-neurology-herniation-lesion-airway-pressure-seizure-surgery-and-active-risk',
] as const;

export type HerniationAction = (typeof HERNIATION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the pre-decline imaging and the
 * rescue boundary each need one of their own. That shape is required by name
 * rather than tolerated.
 */
export function supportsHerniation(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-transtentorial-herniation-pattern'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acute-transtentorial-herniation-pattern-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'acute-transtentorial-herniation-pattern-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === HERNIATION_ACTIONS.join('|');
}
