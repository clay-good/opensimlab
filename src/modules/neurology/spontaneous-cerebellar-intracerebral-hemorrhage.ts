import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the cerebellar-hemorrhage lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type CerebellarIchSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyCerebellarIchAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no hematoma
 * volume calculated, no etiology determined, no drain or surgery selected, and
 * in particular no reversal eligibility determined — which are constants rather
 * than observations.
 */
export type CerebellarIchProgress = Pick<CerebellarIchSnapshot,
  'trajectoryAtTick' | 'imagingAtTick' | 'boundaryAtTick'
  | 'ownershipAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const CEREBELLAR_ICH_ACTIONS = [
  'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient',
  'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats',
  'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary',
  'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership',
  'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory',
  'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk',
] as const;

export type CerebellarIchAction = (typeof CEREBELLAR_ICH_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives carry the whole lesson and no rhythm event belongs to it,
 * because nothing about the rhythm is the teaching. That is required by name
 * rather than tolerated.
 */
export function supportsCerebellarIch(scenario: Scenario): boolean {
  return scenario.metadata.id === 'spontaneous-cerebellar-intracerebral-hemorrhage'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'spontaneous-cerebellar-intracerebral-hemorrhage-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CEREBELLAR_ICH_ACTIONS.join('|');
}
