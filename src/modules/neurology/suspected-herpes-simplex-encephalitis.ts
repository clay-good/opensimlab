import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the encephalitis lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type EncephalitisSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyEncephalitisAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no imaging or
 * EEG interpreted, no regimen chosen, and in particular no pathogen identified
 * — which are constants rather than observations.
 */
export type EncephalitisProgress = Pick<EncephalitisSnapshot,
  'trajectoryAtTick' | 'ownershipAtTick' | 'treatmentAtTick'
  | 'diagnosticsAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const ENCEPHALITIS_ACTIONS = [
  'reconcile-neurology-encephalitis-clock-cognition-language-focal-seizure-and-whole-patient',
  'activate-neurology-encephalitis-qualified-neurocritical-infection-airway-and-seizure-ownership',
  'activate-neurology-encephalitis-qualified-immediate-empiric-antiviral-pathway-without-test-delay',
  'review-neurology-encephalitis-mri-eeg-csf-etiology-and-nonconvulsive-seizure-boundary',
  'review-neurology-encephalitis-strict-later-early-negative-hsv-pcr-and-clinical-trajectory',
  'handoff-neurology-encephalitis-repeat-testing-antiviral-seizure-autoimmune-and-active-risk',
] as const;

export type EncephalitisAction = (typeof ENCEPHALITIS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Three narratives carry this lesson, because the blood and CSF panel and the
 * syndrome boundary each need one of their own. That shape is required by name
 * rather than tolerated.
 */
export function supportsEncephalitis(scenario: Scenario): boolean {
  return scenario.metadata.id === 'suspected-herpes-simplex-encephalitis'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'suspected-herpes-simplex-encephalitis-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'suspected-herpes-simplex-encephalitis-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ENCEPHALITIS_ACTIONS.join('|');
}
