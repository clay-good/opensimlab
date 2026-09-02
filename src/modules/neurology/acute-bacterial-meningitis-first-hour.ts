import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the bacterial-meningitis lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MeningitisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyMeningitisAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no lumbar
 * puncture performed, no CSF interpreted, no regimen chosen, and in particular
 * no pathogen identified — which are constants rather than observations.
 */
export type MeningitisProgress = Pick<MeningitisSnapshot,
  'trajectoryAtTick' | 'ownershipAtTick' | 'diagnosticsAtTick'
  | 'treatmentAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const MENINGITIS_ACTIONS = [
  'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient',
  'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership',
  'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary',
  'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay',
  'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory',
  'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk',
] as const;

export type MeningitisAction = (typeof MENINGITIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the blood panel and the
 * lumbar-puncture safety boundary each need one of their own. That shape is
 * required by name rather than tolerated.
 */
export function supportsMeningitis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acute-bacterial-meningitis-first-hour'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acute-bacterial-meningitis-first-hour-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'acute-bacterial-meningitis-first-hour-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MENINGITIS_ACTIONS.join('|');
}
