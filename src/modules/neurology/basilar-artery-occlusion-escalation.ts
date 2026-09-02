import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the basilar-occlusion lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type BasilarLvoSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyBasilarLvoAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no score
 * calculated, no mimic excluded, no airway procedure performed, and in
 * particular no eligibility determined — which are constants rather than
 * observations.
 */
export type BasilarLvoProgress = Pick<BasilarLvoSnapshot,
  'trajectoryAtTick' | 'imagingAtTick' | 'boundaryAtTick'
  | 'activationAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const BASILAR_LVO_ACTIONS = [
  'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient',
  'review-neurology-basilar-lvo-imaging-selection-and-open-mimics',
  'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary',
  'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership',
  'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory',
  'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome',
] as const;

export type BasilarLvoAction = (typeof BASILAR_LVO_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Two narratives carry the whole lesson and no rhythm event belongs to it,
 * because nothing about the rhythm is the teaching. That is required by name
 * rather than tolerated.
 */
export function supportsBasilarLvo(scenario: Scenario): boolean {
  return scenario.metadata.id === 'basilar-artery-occlusion-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'basilar-artery-occlusion-escalation-reassessment').length === 1
    && scenario.timeline.filter((event) => event.target === 'basilar-artery-occlusion-escalation-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === BASILAR_LVO_ACTIONS.join('|');
}
