import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the methemoglobinemia lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MethemoglobinemiaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyMethemoglobinemiaAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no gas
 * acquired, no gap calculated, no dose chosen, no rebound excluded — which are
 * constants rather than observations.
 */
export type MethemoglobinemiaProgress = Pick<MethemoglobinemiaSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'hazardsAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const METHEMOGLOBINEMIA_ACTIONS = [
  'reconcile-toxicology-methemoglobinemia-exposure-cyanosis-symptoms-pulse-ox-arterial-oxygen-and-whole-patient',
  'recognize-toxicology-methemoglobinemia-dyshemoglobin-pattern-without-single-number-or-diagnostic-closure',
  'activate-toxicology-methemoglobinemia-support-monitoring-source-control-poison-center-and-critical-care-ownership',
  'review-toxicology-methemoglobinemia-supplied-cooximetry-and-methylene-blue-hazard-boundary',
  'record-toxicology-methemoglobinemia-bounded-qualified-team-antidote-intent-and-strict-reassessment',
  'handoff-toxicology-methemoglobinemia-exposure-rebound-hemolysis-serotonin-rescue-and-active-risk',
] as const;

export type MethemoglobinemiaAction = (typeof METHEMOGLOBINEMIA_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsMethemoglobinemia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'methemoglobinemia-saturation-gap'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'methemoglobinemia-saturation-gap-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'methemoglobinemia-saturation-gap-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === METHEMOGLOBINEMIA_ACTIONS.join('|');
}
