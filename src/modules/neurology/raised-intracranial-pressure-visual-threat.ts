import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the raised-pressure lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type RaisedIcpSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyRaisedIcpAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no eyes
 * examined, no ophthalmic study interpreted, no lumbar puncture performed, and
 * in particular no visual rescue proven — which are constants rather than
 * observations.
 */
export type RaisedIcpProgress = Pick<RaisedIcpSnapshot,
  'trajectoryAtTick' | 'ownershipAtTick' | 'eyesAtTick'
  | 'diagnosticsAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const RAISED_ICP_ACTIONS = [
  'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient',
  'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership',
  'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary',
  'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary',
  'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat',
  'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk',
] as const;

export type RaisedIcpAction = (typeof RAISED_ICP_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the neuro-ophthalmic findings and
 * the imaging and pressure boundary each need one of their own. That shape is
 * required by name rather than tolerated.
 */
export function supportsRaisedIcp(scenario: Scenario): boolean {
  return scenario.metadata.id === 'raised-intracranial-pressure-visual-threat'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'raised-intracranial-pressure-visual-threat-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'raised-intracranial-pressure-visual-threat-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === RAISED_ICP_ACTIONS.join('|');
}
